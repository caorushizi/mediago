package video

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// Handler provides HTTP handlers for video endpoints
type Handler struct {
	service Service
}

// NewHandler creates a new video handler
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers video routes under the provided router group
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	// API endpoint for listing videos
	rg.GET("/videos", h.GetVideos)
}

// GetVideos handles GET /api/v1/videos
// @Summary      List all videos
// @Description  Get a list of all video files from the configured directory
// @Tags         videos
// @Accept       json
// @Produce      json
// @Success      200  {array}   Video  "List of videos"
// @Failure      500  {object}  map[string]string  "Internal server error"
// @Router       /videos [get]
func (h *Handler) GetVideos(c *gin.Context) {
	videos, err := h.service.GetVideoFiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve video files",
		})
		return
	}

	c.JSON(http.StatusOK, videos)
}

// ServeVideo serves static video files with proper headers for streaming
func ServeVideo(videoDir string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the requested file path
		requestedPath := c.Param("filepath")
		requestedPath = strings.TrimPrefix(requestedPath, "/")

		// Security: prevent path traversal
		if strings.Contains(requestedPath, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
			return
		}

		// Construct full file path
		filePath := filepath.Join(videoDir, requestedPath)

		// Check if file exists and is not a directory
		fileInfo, err := filepath.Abs(filePath)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
			return
		}

		// Serve the file with support for range requests (needed for video streaming)
		c.File(fileInfo)
	}
}
