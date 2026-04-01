package service

import (
	"fmt"

	"caorushizi.cn/mediago/internal/api/sse"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
	"caorushizi.cn/mediago/internal/logger"
)

// ConversionService is the business logic layer for conversion records.
type ConversionService struct {
	repo      *repo.ConversionRepository
	converter *Converter
	hub       *sse.Hub
}

// NewConversionService creates a ConversionService.
func NewConversionService(repo *repo.ConversionRepository, converter *Converter, hub *sse.Hub) *ConversionService {
	return &ConversionService{repo: repo, converter: converter, hub: hub}
}

// AddConversionInput holds the input for adding a conversion record.
type AddConversionInput struct {
	Name         *string `json:"name"`
	Path         string  `json:"path"`
	OutputFormat string  `json:"outputFormat"`
	Quality      string  `json:"quality"`
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
		Name:         input.Name,
		Path:         input.Path,
		OutputFormat: input.OutputFormat,
		Quality:      input.Quality,
		Status:       "pending",
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

// StartConversion begins an ffmpeg conversion for the given record.
func (s *ConversionService) StartConversion(id int64) error {
	conv, err := s.repo.FindByIDOrFail(id)
	if err != nil {
		return err
	}
	if conv.Status != "pending" && conv.Status != "failed" {
		return fmt.Errorf("conversion %d is not in a startable state (status: %s)", id, conv.Status)
	}

	// Set status to converting
	if err := s.repo.UpdateStatus(id, "converting", 0, "", nil); err != nil {
		return err
	}

	s.hub.Broadcast("conversion-start", map[string]any{"id": id})

	// Run in background
	go func() {
		outputPath, convErr := s.converter.Start(id, conv.Path, conv.OutputFormat, conv.Quality, func(progress int) {
			_ = s.repo.UpdateStatus(id, "converting", progress, "", nil)
			s.hub.Broadcast("conversion-progress", map[string]any{"id": id, "progress": progress})
		})

		if convErr != nil {
			errMsg := convErr.Error()
			_ = s.repo.UpdateStatus(id, "failed", 0, "", &errMsg)
			s.hub.Broadcast("conversion-failed", map[string]any{"id": id, "error": errMsg})
			logger.Errorf("Conversion %d failed: %v", id, convErr)
			return
		}

		_ = s.repo.UpdateStatus(id, "done", 100, outputPath, nil)
		s.hub.Broadcast("conversion-success", map[string]any{"id": id, "outputPath": outputPath})
		logger.Infof("Conversion %d completed: %s", id, outputPath)
	}()

	return nil
}

// StopConversion cancels a running conversion.
func (s *ConversionService) StopConversion(id int64) error {
	s.converter.Stop(id)
	errMsg := "cancelled by user"
	if err := s.repo.UpdateStatus(id, "failed", 0, "", &errMsg); err != nil {
		return err
	}
	s.hub.Broadcast("conversion-stop", map[string]any{"id": id})
	return nil
}
