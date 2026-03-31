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

// EventHandler 处理 SSE 事件推送。
type EventHandler struct {
	hub *sse.Hub
}

// NewEventHandler 创建 EventHandler。
func NewEventHandler(hub *sse.Hub) *EventHandler {
	return &EventHandler{hub: hub}
}

// Stream SSE 事件流
// @Summary SSE 事件流
// @Description 订阅服务器推送事件（SSE），实时接收下载任务的状态变更通知
// @Description 事件类型包括：download-start（任务开始）, download-success（任务成功）, download-failed（任务失败）, download-stop（任务停止）
// @Description 注意：不包含进度更新事件，如需获取下载进度，请通过 GET /api/tasks/{id} 接口轮询
// @Tags Events
// @Produce text/event-stream
// @Success 200 {string} string "SSE 事件流"
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
