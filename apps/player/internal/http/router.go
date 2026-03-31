package http

import (
	"log"
	"net/http"

	"github.com/caorushizi/mediago-player/assets"
	"github.com/caorushizi/mediago-player/internal/http/middleware"
	"github.com/caorushizi/mediago-player/internal/video"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Config controls router features
type Config struct {
	// VideoRootPath is the local filesystem directory to scan and stream videos from
	VideoRootPath string
	// ServerAddr is the server address (e.g., ":8080") used for generating video URLs
	ServerAddr string
	// EnableSwagger controls whether to enable Swagger documentation (should be disabled in production)
	EnableSwagger bool
}

// New creates router with default config (no video routes)
func New() *gin.Engine { return NewWithConfig(Config{}) }

// NewWithConfig creates router with provided config
func NewWithConfig(cfg Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(middleware.RequestID())
	r.Use(middleware.CORS())

	// Health & readiness
	r.GET("/healthy", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	// Swagger documentation (only in development/debug mode)
	if cfg.EnableSwagger {
		r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		log.Println("[swagger] API documentation enabled at /docs/index.html")
	}

	// Versioned API
	api := r.Group("/api")
	{
		v1 := api.Group("/v1")

		// Video API routes (only if video directory is configured)
		if cfg.VideoRootPath != "" {
			videoService, err := video.NewService(cfg.VideoRootPath, cfg.ServerAddr)
			if err != nil {
				log.Printf("[video] failed to initialize video service: %v", err)
			} else {
				videoHandler := video.NewHandler(videoService)
				// Keep versioned API
				videoHandler.RegisterRoutes(v1)

				// Video file serving route
				r.GET("/videos/*filepath", video.ServeVideo(cfg.VideoRootPath))
			}
		} else {
			// No video directory configured: still expose endpoints returning empty list for compatibility
			v1.GET("/videos", func(c *gin.Context) {
				c.JSON(http.StatusOK, []video.Video{})
			})
		}
	}

	// Exclude API/health/docs paths from SPA handling
	excludePrefixes := []string{"/api/", "/healthy", "/docs", "/videos/"}

	// Static files - Mobile SPA (/m)
	r.Use(NewSPAHandler(SPAConfig{
		FS:              assets.FS,
		Root:            "ui",
		ExcludePrefixes: excludePrefixes,
	}))

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
	})

	return r
}
