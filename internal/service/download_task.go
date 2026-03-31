package service

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strconv"

	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/db/repo"
	"caorushizi.cn/mediago/internal/tasklog"
)

// DownloadTaskService 下载任务业务逻辑层。
type DownloadTaskService struct {
	repo  *repo.VideoRepository
	queue *core.TaskQueue
	logs  *tasklog.Manager
}

// NewDownloadTaskService 创建 DownloadTaskService。
func NewDownloadTaskService(repo *repo.VideoRepository, queue *core.TaskQueue, logs *tasklog.Manager) *DownloadTaskService {
	return &DownloadTaskService{repo: repo, queue: queue, logs: logs}
}

// AddDownloadTaskInput 添加下载任务的输入。
type AddDownloadTaskInput struct {
	Name    string  `json:"name"`
	Type    string  `json:"type"`
	URL     string  `json:"url"`
	Headers *string `json:"headers"`
	Folder  *string `json:"folder"`
}

// DownloadTaskWithFile 带文件存在性信息的下载任务。
type DownloadTaskWithFile struct {
	*db.Video
	Exists bool   `json:"exists"`
	File   string `json:"file,omitempty"`
}

// PaginatedResult 分页结果。
type PaginatedResult struct {
	Total int64                  `json:"total"`
	List  []*DownloadTaskWithFile `json:"list"`
}

// AddDownloadTask 添加单个下载任务（含自动标题生成和名称唯一性检查）。
func (s *DownloadTaskService) AddDownloadTask(input *AddDownloadTaskInput) (*db.Video, error) {
	title := input.Name

	if title == "" && input.Type == "bilibili" {
		title = GetPageTitle(input.URL, "")
	}
	if title == "" {
		title = fmt.Sprintf("untitled-%s", RandomName())
	}

	existing, err := s.repo.FindByName(title)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		title = fmt.Sprintf("%s-%s", title, RandomName())
	}

	video := &db.Video{
		Name:    title,
		Type:    input.Type,
		URL:     input.URL,
		Headers: input.Headers,
		Folder:  input.Folder,
	}

	return s.repo.Create(video)
}

// AddDownloadTasks 批量添加下载任务。
func (s *DownloadTaskService) AddDownloadTasks(inputs []*AddDownloadTaskInput) ([]*db.Video, error) {
	videos := make([]*db.Video, 0, len(inputs))
	for _, input := range inputs {
		title := input.Name

		if title == "" && input.Type == "bilibili" {
			title = GetPageTitle(input.URL, "")
		}
		if title == "" {
			title = fmt.Sprintf("untitled-%s", RandomName())
		}

		existing, err := s.repo.FindByName(title)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			title = fmt.Sprintf("%s-%s", title, RandomName())
		}

		videos = append(videos, &db.Video{
			Name:    title,
			Type:    input.Type,
			URL:     input.URL,
			Headers: input.Headers,
			Folder:  input.Folder,
		})
	}

	return s.repo.CreateMany(videos)
}

// EditDownloadTask 编辑下载任务。
func (s *DownloadTaskService) EditDownloadTask(id int64, data map[string]interface{}) (*db.Video, error) {
	return s.repo.Update(id, data)
}

// GetDownloadTasks 分页获取下载任务列表（含文件存在性检查）。
func (s *DownloadTaskService) GetDownloadTasks(current, pageSize int, filter, localPath string) (*PaginatedResult, error) {
	result, err := s.repo.FindWithPagination(current, pageSize, filter)
	if err != nil {
		return nil, err
	}

	list := make([]*DownloadTaskWithFile, 0, len(result.Items))
	for _, item := range result.Items {
		taskWithFile := &DownloadTaskWithFile{
			Video:  item,
			Exists: false,
		}
		if item.Status == "success" && localPath != "" {
			searchDir := localPath
			if item.Folder != nil && *item.Folder != "" {
				searchDir = filepath.Join(localPath, *item.Folder)
			}
			exists, file := CheckFileExists(item.Name, searchDir)
			taskWithFile.Exists = exists
			taskWithFile.File = file
		}
		list = append(list, taskWithFile)
	}

	return &PaginatedResult{Total: result.Total, List: list}, nil
}

