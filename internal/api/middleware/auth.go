package middleware

import (
	"net/http"
	"strings"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthMiddleware creates a Gin middleware that validates apiKey from the
// Authorization header (Bearer token) or query parameter (for SSE).
// Whitelisted paths bypass authentication.
func AuthMiddleware(confStore handler.ConfigStore) gin.HandlerFunc {
	whitelist := map[string]bool{
		"/healthy":          true,
		"/api/auth/setup":   true,
		"/api/auth/signin":  true,
		"/api/auth/status":  true,
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Whitelist check
		if whitelist[path] || strings.HasPrefix(path, "/swagger/") {
			c.Next()
			return
		}

		// Get stored apiKey from config
		storedKey, _ := confStore.Get("apiKey").(string)
		if storedKey == "" {
			// No apiKey configured, auth not set up yet — allow access
			c.Next()
			return
		}

		// Extract token from Authorization header or query param
		token := extractToken(c)
		if token == "" {
			logger.Warn("Auth: missing token", zap.String("path", path), zap.String("clientIP", c.ClientIP()))
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{
				Success: false,
				Code:    http.StatusUnauthorized,
				Message: i18n.T(c, i18n.MsgUnauthorized),
			})
			return
		}

		if token != storedKey {
			logger.Warn("Auth: invalid token", zap.String("path", path), zap.String("clientIP", c.ClientIP()))
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{
				Success: false,
				Code:    http.StatusUnauthorized,
				Message: i18n.T(c, i18n.MsgUnauthorized),
			})
			return
		}

		c.Next()
	}
}

// extractToken gets the API key from Authorization header or query param.
// Supports: "Authorization: Bearer <token>" header and "?token=<token>" query param.
func extractToken(c *gin.Context) string {
	// Try Authorization header first
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	// Fallback to query param (for SSE EventSource which can't set headers)
	return c.Query("token")
}
