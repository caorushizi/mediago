package server

import (
	"os"
	"path/filepath"

	"caorushizi.cn/mediago/assets"
	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/api/middleware"
	"caorushizi.cn/mediago/internal/api/sse"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/service"
	"caorushizi.cn/mediago/internal/tasklog"
	"caorushizi.cn/mediago/internal/video"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Server wraps the Gin Engine with its business dependencies.
type Server struct {
	queue  *core.TaskQueue
	hub    *sse.Hub
	engine *gin.Engine
	logs   *tasklog.Manager

	taskHandler   *handler.TaskHandler
	configHandler *handler.ConfigHandler
	eventHandler  *handler.EventHandler
	healthHandler *handler.HealthHandler
	authHandler   *handler.AuthHandler
	utilHandler   *handler.UtilHandler

	// Database persistence handlers (available when database is non-nil)
	downloadHandler   *handler.DownloadHandler
	favoriteHandler   *handler.FavoriteHandler
	conversionHandler *handler.ConversionHandler

	// Download task service (used by queue callbacks to update database state)
	downloadService *service.DownloadTaskService

	// Video player handler (available when video-root is configured)
	videoHandler *video.Handler
}

// Options holds optional configuration for the server.
type Options struct {
	EnableAuth bool
	StaticDir  string
	FFmpegBin  string
	VideoRoot  string
	EnvPaths   handler.EnvPaths
}

// New creates an HTTP server instance.
func New(queue *core.TaskQueue, logs *tasklog.Manager, database *db.Database, confStore handler.ConfigStore, opts ...Options) *Server {
	var opt Options
	if len(opts) > 0 {
		opt = opts[0]
	}

	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// i18n middleware — resolve language before auth so error messages are translated
	engine.Use(i18n.Middleware(func() string {
		lang, _ := confStore.Get("language").(string)
		return lang
	}))

	// Optional auth middleware
	if opt.EnableAuth {
		engine.Use(middleware.AuthMiddleware(confStore))
	}

	hub := sse.New()

	srv := &Server{
		queue:         queue,
		hub:           hub,
		engine:        engine,
		logs:          logs,
		taskHandler:   handler.NewTaskHandler(queue, logs),
		configHandler: handler.NewConfigHandler(confStore, hub),
		eventHandler:  handler.NewEventHandler(hub),
		healthHandler: handler.NewHealthHandler(),
		authHandler:   handler.NewAuthHandler(confStore),
		utilHandler:   handler.NewUtilHandler(opt.EnvPaths),
	}

	// Initialize persistence-related components when a database is provided
	if database != nil {
		videoRepo := repo.NewVideoRepository(database)
		favoriteRepo := repo.NewFavoriteRepository(database)
		conversionRepo := repo.NewConversionRepository(database)

		downloadSvc := service.NewDownloadTaskService(videoRepo, queue, logs)
		favoriteSvc := service.NewFavoriteService(favoriteRepo)
		converter := service.NewConverter(opt.FFmpegBin)
		conversionSvc := service.NewConversionService(conversionRepo, converter, hub)

		srv.downloadHandler = handler.NewDownloadHandler(downloadSvc, confStore, hub)
		srv.favoriteHandler = handler.NewFavoriteHandler(favoriteSvc)
		srv.conversionHandler = handler.NewConversionHandler(conversionSvc)
		srv.downloadService = downloadSvc

		// Video player service (requires video root directory)
		if opt.VideoRoot != "" {
			videoSvc := video.NewService(videoRepo, opt.VideoRoot)
			srv.videoHandler = video.NewHandler(videoSvc)
		}
	}

	srv.registerRoutes()
	srv.setupQueueCallbacks()

	// Static file serving for SPA (optional)
	if opt.StaticDir != "" {
		srv.serveStatic(opt.StaticDir)
	}

	// Serve embedded player UI at /player/
	srv.engine.Use(newPlayerSPAHandler(playerSPAConfig{
		FS:         assets.PlayerFS,
		Root:       "player",
		PathPrefix: "/player",
	}))

	return srv
}

// serveStatic configures the engine to serve static files and SPA fallback.
func (s *Server) serveStatic(dir string) {
	s.engine.Static("/assets", filepath.Join(dir, "assets"))
	s.engine.StaticFile("/favicon.ico", filepath.Join(dir, "favicon.ico"))

	// SPA fallback: serve index.html for any unmatched route
	indexPath := filepath.Join(dir, "index.html")
	s.engine.NoRoute(func(c *gin.Context) {
		if _, err := os.Stat(indexPath); err == nil {
			c.File(indexPath)
		}
	})
}

// Run starts the HTTP server on the given address.
func (s *Server) Run(addr string) error {
	return s.engine.Run(addr)
}

// Engine returns the underlying Gin Engine (primarily used for testing).
func (s *Server) Engine() *gin.Engine {
	return s.engine
}
