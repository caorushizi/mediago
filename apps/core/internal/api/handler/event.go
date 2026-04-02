package handler

import (
	"fmt"
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/api/sse"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// EventHandler handles SSE event streaming.
type EventHandler struct {
	hub *sse.Hub
}

// NewEventHandler creates an EventHandler.
func NewEventHandler(hub *sse.Hub) *EventHandler {
	return &EventHandler{hub: hub}
}

// Stream serves the SSE event stream.
// @Summary SSE event stream
// @Description Subscribe to Server-Sent Events (SSE) to receive real-time download task status change notifications
// @Description Event types include: download-start (task started), download-success (task succeeded), download-failed (task failed), download-stop (task stopped)
// @Description Note: progress update events are not included; poll GET /api/tasks/{id} to retrieve download progress
// @Tags Events
// @Produce text/event-stream
// @Success 200 {string} string "SSE event stream"
// @Router /events [get]
func (h *EventHandler) Stream(c *gin.Context) {
	logger.Info("SSE client connected", zap.String("clientIP", c.ClientIP()))

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	client := h.hub.Subscribe()
	defer func() {
		h.hub.Unsubscribe(client)
		logger.Info("SSE client disconnected", zap.String("clientIP", c.ClientIP()))
	}()

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		logger.Error("SSE streaming not supported")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: i18n.T(c, i18n.MsgEventStreamFailed)})
		return
	}

	notify := c.Request.Context().Done()

	for {
		select {
		case <-notify:
			return
		case evt := <-client:
			fmt.Fprintf(c.Writer, "event: %s\n", evt.Name)
			fmt.Fprintf(c.Writer, "data: %s\n\n", evt.JSON())
			flusher.Flush()
		}
	}
}
