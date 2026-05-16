package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"

	"github.com/google/uuid"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"

	"caorushizi.cn/mediago/internal/app"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/logger"
)

func main() {
	if err := newRootCommand().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func newRootCommand() *cobra.Command {
	cfg := app.DefaultConfig()
	rootCmd := &cobra.Command{
		Use:   "mediago-cli",
		Short: "MediaGo command-line interface",
		Long:  "MediaGo CLI directly uses the core downloader runtime without going through the HTTP API server.",
	}
	addConfigFlags(rootCmd.PersistentFlags(), cfg)
	rootCmd.AddCommand(newDownloadCommand(cfg))
	return rootCmd
}

func newDownloadCommand(cfg *app.AppConfig) *cobra.Command {
	var id string
	var typ string
	var name string
	var folder string
	var headers []string

	cmd := &cobra.Command{
		Use:   "download <url>",
		Short: "Download a URL directly with MediaGo core",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg.ApplyEnvAndDefaults()
			if err := app.InitLogger(cfg); err != nil {
				return err
			}
			defer logger.Sync()

			if id == "" {
				id = uuid.New().String()
			}
			if name == "" {
				name = "download-" + uuid.New().String()[:8]
			}

			rt, err := app.NewRuntime(cfg)
			if err != nil {
				return err
			}
			defer rt.Close()

			ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
			defer stop()

			params := core.DownloadParams{
				ID:      core.TaskID(id),
				Type:    core.DownloadType(typ),
				URL:     args[0],
				Name:    core.SanitizeFilename(name),
				Folder:  folder,
				Headers: headers,
			}

			lastPercent := -1
			fmt.Printf("Starting %s download: %s\n", params.Type, params.Name)
			err = rt.Downloader.Download(ctx, params, core.Callbacks{
				OnProgress: func(e core.ProgressEvent) {
					percent := int(e.Percent)
					if percent != lastPercent {
						lastPercent = percent
						if e.Speed != "" {
							fmt.Printf("\r%3d%% %s", percent, e.Speed)
						} else {
							fmt.Printf("\r%3d%%", percent)
						}
					}
				},
				OnMessage: func(e core.MessageEvent) {
					if strings.TrimSpace(e.Message) != "" {
						logger.Debugf("[%s] %s", e.ID, e.Message)
					}
				},
			})
			fmt.Println()
			if err != nil {
				return err
			}
			fmt.Println("Download completed")
			return nil
		},
	}

	cmd.Flags().StringVar(&id, "id", "", "Download task id")
	cmd.Flags().StringVarP(&typ, "type", "t", string(core.TypeM3U8), "Download type (m3u8, bilibili, direct, mediago, youtube)")
	cmd.Flags().StringVarP(&name, "name", "n", "", "Output file name")
	cmd.Flags().StringVar(&folder, "folder", "", "Subdirectory under the download directory")
	cmd.Flags().StringArrayVarP(&headers, "header", "H", nil, "HTTP header, can be repeated")
	return cmd
}

func addConfigFlags(flags *pflag.FlagSet, cfg *app.AppConfig) {
	flags.StringVar(&cfg.LogLevel, "log-level", cfg.LogLevel, "Log level (debug/info/warn/error)")
	flags.StringVar(&cfg.LogDir, "log-dir", cfg.LogDir, "Log directory")
	flags.StringVar(&cfg.DepsDir, "deps-dir", cfg.DepsDir, "Directory containing downloader tool binaries")
	flags.StringVar(&cfg.SchemaPath, "schema-path", cfg.SchemaPath, "Path to the download schema config.json")
	flags.StringVar(&cfg.LocalDir, "local-dir", cfg.LocalDir, "Default download directory")
	flags.BoolVar(&cfg.DeleteSegments, "delete-segments", cfg.DeleteSegments, "Delete segments after download")
	flags.StringVar(&cfg.Proxy, "proxy", cfg.Proxy, "Proxy for downloader")
	flags.BoolVar(&cfg.UseProxy, "use-proxy", cfg.UseProxy, "Enable proxy")
	flags.IntVar(&cfg.MaxRunner, "max-runner", cfg.MaxRunner, "Maximum concurrent download runners")
	flags.StringVar(&cfg.DBPath, "db-path", cfg.DBPath, "Path to SQLite database file")
	flags.StringVar(&cfg.ConfigDir, "config-dir", cfg.ConfigDir, "Directory for persistent config file")
}
