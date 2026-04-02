package handler

import (
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	conf ConfigStore
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(conf ConfigStore) *AuthHandler {
	return &AuthHandler{conf: conf}
}

// Setup sets the initial password. Only works if no password is currently configured.
// Hashes the password with bcrypt and generates a random API key.
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

	// Check if already set up
	existing, _ := h.conf.Get("passwordHash").(string)
	if existing != "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: i18n.T(c, i18n.MsgAPIKeyAlreadySet),
		})
		return
	}

	// Hash password with bcrypt
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusInternalServerError,
			Message: err.Error(),
		})
		return
	}

	// Generate a random API key
	apiKey := uuid.New().String()

	// Store both password hash and API key
	if err := h.conf.Update(map[string]any{
		"passwordHash": string(hash),
		"apiKey":       apiKey,
	}); err != nil {
		logger.Error("Failed to save auth config", zap.Error(err))
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
		Data:    apiKey,
	})
}

// Signin validates the provided password and returns the API key.
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

	storedHash, _ := h.conf.Get("passwordHash").(string)
	if storedHash == "" {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusUnauthorized,
			Message: i18n.T(c, i18n.MsgInvalidAPIKey),
		})
		return
	}

	// Compare password with stored bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusUnauthorized,
			Message: i18n.T(c, i18n.MsgInvalidAPIKey),
		})
		return
	}

	// Return the stored API key
	apiKey, _ := h.conf.Get("apiKey").(string)
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    apiKey,
	})
}

// Status returns whether authentication is configured.
// @Summary Check auth status
// @Tags Auth
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Router /auth/status [get]
func (h *AuthHandler) Status(c *gin.Context) {
	stored, _ := h.conf.Get("passwordHash").(string)
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    dto.AuthStatusResponse{Setuped: stored != ""},
	})
}
