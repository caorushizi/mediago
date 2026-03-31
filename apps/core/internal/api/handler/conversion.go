package handler

import (
	"net/http"
	"strconv"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"caorushizi.cn/mediago/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ConversionHandler 处理转换记录接口。
type ConversionHandler struct {
	svc *service.ConversionService
}

// NewConversionHandler 创建 ConversionHandler。
func NewConversionHandler(svc *service.ConversionService) *ConversionHandler {
	return &ConversionHandler{svc: svc}
}

// List 分页获取转换记录。
func (h *ConversionHandler) List(c *gin.Context) {
	var req dto.ConversionPaginationReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	result, err := h.svc.GetConversions(req.Current, req.PageSize)
	if err != nil {
		logger.Error("Failed to get conversions", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: result})
}

// Create 添加转换记录。
func (h *ConversionHandler) Create(c *gin.Context) {
	var req dto.AddConversionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	conv, err := h.svc.AddConversion(&service.AddConversionInput{
		Name: req.Name,
		Path: req.Path,
	})
	if err != nil {
		logger.Error("Failed to add conversion", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: conv})
}

// Delete 删除转换记录。
func (h *ConversionHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	if err := h.svc.DeleteConversion(id); err != nil {
		logger.Error("Failed to delete conversion", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgDeleted)})
}

// Get 获取单个转换记录。
func (h *ConversionHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	conv, err := h.svc.FindByIDOrFail(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Success: false, Code: http.StatusNotFound, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: conv})
}
