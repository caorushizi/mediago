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
		"/healthy":               true,
		"/api/auth/setup":        true,
		"/api/auth/signin":       true,
		"/api/auth/status":       true,
		"/mcp":                   true,
		"/manifest.json":         true,
		"/service-worker.js":     true,
		"/apple-touch-icon.png":  true,
		"/icon-192.png":          true,
		"/icon-512.png":          true,
		"/icon-192-maskable.png": true,
		"/icon-512-maskable.png": true,
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		storedKey, _ := confStore.Get("apiKey").(string)
		// Only the setup UI, health/status and independently authenticated MCP
		// remain available before initialization. No business API is fail-open.
		initializationEndpoint := path == "/api/auth/setup" || path == "/api/auth/signin" || path == "/api/auth/status"
		if storedKey == "" && !initializationEndpoint && (strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/videos/")) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, dto.ErrorResponse{
				Success: false, Code: http.StatusUnauthorized, Message: i18n.T(c, i18n.MsgUnauthorized),
			})
			return
		}

		// Whitelist check
		if whitelist[path] || strings.HasPrefix(path, "/swagger/") ||
			strings.HasPrefix(path, "/api/bridge/") ||
			strings.HasPrefix(path, "/player") ||
			strings.HasPrefix(path, "/api/v1/") ||
			strings.HasPrefix(path, "/videos/") ||
			strings.HasPrefix(path, "/assets/") ||
			path == "/favicon.ico" ||
			path == "/" {
			c.Next()
			return
		}

		// SPA frontend routes (non-API paths without dots are likely client-side routes)
		if !strings.HasPrefix(path, "/api/") && !strings.Contains(path, ".") {
			c.Next()
			return
		}

		// Get stored apiKey from config
		if storedKey == "" {
			c.AbortWithStatus(http.StatusUnauthorized)
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

// extractToken gets the API key from request headers or query param.
// Priority: X-API-Key header > Authorization: Bearer header > ?token= query param.
func extractToken(c *gin.Context) string {
	// Try X-API-Key header first (used by frontend http client)
	if key := c.GetHeader("X-API-Key"); key != "" {
		return key
	}

	// Try Authorization header
	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	// Fallback to query param (for SSE EventSource which can't set headers)
	return c.Query("token")
}
