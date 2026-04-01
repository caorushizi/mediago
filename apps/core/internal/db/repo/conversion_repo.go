package repo

import (
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"gorm.io/gorm"
)

// ErrConversionNotFound is returned when a conversion record is not found by ID.
var ErrConversionNotFound = errors.New("conversion_not_found")

// ConversionRepository is the data access layer for conversion records.
type ConversionRepository struct {
	db *gorm.DB
}

// NewConversionRepository creates a ConversionRepository.
func NewConversionRepository(database *db.Database) *ConversionRepository {
	return &ConversionRepository{db: database.DB}
}

// Create creates a conversion record.
func (r *ConversionRepository) Create(conv *db.Conversion) (*db.Conversion, error) {
	if err := r.db.Create(conv).Error; err != nil {
		return nil, err
	}
	return conv, nil
}

// FindByID looks up a conversion record by ID.
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

// FindByIDOrFail looks up a conversion record by ID, returning an error if not found.
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

// ConversionPaginationResult holds the result of a paginated query.
type ConversionPaginationResult struct {
	Items []*db.Conversion `json:"items"`
	Total int64            `json:"total"`
}

// FindWithPagination queries conversion records with pagination.
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

// UpdateStatus updates the status, progress, outputPath, and error fields.
func (r *ConversionRepository) UpdateStatus(id int64, status string, progress int, outputPath string, errMsg *string) error {
	updates := map[string]any{
		"status":     status,
		"progress":   progress,
		"outputPath": outputPath,
	}
	if errMsg != nil {
		updates["error"] = *errMsg
	}
	return r.db.Model(&db.Conversion{}).Where("id = ?", id).Updates(updates).Error
}

// Delete removes a conversion record.
func (r *ConversionRepository) Delete(id int64) error {
	return r.db.Delete(&db.Conversion{}, id).Error
}
