package dto

import (
	"caorushizi.cn/mediago/internal/core"
	"github.com/google/uuid"
)

// CreateTaskReq 创建任务请求 DTO
type CreateTaskReq struct {
	ID      string            `json:"id,omitempty" example:"my-custom-id"`                             // (可选) 自定义任务 ID
	Type    core.DownloadType `json:"type" binding:"required" example:"m3u8"`                          // 下载类型
	URL     string            `json:"url" binding:"required" example:"https://example.com/video.m3u8"` // 下载 URL
	Name    string            `json:"name" binding:"required" example:"video"`                         // 文件名
	Folder  string            `json:"folder" example:"movies"`                                         // 子文件夹
	Headers []string          `json:"headers" example:"User-Agent: custom"`                            // HTTP 请求头
}

// ToDownloadParams 转换为核心下载参数
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

// CreateTaskResponse 创建任务响应
type CreateTaskResponse struct {
	ID      string `json:"id"`      // 任务ID
	Message string `json:"message"` // 响应消息
	Status  string `json:"status"`  // 任务状态 (pending/success)
}

// TaskListResponse 任务列表响应
type TaskListResponse struct {
	Tasks []core.TaskInfo `json:"tasks"` // 任务列表
	Total int             `json:"total"` // 总数量
}

// StopTaskResponse 停止任务响应
type StopTaskResponse struct {
	Message string `json:"message" example:"Task stopped"` // 响应消息
}

// TaskLogResponse 任务日志响应
type TaskLogResponse struct {
	ID  string `json:"id"`  // 任务ID
	Log string `json:"log"` // 日志内容
}
