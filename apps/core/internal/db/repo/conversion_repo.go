package repo

import (
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"gorm.io/gorm"
)

// ErrConversionNotFound is returned when a conversion record is not found by ID.
var ErrConversionNotFound = errors.New("conversion_not_found")

// ConversionRepository 转换记录数据访问层。
type ConversionRepository struct {
	db *gorm.DB
}

// NewConversionRepository 创建 ConversionRepository。
func NewConversionRepository(database *db.Database) *ConversionRepository {
	return &ConversionRepository{db: database.DB}
}

// Create 创建转换记录。
func (r *ConversionRepository) Create(conv *db.Conversion) (*db.Conversion, error) {
	if err := r.db.Create(conv).Error; err != nil {
		return nil, err
	}
	return conv, nil
}

// FindByID 根据 ID 查找转换记录。
func (r *ConversionRepository) FindByID(id int64) (*db.Conversion, error) {
	var conv db.Conversion
	err := r.db.Where("id = ?", id).First(&conv).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindByIDOrFail 根据 ID 查找转换记录，不存在时返回错误。
func (r *ConversionRepository) FindByIDOrFail(id int64) (*db.Conversion, error) {
	conv, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	if conv == nil {
		return nil, ErrConversionNotFound
	}
	return conv, nil
}

// ConversionPaginationResult 分页查询结果。
type ConversionPaginationResult struct {
	Items []*db.Conversion `json:"items"`
	Total int64            `json:"total"`
}

// FindWithPagination 分页查询转换记录。
func (r *ConversionRepository) FindWithPagination(current, pageSize int) (*ConversionPaginationResult, error) {
	if current <= 0 {
		current = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	var total int64
	if err := r.db.Model(&db.Conversion{}).Count(&total).Error; err != nil {
		return nil, err
	}

	var items []*db.Conversion
	offset := (current - 1) * pageSize
	err := r.db.Order("createdDate ASC").Offset(offset).Limit(pageSize).Find(&items).Error
	if err != nil {
		return nil, err
	}

	return &ConversionPaginationResult{Items: items, Total: total}, nil
}

// Delete 删除转换记录。
func (r *ConversionRepository) Delete(id int64) error {
	return r.db.Delete(&db.Conversion{}, id).Error
}
