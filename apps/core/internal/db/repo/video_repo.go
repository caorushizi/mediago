package repo

import (
	"errors"

	"caorushizi.cn/mediago/internal/db"
	"gorm.io/gorm"
)

// ErrVideoNotFound is returned when a video record is not found by ID.
var ErrVideoNotFound = errors.New("video_not_found")

// VideoRepository is the data access layer for download tasks.
type VideoRepository struct {
	db *gorm.DB
}

// NewVideoRepository creates a VideoRepository.
func NewVideoRepository(database *db.Database) *VideoRepository {
	return &VideoRepository{db: database.DB}
}

// Create creates a single download task.
func (r *VideoRepository) Create(video *db.Video) (*db.Video, error) {
	if err := r.db.Create(video).Error; err != nil {
		return nil, err
	}
	return video, nil
}

// CreateMany creates multiple download tasks in bulk.
func (r *VideoRepository) CreateMany(videos []*db.Video) ([]*db.Video, error) {
	if len(videos) == 0 {
		return videos, nil
	}
	if err := r.db.Create(&videos).Error; err != nil {
		return nil, err
	}
	return videos, nil
}

// FindByID looks up a task by ID.
func (r *VideoRepository) FindByID(id int64) (*db.Video, error) {
	var video db.Video
	err := r.db.Where("id = ?", id).First(&video).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &video, nil
}

// FindByIDOrFail looks up a task by ID, returning an error if not found.
func (r *VideoRepository) FindByIDOrFail(id int64) (*db.Video, error) {
	video, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	if video == nil {
		return nil, ErrVideoNotFound
	}
	return video, nil
}

// FindByName looks up a task by name.
func (r *VideoRepository) FindByName(name string) (*db.Video, error) {
	var video db.Video
	err := r.db.Where("name = ?", name).First(&video).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &video, nil
}

// FindByURL looks up a task by URL.
func (r *VideoRepository) FindByURL(url string) (*db.Video, error) {
	var video db.Video
	err := r.db.Where("url = ?", url).First(&video).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &video, nil
}

// FindAll retrieves all tasks.
func (r *VideoRepository) FindAll(order string) ([]*db.Video, error) {
	var videos []*db.Video
	err := r.db.Order("createdDate " + order).Find(&videos).Error
	return videos, err
}

// FindByStatus looks up tasks matching the given list of statuses.
func (r *VideoRepository) FindByStatus(statuses []string) ([]*db.Video, error) {
	var videos []*db.Video
	err := r.db.Where("status IN ?", statuses).Find(&videos).Error
	return videos, err
}

// PaginationResult holds the result of a paginated query.
type PaginationResult struct {
	Items []*db.Video `json:"items"`
	Total int64       `json:"total"`
}

// FindWithPagination queries download tasks with pagination.
// filter: "" no filter, "done" → status=success, "list" → status!=success
func (r *VideoRepository) FindWithPagination(current, pageSize int, filter string) (*PaginationResult, error) {
	if current <= 0 {
		current = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}

	query := r.db.Model(&db.Video{})

	switch filter {
	case "done":
		query = query.Where("status = ?", "success")
	case "list":
		query = query.Where("status != ?", "success")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	var items []*db.Video
	offset := (current - 1) * pageSize
	err := query.Order("createdDate DESC").Offset(offset).Limit(pageSize).Find(&items).Error
	if err != nil {
		return nil, err
	}

	return &PaginationResult{Items: items, Total: total}, nil
}

// FindDistinctFolders retrieves all distinct non-empty folder values.
func (r *VideoRepository) FindDistinctFolders() ([]string, error) {
	var folders []string
	err := r.db.Model(&db.Video{}).
		Where("folder IS NOT NULL AND folder != ''").
		Distinct("folder").
		Pluck("folder", &folders).Error
	return folders, err
}

// Update updates a download task.
func (r *VideoRepository) Update(id int64, data map[string]interface{}) (*db.Video, error) {
	video, err := r.FindByIDOrFail(id)
	if err != nil {
		return nil, err
	}
	if err := r.db.Model(video).Updates(data).Error; err != nil {
		return nil, err
	}
	return video, nil
}

// UpdateStatus updates the status of multiple tasks in bulk.
func (r *VideoRepository) UpdateStatus(ids []int64, status string) error {
	if len(ids) == 0 {
		return nil
	}
	return r.db.Model(&db.Video{}).Where("id IN ?", ids).Update("status", status).Error
}

// UpdateIsLive updates the live-stream flag.
func (r *VideoRepository) UpdateIsLive(id int64, isLive bool) (*db.Video, error) {
	video, err := r.FindByIDOrFail(id)
	if err != nil {
		return nil, err
	}
	video.IsLive = isLive
	if err := r.db.Save(video).Error; err != nil {
		return nil, err
	}
	return video, nil
}

// Delete removes a download task.
func (r *VideoRepository) Delete(id int64) error {
	return r.db.Delete(&db.Video{}, id).Error
}

// DeleteMany removes multiple download tasks in bulk.
func (r *VideoRepository) DeleteMany(ids []int64) error {
	if len(ids) == 0 {
		return nil
	}
	return r.db.Delete(&db.Video{}, ids).Error
}
