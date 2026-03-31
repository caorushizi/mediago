package dto

import (
	"caorushizi.cn/mediago/internal/core"
	"github.com/google/uuid"
)

// CreateTaskReq Create task request DTO
type CreateTaskReq struct {
	ID      string            `json:"id,omitempty" example:"my-custom-id"`                             // (optional) Custom task ID
	Type    core.DownloadType `json:"type" binding:"required" example:"m3u8"`                          // Download type
	URL     string            `json:"url" binding:"required" example:"https://example.com/video.m3u8"` // Download URL
	Name    string            `json:"name" binding:"required" example:"video"`                         // File name
	Folder  string            `json:"folder" example:"movies"`                                         // Sub-folder
	Headers []string          `json:"headers" example:"User-Agent: custom"`                            // HTTP request headers
}

// ToDownloadParams Convert to core download parameters
func (r *CreateTaskReq) ToDownloadParams() core.DownloadParams {
	id := r.ID
	if id == "" {
		id = uuid.New().String()
	}
	return core.DownloadParams{
		ID:      core.TaskID(id),
		Type:    r.Type,
		URL:     r.URL,
		Name:    r.Name,
		Folder:  r.Folder,
		Headers: r.Headers,
	}
}

// CreateTaskResponse Create task response
type CreateTaskResponse struct {
	ID      string `json:"id"`      // Task ID
	Message string `json:"message"` // Response message
	Status  string `json:"status"`  // Task status (pending/success)
}

// TaskListResponse Task list response
type TaskListResponse struct {
	Tasks []core.TaskInfo `json:"tasks"` // Task list
	Total int             `json:"total"` // Total count
}

// StopTaskResponse Stop task response
type StopTaskResponse struct {
	Message string `json:"message" example:"Task stopped"` // Response message
}

// TaskLogResponse Task log response
type TaskLogResponse struct {
	ID  string `json:"id"`  // Task ID
	Log string `json:"log"` // Log content
}
