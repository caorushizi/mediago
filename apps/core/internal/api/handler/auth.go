package handler

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"
	"strconv"
	"sync"
	"time"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const authBodyLimit = 4096
const authAttemptsPerMinute = 10

type AuthOptions struct {
	OnSetupComplete   func()
	RequireSetupToken bool
	SetupToken        string
}

type AuthHandler struct {
	conf      ConfigStore
	options   AuthOptions
	setupHash [32]byte
	work      sync.Mutex
	limits    sync.Mutex
	window    time.Time
	attempts  int
	now       func() time.Time
}

func NewAuthHandler(conf ConfigStore, options ...AuthOptions) *AuthHandler {
	var opt AuthOptions
	if len(options) > 0 {
		opt = options[0]
	}
	h := &AuthHandler{conf: conf, options: opt, now: time.Now}
	h.setupHash = sha256.Sum256([]byte(opt.SetupToken))
	h.options.SetupToken = ""
	return h
}

func (h *AuthHandler) configured() bool {
	password, _ := h.conf.Get("passwordHash").(string)
	key, _ := h.conf.Get("apiKey").(string)
	return password != "" || key != ""
}

func authError(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, dto.ErrorResponse{
		Success: false, Code: status, Message: i18n.T(c, message),
	})
}

// Bound both bcrypt work and request attempts independently of proxy/IP headers.
func (h *AuthHandler) beginAttempt(c *gin.Context) bool {
	h.limits.Lock()
	now := h.now()
	if h.window.IsZero() || now.Sub(h.window) >= time.Minute {
		h.window, h.attempts = now, 0
	}
	if h.attempts >= authAttemptsPerMinute {
		retry := max(1, int(h.window.Add(time.Minute).Sub(now).Seconds())+1)
		h.limits.Unlock()
		c.Header("Retry-After", strconv.Itoa(retry))
		authError(c, http.StatusTooManyRequests, i18n.MsgAuthRateLimited)
		return false
	}
	h.attempts++
	h.limits.Unlock()
	if !h.work.TryLock() {
		c.Header("Retry-After", "1")
		authError(c, http.StatusTooManyRequests, i18n.MsgAuthRateLimited)
		return false
	}
	return true
}

// Setup verifies the operator's initialization code before creating credentials.
// Concurrent initialization cannot replace the first successful owner.
// @Summary Setup authentication
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body dto.SetupAuthRequest true "Setup request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 429 {object} dto.ErrorResponse
// @Failure 400 {object} dto.ErrorResponse
// @Router /auth/setup [post]
func (h *AuthHandler) Setup(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, authBodyLimit)
	var req dto.SetupAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Password) > 72 {
		writeInvalidRequest(c)
		return
	}
	if h.configured() {
		authError(c, http.StatusBadRequest, i18n.MsgAPIKeyAlreadySet)
		return
	}
	if !h.beginAttempt(c) {
		return
	}
	defer h.work.Unlock()
	if h.configured() {
		authError(c, http.StatusBadRequest, i18n.MsgAPIKeyAlreadySet)
		return
	}
	if h.options.RequireSetupToken {
		if h.setupHash == sha256.Sum256(nil) {
			authError(c, http.StatusServiceUnavailable, i18n.MsgAuthSetupUnavailable)
			return
		}
		got := sha256.Sum256([]byte(req.SetupToken))
		if subtle.ConstantTimeCompare(got[:], h.setupHash[:]) != 1 {
			authError(c, http.StatusForbidden, i18n.MsgAuthSetupTokenInvalid)
			return
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		writeInternalError(c)
		return
	}
	apiKey := uuid.New().String()
	if err := h.conf.Update(map[string]any{
		"passwordHash": string(hash), "apiKey": apiKey,
	}); err != nil {
		logger.Error("Failed to save auth config", zap.Error(err))
		writeInternalError(c)
		return
	}
	if h.options.OnSetupComplete != nil {
		h.options.OnSetupComplete()
	}
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: apiKey,
	})
}

// Signin validates the provided password and returns the API key.
// @Summary Sign in
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body dto.SigninRequest true "Signin request"
// @Success 200 {object} dto.SuccessResponse
// @Failure 429 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Router /auth/signin [post]
func (h *AuthHandler) Signin(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, authBodyLimit)
	var req dto.SigninRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Password) > 72 {
		writeInvalidRequest(c)
		return
	}
	storedHash, _ := h.conf.Get("passwordHash").(string)
	apiKey, _ := h.conf.Get("apiKey").(string)
	if storedHash == "" || apiKey == "" {
		authError(c, http.StatusUnauthorized, i18n.MsgInvalidAPIKey)
		return
	}
	if !h.beginAttempt(c) {
		return
	}
	defer h.work.Unlock()
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.Password)); err != nil {
		authError(c, http.StatusUnauthorized, i18n.MsgInvalidAPIKey)
		return
	}
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: apiKey,
	})
}

// Status returns whether authentication is configured.
// @Summary Check auth status
// @Tags Auth
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Router /auth/status [get]
func (h *AuthHandler) Status(c *gin.Context) {
	configured := h.configured()
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK),
		Data: dto.AuthStatusResponse{
			Setuped:            configured,
			SetupTokenRequired: h.options.RequireSetupToken && !configured,
		},
	})
}
