package handler

import (
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/api/sse"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ConfigStore is the interface that the config handler needs from the conf package.
type ConfigStore interface {
	Get(key string) any
	Set(key string, value any) error
	Update(partial map[string]any) error
	Store() any
}

// configStoreWrapper wraps a *conf.Conf[T] to satisfy ConfigStore.
// This avoids importing the generic conf package in the handler.
type configStoreWrapper[T any] struct {
	get    func(string) any
	set    func(string, any) error
	update func(map[string]any) error
	store  func() any
}

func (w *configStoreWrapper[T]) Get(key string) any              { return w.get(key) }
func (w *configStoreWrapper[T]) Set(key string, value any) error { return w.set(key, value) }
func (w *configStoreWrapper[T]) Update(partial map[string]any) error {
	return w.update(partial)
}
func (w *configStoreWrapper[T]) Store() any { return w.store() }

// WrapConfStore wraps a *conf.Conf[T] into a ConfigStore interface.
// This function is generic and lives here so the handler package stays non-generic.
func WrapConfStore[T any](c interface {
	Get(string) any
	Set(string, any) error
	Update(map[string]any) error
	Store() T
}) ConfigStore {
	return &configStoreWrapper[T]{
		get:    c.Get,
		set:    c.Set,
		update: c.Update,
		store:  func() any { return c.Store() },
	}
}

// reference types to help swagger parsing
var _ dto.UpdateConfigResponse

// ConfigHandler 处理配置相关接口。
type ConfigHandler struct {
	conf ConfigStore
	hub  *sse.Hub
}

// NewConfigHandler 创建 ConfigHandler。
func NewConfigHandler(conf ConfigStore, hub *sse.Hub) *ConfigHandler {
	return &ConfigHandler{conf: conf, hub: hub}
}

// GetStore 获取完整配置
// @Summary 获取完整配置
// @Description 返回所有配置项的当前值
// @Tags Config
// @Produce json
// @Success 200 {object} dto.SuccessResponse "完整配置"
// @Router /config [get]
func (h *ConfigHandler) GetStore(c *gin.Context) {
	store := h.conf.Store()
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    store,
	})
}

// Update 更新配置（部分更新）
// @Summary 更新系统配置
// @Description 更新配置，只需提供要修改的字段
// @Tags Config
// @Accept json
// @Produce json
// @Param config body dto.UpdateConfigRequest true "配置参数"
// @Success 200 {object} dto.SuccessResponse{data=dto.UpdateConfigResponse} "配置更新成功"
// @Failure 400 {object} dto.ErrorResponse "请求参数错误"
// @Router /config [post]
func (h *ConfigHandler) Update(c *gin.Context) {
	var req dto.UpdateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid config update request",
			zap.String("clientIP", c.ClientIP()),
			zap.Error(err))
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	logger.Info("Config update request received", zap.Any("req", req), zap.String("clientIP", c.ClientIP()))

	if err := h.conf.Update(req); err != nil {
		logger.Error("Failed to update config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	// 广播每个变更的 key
	for key, value := range req {
		h.hub.Broadcast("config-changed", map[string]any{"key": key, "value": value})
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgConfigUpdated),
		Data:    dto.UpdateConfigResponse{Message: i18n.T(c, i18n.MsgConfigUpdated)},
	})
}

// GetKey 获取单个配置项
// @Summary 获取单个配置项
// @Description 通过 key 获取配置值，支持 dot-notation
// @Tags Config
// @Produce json
// @Param key path string true "配置键名"
// @Success 200 {object} dto.SuccessResponse "配置值"
// @Router /config/{key} [get]
func (h *ConfigHandler) GetKey(c *gin.Context) {
	key := c.Param("key")
	value := h.conf.Get(key)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    value,
	})
}

// SetKey 设置单个配置项
// @Summary 设置单个配置项
// @Description 通过 key 设置配置值
// @Tags Config
// @Accept json
// @Produce json
// @Param key path string true "配置键名"
// @Param body body dto.SetKeyRequest true "配置值"
// @Success 200 {object} dto.SuccessResponse{data=dto.UpdateConfigResponse} "设置成功"
// @Failure 400 {object} dto.ErrorResponse "请求参数错误"
// @Router /config/{key} [put]
func (h *ConfigHandler) SetKey(c *gin.Context) {
	key := c.Param("key")

	var req dto.SetKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	if err := h.conf.Set(key, req.Value); err != nil {
		logger.Error("Failed to set config key", zap.String("key", key), zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	h.hub.Broadcast("config-changed", map[string]any{"key": key, "value": req.Value})

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgConfigUpdated),
		Data:    dto.UpdateConfigResponse{Message: i18n.T(c, i18n.MsgConfigKeyUpdated, key)},
	})
}
