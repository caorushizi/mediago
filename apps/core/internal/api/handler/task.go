package handler

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"sync"

	"caorushizi.cn/mediago/internal/api/dto"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/i18n"
	"caorushizi.cn/mediago/internal/logger"
	"caorushizi.cn/mediago/internal/tasklog"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// TaskHandler 处理任务相关接口。
type TaskHandler struct {
	queue *core.TaskQueue
	logs  *tasklog.Manager
	mu    sync.Mutex
	seq   int64
}

// NewTaskHandler 创建 TaskHandler。
func NewTaskHandler(queue *core.TaskQueue, logs *tasklog.Manager) *TaskHandler {
	return &TaskHandler{
		queue: queue,
		logs:  logs,
	}
}

// Create 创建下载任务
// @Summary 创建下载任务
// @Description 创建一个新的下载任务并加入队列，可选择性提供任务 ID
// @Description 支持 M3U8、Bilibili、Direct 三种下载类型
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body dto.CreateTaskReq true "下载任务参数"
// @Success 200 {object} dto.SuccessResponse{data=dto.CreateTaskResponse} "任务创建成功，返回任务状态 (pending/success)"
// @Failure 400 {object} dto.ErrorResponse "请求参数错误"
// @Router /tasks [post]
func (h *TaskHandler) Create(c *gin.Context) {
	var req dto.CreateTaskReq
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid task creation request",
			zap.String("clientIP", c.ClientIP()),
			zap.Error(err))
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Success: false, Code: http.StatusBadRequest, Message: err.Error()})
		return
	}

	params := req.ToDownloadParams()

	logger.Info("Task creation request received",
		zap.String("id", string(params.ID)),
		zap.String("type", string(params.Type)),
		zap.String("url", params.URL),
		zap.String("clientIP", c.ClientIP()))

	status := h.queue.Enqueue(params)

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgTaskCreated),
		Data: dto.CreateTaskResponse{
			ID:      string(params.ID),
			Message: i18n.T(c, i18n.MsgTaskEnqueued),
			Status:  string(status),
		},
	})
}

// Get 获取任务状态
// @Summary 获取任务状态
// @Description 获取指定ID的任务状态和进度信息
// @Tags Tasks
// @Accept json
// @Produce json
// @Param id path string true "任务ID" example(task-1)
// @Success 200 {object} dto.SuccessResponse{data=core.TaskInfo} "任务信息"
// @Failure 404 {object} dto.ErrorResponse "任务不存在"
// @Router /tasks/{id} [get]
func (h *TaskHandler) Get(c *gin.Context) {
	id := c.Param("id")

	task, ok := h.queue.GetTask(core.TaskID(id))
	if !ok {
		logger.Warn("Task not found",
			zap.String("id", id),
			zap.String("clientIP", c.ClientIP()))
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Success: false, Code: http.StatusNotFound, Message: i18n.T(c, i18n.MsgTaskNotFound)})
		return
	}

	logger.Debug("Task info retrieved",
		zap.String("id", id),
		zap.String("status", string(task.Status)),
		zap.String("clientIP", c.ClientIP()))

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data:    task,
	})
}

// List 获取所有任务状态
// @Summary 获取所有任务状态
// @Description 获取所有任务的状态和进度信息列表
// @Tags Tasks
// @Accept json
// @Produce json
// @Success 200 {object} dto.SuccessResponse{data=dto.TaskListResponse} "任务列表"
// @Router /tasks [get]
func (h *TaskHandler) List(c *gin.Context) {
	tasks := h.queue.GetAllTasks()

	logger.Debug("All tasks info retrieved",
		zap.Int("count", len(tasks)),
		zap.String("clientIP", c.ClientIP()))

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data: dto.TaskListResponse{
			Tasks: tasks,
			Total: len(tasks),
		},
	})
}

// Stop 停止下载任务
// @Summary 停止下载任务
// @Description 停止指定ID的下载任务
// @Tags Tasks
// @Accept json
// @Produce json
// @Param id path string true "任务ID" example(task-1)
// @Success 200 {object} dto.SuccessResponse{data=dto.StopTaskResponse} "任务停止成功"
// @Failure 404 {object} dto.ErrorResponse "任务不存在"
// @Router /tasks/{id}/stop [post]
func (h *TaskHandler) Stop(c *gin.Context) {
	id := c.Param("id")

	logger.Info("Stop task request received",
		zap.String("id", id),
		zap.String("clientIP", c.ClientIP()))

	if err := h.queue.Stop(core.TaskID(id)); err != nil {
		logger.Warn("Failed to stop task",
			zap.String("id", id),
			zap.Error(err))
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Success: false, Code: http.StatusNotFound, Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgTaskStopped),
		Data:    dto.StopTaskResponse{Message: i18n.T(c, i18n.MsgTaskStopped)},
	})
}

// Logs 获取任务日志
// @Summary 获取任务日志
// @Description 获取指定任务ID的完整下载日志内容
// @Tags Tasks
// @Accept json
// @Produce json
// @Param id path string true "任务ID" example(task-1)
// @Success 200 {object} dto.SuccessResponse{data=dto.TaskLogResponse} "任务日志内容"
// @Failure 404 {object} dto.ErrorResponse "日志不存在"
// @Failure 500 {object} dto.ErrorResponse "日志系统未配置或读取失败"
// @Router /tasks/{id}/logs [get]
func (h *TaskHandler) Logs(c *gin.Context) {
	id := c.Param("id")

	if h.logs == nil {
		logger.Error("Task log manager not configured",
			zap.String("id", id),
			zap.String("clientIP", c.ClientIP()))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusInternalServerError,
			Message: i18n.T(c, i18n.MsgTaskLogNotConfigured),
		})
		return
	}

	content, err := h.logs.Read(id)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			logger.Warn("Task log not found",
				zap.String("id", id),
				zap.String("clientIP", c.ClientIP()))
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Success: false,
				Code:    http.StatusNotFound,
				Message: i18n.T(c, i18n.MsgTaskLogNotFound),
			})
			return
		}

		logger.Error("Failed to read task log",
			zap.String("id", id),
			zap.Error(err),
			zap.String("clientIP", c.ClientIP()))
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Code:    http.StatusInternalServerError,
			Message: i18n.T(c, i18n.MsgTaskLogReadFailed),
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Code:    http.StatusOK,
		Message: i18n.T(c, i18n.MsgOK),
		Data: dto.TaskLogResponse{
			ID:  id,
			Log: content,
		},
	})
}

func (h *TaskHandler) nextTaskID() core.TaskID {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.seq++
	return core.TaskID(strconv.FormatInt(h.seq, 10))
}
