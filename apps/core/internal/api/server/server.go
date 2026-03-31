package server

import (
	"os"
	"path/filepath"

	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/api/middleware"
	"caorushizi.cn/mediago/internal/api/sse"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
	"caorushizi.cn/mediago/internal/service"
	"caorushizi.cn/mediago/internal/tasklog"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Server 包装 Gin Engine 与业务依赖。
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

	// 数据库持久化 handlers（当 database 不为 nil 时可用）
	downloadHandler   *handler.DownloadHandler
	favoriteHandler   *handler.FavoriteHandler
	conversionHandler *handler.ConversionHandler

	// 下载任务服务（用于队列回调更新数据库状态）
	downloadService *service.DownloadTaskService
}

// Options holds optional configuration for the server.
type Options struct {
	EnableAuth bool
	StaticDir  string
	EnvPaths   handler.EnvPaths
}

// New 创建 HTTP 服务器实例。
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
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
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

	// 当提供了数据库时，初始化持久化相关组件
	if database != nil {
		videoRepo := repo.NewVideoRepository(database)
		favoriteRepo := repo.NewFavoriteRepository(database)
		conversionRepo := repo.NewConversionRepository(database)

		downloadSvc := service.NewDownloadTaskService(videoRepo, queue, logs)
		favoriteSvc := service.NewFavoriteService(favoriteRepo)
		conversionSvc := service.NewConversionService(conversionRepo)

		srv.downloadHandler = handler.NewDownloadHandler(downloadSvc, confStore)
		srv.favoriteHandler = handler.NewFavoriteHandler(favoriteSvc)
		srv.conversionHandler = handler.NewConversionHandler(conversionSvc)
		srv.downloadService = downloadSvc
	}

	srv.registerRoutes()
	srv.setupQueueCallbacks()

	// Static file serving for SPA (optional)
	if opt.StaticDir != "" {
		srv.serveStatic(opt.StaticDir)
	}

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

// Run 启动 HTTP 服务。
func (s *Server) Run(addr string) error {
	return s.engine.Run(addr)
}

// Engine 返回底层 Gin Engine（主要用于测试）。
func (s *Server) Engine() *gin.Engine {
	return s.engine
}
