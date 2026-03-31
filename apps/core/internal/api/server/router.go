package server

import (
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (s *Server) registerRoutes() {
	s.engine.GET("/healthy", s.healthHandler.Check)
	s.engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := s.engine.Group("/api")
	{
		api.POST("/tasks", s.taskHandler.Create)
		api.GET("/tasks/:id", s.taskHandler.Get)
		api.GET("/tasks", s.taskHandler.List)
		api.POST("/tasks/:id/stop", s.taskHandler.Stop)
		api.GET("/tasks/:id/logs", s.taskHandler.Logs)

		api.GET("/config", s.configHandler.GetStore)
		api.POST("/config", s.configHandler.Update)
		api.GET("/config/:key", s.configHandler.GetKey)
		api.PUT("/config/:key", s.configHandler.SetKey)

		api.GET("/events", s.eventHandler.Stream)

		// Auth
		auth := api.Group("/auth")
		{
			auth.POST("/setup", s.authHandler.Setup)
			auth.POST("/signin", s.authHandler.Signin)
			auth.GET("/status", s.authHandler.Status)
		}

		// Utility
		api.GET("/url/title", s.utilHandler.GetPageTitle)
		api.GET("/env", s.utilHandler.GetEnvPaths)
	}

	// Database persistence routes (only registered when database is available)
	if s.downloadHandler != nil {
		downloads := api.Group("/downloads")
		{
			downloads.POST("", s.downloadHandler.Create)
			downloads.GET("", s.downloadHandler.List)
			downloads.GET("/folders", s.downloadHandler.Folders)
			downloads.GET("/export", s.downloadHandler.Export)
			downloads.GET("/active", s.downloadHandler.Active)
			downloads.PUT("/status", s.downloadHandler.UpdateStatus)
			downloads.GET("/:id", s.downloadHandler.Get)
			downloads.PUT("/:id", s.downloadHandler.Edit)
			downloads.DELETE("/:id", s.downloadHandler.Delete)
			downloads.POST("/:id/start", s.downloadHandler.Start)
			downloads.POST("/:id/stop", s.downloadHandler.Stop)
			downloads.PUT("/:id/live", s.downloadHandler.UpdateIsLive)
			downloads.GET("/:id/logs", s.downloadHandler.Logs)
		}
	}

	if s.favoriteHandler != nil {
		favorites := api.Group("/favorites")
		{
			favorites.GET("", s.favoriteHandler.List)
			favorites.POST("", s.favoriteHandler.Create)
			favorites.DELETE("/:id", s.favoriteHandler.Delete)
			favorites.GET("/export", s.favoriteHandler.Export)
			favorites.POST("/import", s.favoriteHandler.Import)
		}
	}

	if s.conversionHandler != nil {
		conversions := api.Group("/conversions")
		{
			conversions.GET("", s.conversionHandler.List)
			conversions.POST("", s.conversionHandler.Create)
			conversions.DELETE("/:id", s.conversionHandler.Delete)
			conversions.GET("/:id", s.conversionHandler.Get)
		}
	}
}
