package service

import (
	"encoding/json"
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
)

// ErrURLAlreadyExists is returned when attempting to add a duplicate favorite URL.
var ErrURLAlreadyExists = errors.New("url_already_exists")

// FavoriteService is the business logic layer for favorites.
type FavoriteService struct {
	repo *repo.FavoriteRepository
}

// NewFavoriteService creates a FavoriteService.
func NewFavoriteService(repo *repo.FavoriteRepository) *FavoriteService {
	return &FavoriteService{repo: repo}
}

// AddFavoriteInput holds the input for adding a favorite.
type AddFavoriteInput struct {
	Title string  `json:"title"`
	URL   string  `json:"url"`
	Icon  *string `json:"icon"`
}

// GetFavorites retrieves all favorites (sorted by creation time descending).
func (s *FavoriteService) GetFavorites() ([]*db.Favorite, error) {
	return s.repo.FindAll("DESC")
}

// AddFavorite adds a favorite (with URL uniqueness check).
func (s *FavoriteService) AddFavorite(input *AddFavoriteInput) (*db.Favorite, error) {
	existing, err := s.repo.FindByURL(input.URL)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, ErrURLAlreadyExists
	}

	fav := &db.Favorite{
		Title: input.Title,
		URL:   input.URL,
		Icon:  input.Icon,
	}
	return s.repo.Create(fav)
}

// RemoveFavorite removes a favorite.
func (s *FavoriteService) RemoveFavorite(id int64) error {
	return s.repo.Delete(id)
}

// FavoriteExportItem is a favorite entry for export.
type FavoriteExportItem struct {
	Title string  `json:"title"`
	URL   string  `json:"url"`
	Icon  *string `json:"icon,omitempty"`
}

// ExportFavorites exports favorites as a JSON string.
func (s *FavoriteService) ExportFavorites() (string, error) {
	favs, err := s.repo.FindAll("DESC")
	if err != nil {
		return "", err
	}

	items := make([]FavoriteExportItem, 0, len(favs))
	for _, f := range favs {
		items = append(items, FavoriteExportItem{
			Title: f.Title,
			URL:   f.URL,
			Icon:  f.Icon,
		})
	}

	data, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ImportFavorites imports favorites in bulk.
func (s *FavoriteService) ImportFavorites(inputs []*AddFavoriteInput) error {
	favs := make([]*db.Favorite, 0, len(inputs))
	for _, input := range inputs {
		favs = append(favs, &db.Favorite{
			Title: input.Title,
			URL:   input.URL,
			Icon:  input.Icon,
		})
	}
	_, err := s.repo.CreateMany(favs)
	return err
}
