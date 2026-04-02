package video

import (
	"net/http"
	"strconv"

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
	rg.GET("/videos", h.GetVideos)
	rg.GET("/videos/:id", h.GetVideoByID)
}

// GetVideos handles GET /api/v1/videos
// @Summary      List all playable videos
// @Description  Returns successfully downloaded videos that exist on disk
// @Tags         Videos
// @Produce      json
// @Success      200  {array}   Video
// @Failure      500  {object}  map[string]string
// @Router       /v1/videos [get]
func (h *Handler) GetVideos(c *gin.Context) {
	videos, err := h.service.GetVideoFiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve videos"})
		return
	}
	if videos == nil {
		videos = []Video{}
	}
	c.JSON(http.StatusOK, videos)
}

// GetVideoByID handles GET /api/v1/videos/:id
// @Summary      Get video by download task ID
// @Description  Returns a single video's playback info by its download task ID
// @Tags         Videos
// @Produce      json
// @Param        id   path  int  true  "Download task ID"
// @Success      200  {object}  Video
// @Failure      404  {object}  map[string]string
// @Router       /v1/videos/{id} [get]
func (h *Handler) GetVideoByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}

	video, err := h.service.GetVideoByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, video)
}

// ServeVideoByID serves a video file by its download task ID
// @Summary      Stream video by ID
// @Description  Serves the video file for streaming, looked up by download task ID
// @Tags         Videos
// @Produce      application/octet-stream
// @Param        id   path  int  true  "Download task ID"
// @Success      200
// @Failure      404  {object}  map[string]string
// @Router       /videos/{id} [get]
func (h *Handler) ServeVideoByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID"})
		return
	}

	filePath, err := h.service.GetVideoFilePath(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.File(filePath)
}
