package repo

import (
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"gorm.io/gorm"
)

// FavoriteRepository 收藏夹数据访问层。
type FavoriteRepository struct {
	db *gorm.DB
}

// NewFavoriteRepository 创建 FavoriteRepository。
func NewFavoriteRepository(database *db.Database) *FavoriteRepository {
	return &FavoriteRepository{db: database.DB}
}

// Create 创建收藏。
func (r *FavoriteRepository) Create(fav *db.Favorite) (*db.Favorite, error) {
	if err := r.db.Create(fav).Error; err != nil {
		return nil, err
	}
	return fav, nil
}

// CreateMany 批量创建收藏。
func (r *FavoriteRepository) CreateMany(favs []*db.Favorite) ([]*db.Favorite, error) {
	if len(favs) == 0 {
		return favs, nil
	}
	if err := r.db.Create(&favs).Error; err != nil {
		return nil, err
	}
	return favs, nil
}

// FindByURL 根据 URL 查找收藏。
func (r *FavoriteRepository) FindByURL(url string) (*db.Favorite, error) {
	var fav db.Favorite
	err := r.db.Where("url = ?", url).First(&fav).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &fav, nil
}

// FindAll 查找所有收藏。
func (r *FavoriteRepository) FindAll(order string) ([]*db.Favorite, error) {
	var favs []*db.Favorite
	err := r.db.Order("createdDate " + order).Find(&favs).Error
	return favs, err
}

// Delete 删除收藏。
func (r *FavoriteRepository) Delete(id int64) error {
	return r.db.Delete(&db.Favorite{}, id).Error
}
