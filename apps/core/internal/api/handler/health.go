package handler

import (
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check endpoints.
type HealthHandler struct{}

// NewHealthHandler creates a HealthHandler.
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Check performs a health check.
// @Summary Health check
// @Description Checks whether the service is running normally
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} dto.SuccessResponse{data=dto.HealthResponse} "Service is healthy"
// @Router /healthy [get]
func (h *HealthHandler) Check(c *gin.Context) {
    c.JSON(http.StatusOK, dto.SuccessResponse{
        Success: true,
        Code:    http.StatusOK,
        Message: "OK",
        Data:    dto.HealthResponse{Status: "ok"},
    })
}
