package handler

import (
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	conf ConfigStore
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(conf ConfigStore) *AuthHandler {
	return &AuthHandler{conf: conf}
}

// Setup sets the initial apiKey. Only works if no apiKey is currently configured.
// @Summary Setup authentication
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body dto.SetupAuthRequest true "Setup request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 400 {object} dto.ErrorResponse
// @Router /auth/setup [post]
func (h *AuthHandler) Setup(c *gin.Context) {
	var req dto.SetupAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	if req.ApiKey == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: i18n.T(c, i18n.MsgAPIKeyRequired),
		})
		return
	}

	// Check if apiKey is already set
	existing, _ := h.conf.Get("apiKey").(string)
	if existing != "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: i18n.T(c, i18n.MsgAPIKeyAlreadySet),
		})
		return
	}

	if err := h.conf.Set("apiKey", req.ApiKey); err != nil {
		logger.Error("Failed to set apiKey", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    true,
	})
}

// Signin validates the provided apiKey.
// @Summary Sign in
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body dto.SigninRequest true "Signin request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /auth/signin [post]
func (h *AuthHandler) Signin(c *gin.Context) {
	var req dto.SigninRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: err.Error(),
		})
		return
	}

	stored, _ := h.conf.Get("apiKey").(string)
	if req.ApiKey == stored {
		c.JSON(http.StatusOK, dto.SuccessResponse{
			Success: true,
			Code:    http.StatusOK,
			Message: i18n.T(c, i18n.MsgOK),
			Data:    true,
		})
	} else {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusUnauthorized,
			Message: i18n.T(c, i18n.MsgInvalidAPIKey),
		})
	}
}

// Status returns whether authentication is configured.
// @Summary Check auth status
// @Tags Auth
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Router /auth/status [get]
func (h *AuthHandler) Status(c *gin.Context) {
	stored, _ := h.conf.Get("apiKey").(string)
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    dto.AuthStatusResponse{Setuped: stored != ""},
	})
}
