package service

import (
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
)

// ConversionService 转换记录业务逻辑层。
type ConversionService struct {
	repo *repo.ConversionRepository
}

// NewConversionService 创建 ConversionService。
func NewConversionService(repo *repo.ConversionRepository) *ConversionService {
	return &ConversionService{repo: repo}
}

// AddConversionInput 添加转换记录的输入。
type AddConversionInput struct {
	Name *string `json:"name"`
	Path string  `json:"path"`
}

// ConversionPaginatedResult 分页结果。
type ConversionPaginatedResult struct {
	Total int64            `json:"total"`
	List  []*db.Conversion `json:"list"`
}

// GetConversions 分页获取转换记录。
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

// AddConversion 添加转换记录。
func (s *ConversionService) AddConversion(input *AddConversionInput) (*db.Conversion, error) {
	conv := &db.Conversion{
		Name: input.Name,
		Path: input.Path,
	}
	return s.repo.Create(conv)
}

// DeleteConversion 删除转换记录。
func (s *ConversionService) DeleteConversion(id int64) error {
	return s.repo.Delete(id)
}

// FindByIDOrFail 根据 ID 查找转换记录，不存在时返回错误。
func (s *ConversionService) FindByIDOrFail(id int64) (*db.Conversion, error) {
	return s.repo.FindByIDOrFail(id)
}
