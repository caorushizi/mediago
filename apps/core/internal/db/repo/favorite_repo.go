package repo

import (
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"gorm.io/gorm"
)

// FavoriteRepository is the data access layer for favorites.
type FavoriteRepository struct {
	db *gorm.DB
}

// NewFavoriteRepository creates a FavoriteRepository.
func NewFavoriteRepository(database *db.Database) *FavoriteRepository {
	return &FavoriteRepository{db: database.DB}
}

// Create creates a favorite entry.
func (r *FavoriteRepository) Create(fav *db.Favorite) (*db.Favorite, error) {
	if err := r.db.Create(fav).Error; err != nil {
		return nil, err
	}
	return fav, nil
}

// CreateMany creates multiple favorite entries in bulk.
func (r *FavoriteRepository) CreateMany(favs []*db.Favorite) ([]*db.Favorite, error) {
	if len(favs) == 0 {
		return favs, nil
	}
	if err := r.db.Create(&favs).Error; err != nil {
		return nil, err
	}
	return favs, nil
}

// FindByURL looks up a favorite by URL.
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

// FindAll retrieves all favorites.
func (r *FavoriteRepository) FindAll(order string) ([]*db.Favorite, error) {
	var favs []*db.Favorite
	err := r.db.Order("createdDate " + order).Find(&favs).Error
	return favs, err
}

// Delete removes a favorite entry.
func (r *FavoriteRepository) Delete(id int64) error {
	return r.db.Delete(&db.Favorite{}, id).Error
}
