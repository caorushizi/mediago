package handler

import (
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"github.com/gin-gonic/gin"
)

// HealthHandler 处理健康检查相关接口。
type HealthHandler struct{}

// NewHealthHandler 创建 HealthHandler。
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Check 健康检查
// @Summary 健康检查
// @Description 检查服务是否正常运行
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} dto.SuccessResponse{data=dto.HealthResponse} "服务正常"
// @Router /healthy [get]
func (h *HealthHandler) Check(c *gin.Context) {
    c.JSON(http.StatusOK, dto.SuccessResponse{
        Success: true,
        Code:    http.StatusOK,
        Message: "OK",
        Data:    dto.HealthResponse{Status: "ok"},
    })
}
