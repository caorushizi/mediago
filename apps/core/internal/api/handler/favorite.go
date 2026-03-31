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

// FavoriteHandler handles favorites endpoints.
type FavoriteHandler struct {
	svc *service.FavoriteService
}

// NewFavoriteHandler creates a FavoriteHandler.
func NewFavoriteHandler(svc *service.FavoriteService) *FavoriteHandler {
	return &FavoriteHandler{svc: svc}
}

// List retrieves all favorites.
func (h *FavoriteHandler) List(c *gin.Context) {
	favs, err := h.svc.GetFavorites()
	if err != nil {
		logger.Error("Failed to get favorites", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: favs})
}

// Create adds a favorite.
func (h *FavoriteHandler) Create(c *gin.Context) {
	var req dto.AddFavoriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	fav, err := h.svc.AddFavorite(&service.AddFavoriteInput{
		Title: req.Title,
		URL:   req.URL,
		Icon:  req.Icon,
	})
	if err != nil {
		logger.Error("Failed to add favorite", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: fav})
}

// Delete removes a favorite.
func (h *FavoriteHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	if err := h.svc.RemoveFavorite(id); err != nil {
		logger.Error("Failed to remove favorite", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgDeleted)})
}

// Export exports favorites.
func (h *FavoriteHandler) Export(c *gin.Context) {
	json, err := h.svc.ExportFavorites()
	if err != nil {
		logger.Error("Failed to export favorites", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: json})
}

// Import imports favorites.
func (h *FavoriteHandler) Import(c *gin.Context) {
	var req dto.ImportFavoritesReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	inputs := make([]*service.AddFavoriteInput, 0, len(req.Favorites))
	for _, f := range req.Favorites {
		inputs = append(inputs, &service.AddFavoriteInput{
			Title: f.Title,
			URL:   f.URL,
			Icon:  f.Icon,
		})
	}

	if err := h.svc.ImportFavorites(inputs); err != nil {
		logger.Error("Failed to import favorites", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgImported)})
}
