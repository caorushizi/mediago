package dto

// AddDownloadReq 添加下载任务请求。
type AddDownloadReq struct {
	Type    string  `json:"type" binding:"required"`
	Name    string  `json:"name"`
	URL     string  `json:"url" binding:"required"`
	Headers *string `json:"headers"`
	Folder  *string `json:"folder"`
}

// AddDownloadBatchReq 批量添加下载任务请求。
type AddDownloadBatchReq struct {
	Tasks         []AddDownloadReq `json:"tasks" binding:"required"`
	StartDownload bool             `json:"startDownload"`
}

// EditDownloadReq 编辑下载任务请求。
type EditDownloadReq struct {
	Name    *string `json:"name"`
	URL     *string `json:"url"`
	Headers *string `json:"headers"`
	Folder  *string `json:"folder"`
}

// DownloadPaginationReq 分页查询请求。
type DownloadPaginationReq struct {
	Current  int    `form:"current" json:"current"`
	PageSize int    `form:"pageSize" json:"pageSize"`
	Filter   string `form:"filter" json:"filter"`
}

// UpdateStatusReq 批量更新状态请求。
type UpdateStatusReq struct {
	IDs    []int64 `json:"ids" binding:"required"`
	Status string  `json:"status" binding:"required"`
}

// UpdateIsLiveReq 更新直播标志请求。
type UpdateIsLiveReq struct {
	IsLive bool `json:"isLive"`
}

// StartDownloadReq 开始下载请求。
type StartDownloadReq struct {
	LocalPath      string `json:"localPath"`
	DeleteSegments bool   `json:"deleteSegments"`
}
