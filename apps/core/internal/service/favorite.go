package service

import (
	"encoding/json"
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
)

// ErrURLAlreadyExists is returned when attempting to add a duplicate favorite URL.
var ErrURLAlreadyExists = errors.New("url_already_exists")

// FavoriteService 收藏夹业务逻辑层。
type FavoriteService struct {
	repo *repo.FavoriteRepository
}

// NewFavoriteService 创建 FavoriteService。
func NewFavoriteService(repo *repo.FavoriteRepository) *FavoriteService {
	return &FavoriteService{repo: repo}
}

// AddFavoriteInput 添加收藏的输入。
type AddFavoriteInput struct {
	Title string  `json:"title"`
	URL   string  `json:"url"`
	Icon  *string `json:"icon"`
}

// GetFavorites 获取所有收藏（按创建时间降序）。
func (s *FavoriteService) GetFavorites() ([]*db.Favorite, error) {
	return s.repo.FindAll("DESC")
}

// AddFavorite 添加收藏（检查 URL 唯一性）。
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

// RemoveFavorite 删除收藏。
func (s *FavoriteService) RemoveFavorite(id int64) error {
	return s.repo.Delete(id)
}

// FavoriteExportItem 导出的收藏项。
type FavoriteExportItem struct {
	Title string  `json:"title"`
	URL   string  `json:"url"`
	Icon  *string `json:"icon,omitempty"`
}

// ExportFavorites 导出收藏为 JSON 字符串。
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

// ImportFavorites 批量导入收藏。
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
