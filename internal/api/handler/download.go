package handler

import (
	"net/http"
	"strconv"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"caorushizi.cn/mediago/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// DownloadHandler 处理数据库持久化的下载任务接口。
type DownloadHandler struct {
	svc  *service.DownloadTaskService
	conf ConfigStore
}

// NewDownloadHandler 创建 DownloadHandler。
func NewDownloadHandler(svc *service.DownloadTaskService, conf ConfigStore) *DownloadHandler {
	return &DownloadHandler{svc: svc, conf: conf}
}

// Create 添加下载任务（支持批量）。
func (h *DownloadHandler) Create(c *gin.Context) {
	var req dto.AddDownloadBatchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	inputs := make([]*service.AddDownloadTaskInput, 0, len(req.Tasks))
	for _, t := range req.Tasks {
		inputs = append(inputs, &service.AddDownloadTaskInput{
			Name:    t.Name,
			Type:    t.Type,
			URL:     t.URL,
			Headers: t.Headers,
			Folder:  t.Folder,
		})
	}

	videos, err := h.svc.AddDownloadTasks(inputs)
	if err != nil {
		logger.Error("Failed to add download tasks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: videos})
}

// List 分页获取下载任务列表。
func (h *DownloadHandler) List(c *gin.Context) {
	var req dto.DownloadPaginationReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	localPath := c.Query("localPath")
	result, err := h.svc.GetDownloadTasks(req.Current, req.PageSize, req.Filter, localPath)
	if err != nil {
		logger.Error("Failed to get download tasks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: result})
}

// Get 获取单个下载任务。
func (h *DownloadHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	video, err := h.svc.FindByIDOrFail(id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Success: false, Code: http.StatusNotFound, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: video})
}

// Edit 编辑下载任务。
func (h *DownloadHandler) Edit(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	var req dto.EditDownloadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	data := make(map[string]interface{})
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.URL != nil {
		data["url"] = *req.URL
	}
	if req.Headers != nil {
		data["headers"] = *req.Headers
	}
	if req.Folder != nil {
		data["folder"] = *req.Folder
	}

	video, err := h.svc.EditDownloadTask(id, data)
	if err != nil {
		logger.Error("Failed to edit download task", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: video})
}

// Delete 删除下载任务。
func (h *DownloadHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	if err := h.svc.DeleteDownloadTask(id); err != nil {
		logger.Error("Failed to delete download task", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgDeleted)})
}

// Start 开始下载。
func (h *DownloadHandler) Start(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	var req dto.StartDownloadReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	// 同步客户端传入的 localPath 到运行时配置
	if req.LocalPath != "" {
		if err := h.conf.Set("local", req.LocalPath); err != nil {
			logger.Warn("Failed to sync localPath to config", zap.Error(err))
		}
	}

	if err := h.svc.StartDownload(id, req.LocalPath, req.DeleteSegments); err != nil {
		logger.Error("Failed to start download", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgDownloadStarted)})
}

// Stop 停止下载。
func (h *DownloadHandler) Stop(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	if err := h.svc.StopDownload(id); err != nil {
		logger.Error("Failed to stop download", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgDownloadStopped)})
}

// Logs 获取下载日志。
func (h *DownloadHandler) Logs(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	content, err := h.svc.GetDownloadLog(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: map[string]interface{}{
		"id":  id,
		"log": content,
	}})
}

// Folders 获取文件夹列表。
func (h *DownloadHandler) Folders(c *gin.Context) {
	folders, err := h.svc.GetTaskFolders()
	if err != nil {
		logger.Error("Failed to get task folders", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: folders})
}

// Export 导出下载列表。
func (h *DownloadHandler) Export(c *gin.Context) {
	text, err := h.svc.ExportDownloadList()
	if err != nil {
		logger.Error("Failed to export download list", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: text})
}

// UpdateStatus 批量更新状态。
func (h *DownloadHandler) UpdateStatus(c *gin.Context) {
	var req dto.UpdateStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	if err := h.svc.SetStatus(req.IDs, req.Status); err != nil {
		logger.Error("Failed to update status", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgStatusUpdated)})
}

// UpdateIsLive 更新直播标志。
func (h *DownloadHandler) UpdateIsLive(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: i18n.T(c, i18n.MsgInvalidID)})
		return
	}

	var req dto.UpdateIsLiveReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	video, err := h.svc.SetIsLive(id, req.IsLive)
	if err != nil {
		logger.Error("Failed to update isLive", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: video})
}

// Active 获取活跃任务。
func (h *DownloadHandler) Active(c *gin.Context) {
	tasks, err := h.svc.FindActiveTasks()
	if err != nil {
		logger.Error("Failed to find active tasks", zap.Error(err))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Success: false, Code: http.StatusInternalServerError, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Success: true, Code: http.StatusOK, Message: i18n.T(c, i18n.MsgOK), Data: tasks})
}
