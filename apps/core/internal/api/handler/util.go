package handler

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// EnvPaths holds server environment paths exposed via the API.
type EnvPaths struct {
	ConfigDir string `json:"configDir"`
	BinDir    string `json:"binDir"`
	Platform  string `json:"platform"`
}

// UtilHandler handles utility endpoints.
type UtilHandler struct {
	env EnvPaths
}

// NewUtilHandler creates a UtilHandler.
func NewUtilHandler(env EnvPaths) *UtilHandler {
	return &UtilHandler{env: env}
}

// GetEnvPaths returns server environment paths.
// @Summary Get environment paths
// @Tags Util
// @Produce json
// @Success 200 {object} dto.SuccessResponse
// @Router /env [get]
func (h *UtilHandler) GetEnvPaths(c *gin.Context) {
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    h.env,
	})
}

var titleRegex = regexp.MustCompile(`(?i)<title[^>]*>(.*?)</title>`)

// GetPageTitle fetches a URL and extracts the HTML <title> tag.
// @Summary Get page title
// @Tags Util
// @Produce json
// @Param url query string true "URL to fetch"
// @Success 200 {object} dto.SuccessResponse
// @Router /url/title [get]
func (h *UtilHandler) GetPageTitle(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusBadRequest,
			Message: i18n.T(c, i18n.MsgURLRequired),
		})
		return
	}

	title := fetchTitle(url)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    map[string]string{"data": title},
	})
}

func fetchTitle(url string) string {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		logger.Warn("getPageTitle: failed to create request", zap.String("url", url), zap.Error(err))
		return randomName()
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		logger.Warn("getPageTitle: request failed", zap.String("url", url), zap.Error(err))
		return randomName()
	}
	defer resp.Body.Close()

	// Read up to 64KB to find the title
	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		logger.Warn("getPageTitle: failed to read body", zap.String("url", url), zap.Error(err))
		return randomName()
	}

	matches := titleRegex.FindSubmatch(body)
	if len(matches) >= 2 {
		title := strings.TrimSpace(string(matches[1]))
		if title != "" {
			return title
		}
	}

	return randomName()
}

func randomName() string {
	return fmt.Sprintf("download_%d", rand.Int63())
}