// StartDownload 开始下载任务。
func (s *DownloadTaskService) StartDownload(taskID int64, localPath string, deleteSegments bool) error {
	video, err := s.repo.FindByIDOrFail(taskID)
	if err != nil {
		return err
	}

	// 更新状态为等待中
	if err := s.repo.UpdateStatus([]int64{taskID}, "pending"); err != nil {
		return err
	}

	folder := ""
	if video.Folder != nil {
		folder = *video.Folder
	}

	var headers []string
	if video.Headers != nil && *video.Headers != "" {
		if err := json.Unmarshal([]byte(*video.Headers), &headers); err != nil {
			// If parsing fails, treat as empty headers
			headers = []string{}
		}
	}

	params := core.DownloadParams{
		ID:      core.TaskID(strconv.FormatInt(taskID, 10)),
		Type:    core.DownloadType(video.Type),
		URL:     video.URL,
		Name:    video.Name,
		Folder:  folder,
		Headers: headers,
	}

	status := s.queue.Enqueue(params)

	if status == core.StatusDownloading {
		return s.repo.UpdateStatus([]int64{taskID}, "downloading")
	} else if status == core.StatusPending {
		// 保持 pending 状态
		return nil
	}

	// 入队失败
	return s.repo.UpdateStatus([]int64{taskID}, "failed")
}

// StopDownload 停止下载任务。
func (s *DownloadTaskService) StopDownload(id int64) error {
	return s.queue.Stop(core.TaskID(strconv.FormatInt(id, 10)))
}

// DeleteDownloadTask 删除下载任务。
func (s *DownloadTaskService) DeleteDownloadTask(id int64) error {
	return s.repo.Delete(id)
}

// GetDownloadLog 获取下载日志。
func (s *DownloadTaskService) GetDownloadLog(id int64) (string, error) {
	if s.logs == nil {
		return "", nil
	}
	content, err := s.logs.Read(strconv.FormatInt(id, 10))
	if err != nil {
		return "", err
	}
	return content, nil
}

// GetTaskFolders 获取所有文件夹列表。
func (s *DownloadTaskService) GetTaskFolders() ([]string, error) {
	return s.repo.FindDistinctFolders()
}

// ExportDownloadList 导出下载列表为文本。
func (s *DownloadTaskService) ExportDownloadList() (string, error) {
	tasks, err := s.repo.FindAll("DESC")
	if err != nil {
		return "", err
	}

	lines := make([]string, 0, len(tasks))
	for _, task := range tasks {
		lines = append(lines, fmt.Sprintf("%s %s", task.URL, task.Name))
	}
	return joinLines(lines), nil
}

// SetStatus 批量更新下载状态。
func (s *DownloadTaskService) SetStatus(ids []int64, status string) error {
	return s.repo.UpdateStatus(ids, status)
}

// SetIsLive 更新直播标志。
func (s *DownloadTaskService) SetIsLive(id int64, isLive bool) (*db.Video, error) {
	return s.repo.UpdateIsLive(id, isLive)
}

// FindActiveTasks 查找活跃任务（等待中或下载中）。
func (s *DownloadTaskService) FindActiveTasks() ([]*db.Video, error) {
	return s.repo.FindByStatus([]string{"pending", "downloading"})
}

// FindByID 根据 ID 查找任务。
func (s *DownloadTaskService) FindByID(id int64) (*db.Video, error) {
	return s.repo.FindByID(id)
}

// FindByIDOrFail 根据 ID 查找任务，不存在时返回错误。
func (s *DownloadTaskService) FindByIDOrFail(id int64) (*db.Video, error) {
	return s.repo.FindByIDOrFail(id)
}

// FindByName 根据名称查找任务。
func (s *DownloadTaskService) FindByName(name string) (*db.Video, error) {
	return s.repo.FindByName(name)
}

// FindByURL 根据 URL 查找任务。
func (s *DownloadTaskService) FindByURL(url string) (*db.Video, error) {
	return s.repo.FindByURL(url)
}

func joinLines(lines []string) string {
	result := ""
	for i, line := range lines {
		if i > 0 {
			result += "\n"
		}
		result += line
	}
	return result
}
