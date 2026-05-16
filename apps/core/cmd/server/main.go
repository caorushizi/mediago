// MediaGo download service main entry point
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"caorushizi.cn/mediago/internal/api"
	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/app"
	"caorushizi.cn/mediago/internal/logger"
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

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	cfg := app.DefaultConfig()
	fs := flag.NewFlagSet("mediago-core server", flag.ContinueOnError)
	registerConfigFlags(fs, cfg)
	if err := fs.Parse(args); err != nil {
		if err == flag.ErrHelp {
			return nil
		}
		return err
	}
	cfg.ApplyEnvAndDefaults()

	if err := app.InitLogger(cfg); err != nil {
		return err
	}
	defer logger.Sync()

	rt, err := app.NewRuntime(cfg)
	if err != nil {
		return err
	}
	defer rt.Close()

	return runServer(rt)
}

func registerConfigFlags(fs *flag.FlagSet, cfg *app.AppConfig) {
	fs.StringVar(&cfg.LogLevel, "log-level", cfg.LogLevel, "Log level (debug/info/warn/error)")
	fs.StringVar(&cfg.LogDir, "log-dir", cfg.LogDir, "Log directory")
	fs.StringVar(&cfg.DepsDir, "deps-dir", cfg.DepsDir, "Directory containing downloader tool binaries")
	fs.StringVar(&cfg.SchemaPath, "schema-path", cfg.SchemaPath, "Path to the download schema config.json")
	fs.StringVar(&cfg.Port, "port", cfg.Port, "Server port")
	fs.StringVar(&cfg.LocalDir, "local-dir", cfg.LocalDir, "Default download directory")
	fs.BoolVar(&cfg.DeleteSegments, "delete-segments", cfg.DeleteSegments, "Delete segments after download")
	fs.StringVar(&cfg.Proxy, "proxy", cfg.Proxy, "Proxy for downloader")
	fs.BoolVar(&cfg.UseProxy, "use-proxy", cfg.UseProxy, "Enable proxy")
	fs.IntVar(&cfg.MaxRunner, "max-runner", cfg.MaxRunner, "Maximum concurrent download runners")
	fs.StringVar(&cfg.DBPath, "db-path", cfg.DBPath, "Path to SQLite database file")
	fs.StringVar(&cfg.ConfigDir, "config-dir", cfg.ConfigDir, "Directory for persistent config file")
	fs.BoolVar(&cfg.EnableAuth, "enable-auth", cfg.EnableAuth, "Enable API key authentication")
	fs.StringVar(&cfg.StaticDir, "static-dir", cfg.StaticDir, "Directory to serve static files from (SPA mode)")
}

func runServer(rt *app.Runtime) error {
	cfg := rt.Config
	confStore := handler.WrapConfStore[app.AppStore](rt.AppStore)
	execPath, _ := os.Executable()
	server := api.NewServer(rt.Queue, rt.TaskLogs, rt.Database, confStore, api.ServerOptions{
		EnableAuth: cfg.EnableAuth,
		StaticDir:  cfg.StaticDir,
		FFmpegBin:  app.FFmpegBinPath(cfg),
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

	return server.Run(addr)
}
