package handler

import (
	"fmt"
	"math/rand"
	"net/http"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/service"
	"github.com/gin-gonic/gin"
)

// EnvPaths holds server environment paths exposed via the API.
type EnvPaths struct {
	ConfigDir string `json:"configDir"`
	BinDir    string `json:"binDir"`
	Platform  string `json:"platform"`
	PlayerUrl string `json:"playerUrl,omitempty"`
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
	env := h.env
	// Compute playerUrl dynamically from the request host
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	env.PlayerUrl = fmt.Sprintf("%s://%s/player/", scheme, c.Request.Host)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    env,
	})
}

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
	return service.GetPageTitle(url, randomName())
}

func randomName() string {
	return fmt.Sprintf("download_%d", rand.Int63())
}
