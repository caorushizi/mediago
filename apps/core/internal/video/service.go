package video

import (
	"fmt"
	"net/url"
	"path/filepath"

	"caorushizi.cn/mediago/internal/db/repo"
	"caorushizi.cn/mediago/internal/service"
)

// Service provides video-related operations backed by the download database
type Service interface {
	GetVideoFiles() ([]Video, error)
	GetVideoByID(id int64) (*Video, error)
}

type dbService struct {
	repo      *repo.VideoRepository
	localPath string
}

// NewService creates a video service backed by the download database
func NewService(repo *repo.VideoRepository, localPath string) Service {
	return &dbService{
		repo:      repo,
		localPath: localPath,
	}
}

// GetVideoFiles returns all successfully downloaded videos that exist on disk
func (s *dbService) GetVideoFiles() ([]Video, error) {
	records, err := s.repo.FindByStatus([]string{"success"})
	if err != nil {
		return nil, fmt.Errorf("failed to query download records: %w", err)
	}

	var videos []Video
	for _, rec := range records {
		searchDir := s.localPath
		if rec.Folder != nil && *rec.Folder != "" {
			searchDir = filepath.Join(s.localPath, *rec.Folder)
		}

		exists, filePath := service.CheckFileExists(rec.Name, searchDir)
		if !exists {
			continue
		}

		fileName := filepath.Base(filePath)
		videos = append(videos, Video{
			ID:    rec.ID,
			Title: rec.Name,
			URL:   fmt.Sprintf("/videos/%s", url.PathEscape(fileName)),
		})
	}

	return videos, nil
}

// GetVideoByID returns a single video by its download task ID
func (s *dbService) GetVideoByID(id int64) (*Video, error) {
	rec, err := s.repo.FindByIDOrFail(id)
	if err != nil {
		return nil, err
	}

	if rec.Status != "success" {
		return nil, fmt.Errorf("download task %d is not completed", id)
	}

	searchDir := s.localPath
	if rec.Folder != nil && *rec.Folder != "" {
		searchDir = filepath.Join(s.localPath, *rec.Folder)
	}

	exists, filePath := service.CheckFileExists(rec.Name, searchDir)
	if !exists {
		return nil, fmt.Errorf("video file not found for task %d", id)
	}

	fileName := filepath.Base(filePath)
	return &Video{
		ID:    rec.ID,
		Title: rec.Name,
		URL:   fmt.Sprintf("/videos/%s", url.PathEscape(fileName)),
	}, nil
}
