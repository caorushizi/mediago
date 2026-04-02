// MediaGo download service main entry point
package main

import (
	"flag"
	"os"
	"path/filepath"
	"runtime"

	"github.com/google/uuid"

	"caorushizi.cn/mediago/internal/api"
	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/core/runner"
	"caorushizi.cn/mediago/internal/core/schema"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/logger"
	"caorushizi.cn/mediago/internal/tasklog"
	"caorushizi.cn/mediago/pkg/conf"
	"github.com/gin-gonic/gin"
)

// @title MediaGo Downloader API
// @version 1.0
// @description MediaGo multi-task download system API documentation
// @description Supports M3U8, Bilibili, and Direct download types
// @description Provides task management, configuration updates, and real-time event streaming
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url https://github.com/caorushizi/mediago-core
// @contact.email support@mediago.local

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api
// @schemes http https

// @tag.name Health
// @tag.description Health check endpoints
// @tag.name Tasks
// @tag.description Download task management endpoints
// @tag.name Config
// @tag.description System configuration endpoints
// @tag.name Events
// @tag.description Real-time event streaming endpoints

// AppConfig stores all startup configuration options (passed via command-line flags or environment variables).
type AppConfig struct {
	GinMode        string `json:"gin_mode"`
	Host           string `json:"host"`
	Port           string `json:"port"`
	LogLevel       string `json:"log_level"`
	LogDir         string `json:"log_dir"`
	SchemaPath     string `json:"schema_path"`
	M3U8Bin        string `json:"m3u8_bin"`
	BilibiliBin    string `json:"bilibili_bin"`
	DirectBin      string `json:"direct_bin"`
	MaxRunner      int    `json:"max_runner"`
	LocalDir       string `json:"local_dir"`
	DeleteSegments bool   `json:"delete_segments"`
	Proxy          string `json:"proxy"`
	UseProxy       bool   `json:"use_proxy"`
	DBPath         string `json:"db_path"`
	ConfigDir      string `json:"config_dir"`
	FFmpegBin      string `json:"ffmpeg_bin"`
	EnableAuth     bool   `json:"enable_auth"`
	StaticDir      string `json:"static_dir"`
}

func (c *AppConfig) GetLocalDir() string {
	return c.LocalDir
}

func (c *AppConfig) GetDeleteSegments() bool {
	return c.DeleteSegments
}

func (c *AppConfig) GetProxy() string {
	return c.Proxy
}

func (c *AppConfig) GetUseProxy() bool {
	return c.UseProxy
}

func (c *AppConfig) SetLocalDir(dir string) {
	c.LocalDir = dir
}

func (c *AppConfig) SetDeleteSegments(del bool) {
	c.DeleteSegments = del
}

func (c *AppConfig) SetProxy(proxy string) {
	c.Proxy = proxy
}

func (c *AppConfig) SetUseProxy(useProxy bool) {
	c.UseProxy = useProxy
}

// getSystemDownloadsDir returns the system downloads directory.
// Prefers $HOME/Downloads; falls back to $HOME if it does not exist.
func getSystemDownloadsDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	downloads := filepath.Join(home, "Downloads")
	if info, err := os.Stat(downloads); err == nil && info.IsDir() {
		return downloads
	}
	return home
}

