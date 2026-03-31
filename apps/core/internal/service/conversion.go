package service

import (
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
)

// ConversionService is the business logic layer for conversion records.
type ConversionService struct {
	repo *repo.ConversionRepository
}

// NewConversionService creates a ConversionService.
func NewConversionService(repo *repo.ConversionRepository) *ConversionService {
	return &ConversionService{repo: repo}
}

// AddConversionInput holds the input for adding a conversion record.
type AddConversionInput struct {
	Name *string `json:"name"`
	Path string  `json:"path"`
}

// ConversionPaginatedResult holds the paginated result.
type ConversionPaginatedResult struct {
	Total int64            `json:"total"`
	List  []*db.Conversion `json:"list"`
}

// GetConversions retrieves conversion records with pagination.
func (s *ConversionService) GetConversions(current, pageSize int) (*ConversionPaginatedResult, error) {
	result, err := s.repo.FindWithPagination(current, pageSize)
	if err != nil {
		return nil, err
	}
	return &ConversionPaginatedResult{
		Total: result.Total,
		List:  result.Items,
	}, nil
}

// AddConversion adds a conversion record.
func (s *ConversionService) AddConversion(input *AddConversionInput) (*db.Conversion, error) {
	conv := &db.Conversion{
		Name: input.Name,
		Path: input.Path,
	}
	return s.repo.Create(conv)
}

// DeleteConversion removes a conversion record.
func (s *ConversionService) DeleteConversion(id int64) error {
	return s.repo.Delete(id)
}

// FindByIDOrFail looks up a conversion record by ID, returning an error if not found.
func (s *ConversionService) FindByIDOrFail(id int64) (*db.Conversion, error) {
	return s.repo.FindByIDOrFail(id)
}