func main() {
	// 1. Initialize the logger with default config first so it is available during config parsing
	// if err := logger.Init(logger.DefaultConfig()); err != nil {
	// 	panic("Failed to initialize logger: " + err.Error())
	// }

	// 2. Initialize and parse configuration
	cfg := initConfig()

	// 3. Re-initialize the logger using the resolved configuration
	logCfg := logger.DefaultConfig()
	logCfg.Level = cfg.LogLevel
	logCfg.LogDir = cfg.LogDir

	if err := logger.Init(logCfg); err != nil {
		logger.Fatalf("Failed to reinitialize logger with config: %v", err)
	}
	defer logger.Sync()

	logger.Info("MediaGo Downloader Service Starting...")
	logger.Infof("Final Config: %+v", cfg)

	// 4. Initialize AppStore configuration (user-level persistent config)
	appStore, err := conf.New(conf.Options[AppStore]{
		ConfigName: "config",
		CWD:        cfg.ConfigDir,
		Defaults:   defaultAppStore(),
	})
	if err != nil {
		logger.Fatalf("Failed to initialize app store: %v", err)
	}
	logger.Infof("App store initialized at: %s", appStore.Path())

	// Ensure machineId is set (generate on first run)
	if appStore.Store().MachineId == "" {
		newId := uuid.New().String()
		_ = appStore.Set("machineId", newId)
		logger.Infof("Generated new machineId: %s", newId)
	}

	// Sync appStore values back into cfg (so cfg reflects the final state of persistent config).
	// Note: CLI arguments are no longer written into appStore to avoid overwriting settings
	// saved by the user in the UI on every startup. CLI args serve only as initial defaults;
	// appStore (user config) takes higher priority.
	syncAppStoreToCfg(appStore, cfg)

	// If the download directory is empty, is the default value, or does not exist, use the system downloads directory
	{
		needDefault := cfg.LocalDir == "" || cfg.LocalDir == "./downloads"
		if !needDefault {
			if info, err := os.Stat(cfg.LocalDir); err != nil || !info.IsDir() {
				needDefault = true
			}
		}
		if needDefault {
			sysDownloads := getSystemDownloadsDir()
			logger.Infof("Download dir %q unavailable, using system default: %s", cfg.LocalDir, sysDownloads)
			cfg.LocalDir = sysDownloads
			_ = appStore.Set("local", sysDownloads)
		}
	}

	// 5. Load JSON Schema configuration
	logger.Infof("Loading schemas from: %s", cfg.SchemaPath)
	schemas, err := schema.LoadSchemasFromJSON(cfg.SchemaPath)
	if err != nil {
		logger.Fatalf("Failed to load schemas: %v", err)
	}
	logger.Infof("Loaded %d download schemas", len(schemas.Schemas))

	// 6. Configure downloader binary paths
	binMap := getBinaryMap(cfg)
	for dt, binPath := range binMap {
		logger.Infof("%s downloader: %s", dt, binPath)
		if binPath == "" {
			continue
		}
		if info, err := os.Stat(binPath); err != nil {
			logger.Warnf("%s binary not found: %v", dt, err)
		} else if info.Mode()&0o111 == 0 {
			logger.Warnf("%s binary is not executable: %s", dt, binPath)
		}
	}

	// 7. Create core components
	r := runner.NewPTYRunner()
	downloader := core.NewDownloader(binMap, r, schemas, cfg)
	queue := core.NewTaskQueue(downloader, cfg.MaxRunner)
	taskLogs := tasklog.NewManager(filepath.Join(cfg.LogDir, "tasks"))

	logger.Infof("Task queue initialized (maxRunner=%d)", cfg.MaxRunner)
	logger.Infof("Task logs will be stored in %s", filepath.Join(cfg.LogDir, "tasks"))

	// 8. Watch appStore changes and sync them to the downloader
	appStore.OnDidChange("maxRunner", func(newVal, oldVal any) {
		if v, ok := toInt(newVal); ok {
			queue.SetMaxRunner(v)
			logger.Infof("maxRunner updated to %d via config change", v)
		}
	})
	appStore.OnDidChange("proxy", func(newVal, oldVal any) {
		if v, ok := newVal.(string); ok {
			cfg.SetProxy(v)
			logger.Infof("proxy updated to %q via config change", v)
		}
	})
	appStore.OnDidChange("useProxy", func(newVal, oldVal any) {
		if v, ok := newVal.(bool); ok {
			cfg.SetUseProxy(v)
			logger.Infof("useProxy updated to %v via config change", v)
		}
	})
	appStore.OnDidChange("deleteSegments", func(newVal, oldVal any) {
		if v, ok := newVal.(bool); ok {
			cfg.SetDeleteSegments(v)
			logger.Infof("deleteSegments updated to %v via config change", v)
		}
	})
	appStore.OnDidChange("local", func(newVal, oldVal any) {
		if v, ok := newVal.(string); ok {
			cfg.SetLocalDir(v)
			logger.Infof("localDir updated to %q via config change", v)
		}
	})

	// 9. Initialize database (optional)
	var database *db.Database
	if cfg.DBPath != "" {
		// Ensure the database parent directory exists
		if dir := filepath.Dir(cfg.DBPath); dir != "" {
			if err := os.MkdirAll(dir, 0o755); err != nil {
				logger.Fatalf("Failed to create database directory %s: %v", dir, err)
			}
		}
		var dbErr error
		database, dbErr = db.New(cfg.DBPath)
		if dbErr != nil {
			logger.Fatalf("Failed to open database: %v", dbErr)
		}
		defer database.Close()
		logger.Infof("Database opened: %s", cfg.DBPath)
	} else {
		logger.Info("No database path provided, running without persistence")
	}

	// 10. Start HTTP server
	confStore := handler.WrapConfStore[AppStore](appStore)
	execPath, _ := os.Executable()
	server := api.NewServer(queue, taskLogs, database, confStore, api.ServerOptions{
		EnableAuth: cfg.EnableAuth,
		StaticDir:  cfg.StaticDir,
		FFmpegBin:  cfg.FFmpegBin,
		VideoRoot:  cfg.LocalDir,
		EnvPaths: handler.EnvPaths{
			ConfigDir: cfg.ConfigDir,
			BinDir:    filepath.Dir(execPath),
			Platform:  runtime.GOOS,
		},
	})
	addr := cfg.Host + ":" + cfg.Port
	gin.SetMode(cfg.GinMode)
	logger.Infof("Starting HTTP server on %s", addr)

	if err := server.Run(addr); err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}

// syncAppStoreToCfg reads appStore values back into cfg.
func syncAppStoreToCfg(store *conf.Conf[AppStore], cfg *AppConfig) {
	s := store.Store()
	if s.Local != "" {
		cfg.LocalDir = s.Local
	}
	cfg.Proxy = s.Proxy
	cfg.UseProxy = s.UseProxy
	cfg.DeleteSegments = s.DeleteSegments
	if s.MaxRunner > 0 {
		cfg.MaxRunner = s.MaxRunner
	}
}

// initConfig initializes configuration following priority order: CLI flags > environment variables > JSON string > defaults.
func initConfig() *AppConfig {
	// Default configuration
	cfg := &AppConfig{
		GinMode:        "release",
		Host:           "0.0.0.0",
		Port:           "8080",
		LogLevel:       "info",
		LogDir:         "./logs",
		SchemaPath:     "", // computed later
		M3U8Bin:        "",
		BilibiliBin:    "",
		DirectBin:      "",
		MaxRunner:      2,
		LocalDir:       "./downloads",
		DeleteSegments: true,
		Proxy:          "",
		UseProxy:       false,
		ConfigDir:      "",
	}

	// 1. Define command-line flags
	flag.StringVar(&cfg.LogLevel, "log-level", cfg.LogLevel, "Log level (debug/info/warn/error)")
	flag.StringVar(&cfg.LogDir, "log-dir", cfg.LogDir, "Log directory")
	flag.StringVar(&cfg.M3U8Bin, "m3u8-bin", cfg.M3U8Bin, "M3U8 downloader binary path")
	flag.StringVar(&cfg.BilibiliBin, "bilibili-bin", cfg.BilibiliBin, "Bilibili downloader binary path")
	flag.StringVar(&cfg.DirectBin, "direct-bin", cfg.DirectBin, "Direct downloader binary path")
	flag.StringVar(&cfg.SchemaPath, "schema-path", cfg.SchemaPath, "Path to the download schema config.json")
	flag.StringVar(&cfg.Port, "port", cfg.Port, "Server port")
	flag.StringVar(&cfg.LocalDir, "local-dir", cfg.LocalDir, "Default download directory")
	flag.BoolVar(&cfg.DeleteSegments, "delete-segments", cfg.DeleteSegments, "Delete segments after download")
	flag.StringVar(&cfg.Proxy, "proxy", cfg.Proxy, "Proxy for downloader")
	flag.BoolVar(&cfg.UseProxy, "use-proxy", cfg.UseProxy, "Enable proxy")
	flag.IntVar(&cfg.MaxRunner, "max-runner", cfg.MaxRunner, "Maximum concurrent download runners")
	flag.StringVar(&cfg.DBPath, "db-path", cfg.DBPath, "Path to SQLite database file")
	flag.StringVar(&cfg.ConfigDir, "config-dir", cfg.ConfigDir, "Directory for persistent config file")
	flag.StringVar(&cfg.FFmpegBin, "ffmpeg-bin", cfg.FFmpegBin, "FFmpeg binary path")
	flag.BoolVar(&cfg.EnableAuth, "enable-auth", cfg.EnableAuth, "Enable API key authentication")
	flag.StringVar(&cfg.StaticDir, "static-dir", cfg.StaticDir, "Directory to serve static files from (SPA mode)")

	flag.Parse()

	// 3. Load from environment variables (overrides JSON and defaults)
	cfg.GinMode = getEnv("GIN_MODE", cfg.GinMode)
	cfg.Host = getEnv("HOST", cfg.Host)
	cfg.Port = getEnv("PORT", cfg.Port)
	cfg.DBPath = getEnv("DB_PATH", cfg.DBPath)

	// If SchemaPath is still empty, compute its default value
	if cfg.SchemaPath == "" {
		cfg.SchemaPath = getDefaultSchemaPath()
	}

	// If ConfigDir is empty, default to the LogDir path
	if cfg.ConfigDir == "" {
		cfg.ConfigDir = cfg.LogDir
	}

	return cfg
}

// getDefaultSchemaPath returns the default path for the schema config file.
func getDefaultSchemaPath() string {
	// Default path: prefer config.json in the same directory as the executable
	execPath, _ := os.Executable()
	execDir := filepath.Dir(execPath)
	localConfig := filepath.Join(execDir, "config.json")
	if _, err := os.Stat(localConfig); err == nil {
		return localConfig
	}
	// Fall back to the config file path inside the repository
	return "configs/config.json"
}

// getBinaryMap returns a map of downloader binary paths from the configuration.
func getBinaryMap(cfg *AppConfig) map[core.DownloadType]string {
	return map[core.DownloadType]string{
		core.TypeM3U8:     cfg.M3U8Bin,
		core.TypeBilibili: cfg.BilibiliBin,
		core.TypeDirect:   cfg.DirectBin,
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// toInt converts a JSON-decoded number (float64) or int to int.
func toInt(v any) (int, bool) {
	switch n := v.(type) {
	case float64:
		return int(n), true
	case int:
		return n, true
	case int64:
		return int(n), true
	}
	return 0, false
}
