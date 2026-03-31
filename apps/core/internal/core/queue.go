// Package core 包含任务队列实现
package core

import (
	"context"
	"errors"
	"sync"

	"caorushizi.cn/mediago/internal/logger"
	"go.uber.org/zap"
)

var (
	ErrTaskNotFound = errors.New("task not found")
)

// TaskQueue 任务队列，负责并发控制、任务调度与事件分发
type TaskQueue struct {
	downloader Downloader // 下载器实例
	maxRunner  int        // 最大并发数

	mu     sync.RWMutex                  // 读写锁
	queue  []DownloadParams              // 待执行任务队列
	active map[TaskID]context.CancelFunc // 活跃任务（任务ID -> 取消函数）
	tasks  map[TaskID]*TaskInfo          // 任务信息表（任务ID -> 任务信息）

	// 事件回调函数
	onStart    func(TaskID)
	onSuccess  func(TaskID)
	onFailed   func(TaskID, error)
	onStopped  func(TaskID)
	onProgress func(ProgressEvent)
	onMessage  func(MessageEvent)
}

// NewTaskQueue 创建任务队列实例
func NewTaskQueue(d Downloader, maxRunner int) *TaskQueue {
	return &TaskQueue{
		downloader: d,
		maxRunner:  maxRunner,
		active:     make(map[TaskID]context.CancelFunc),
		tasks:      make(map[TaskID]*TaskInfo),
	}
}

func (q *TaskQueue) IsFull() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.active) >= q.maxRunner
}

func (q *TaskQueue) Downloader() Downloader {
	return q.downloader
}

// SetMaxRunner 设置最大并发数
func (q *TaskQueue) SetMaxRunner(n int) {
	q.mu.Lock()
	q.maxRunner = n
	q.mu.Unlock()
	q.tryRun()
}

// Enqueue 添加任务到队列
func (q *TaskQueue) Enqueue(p DownloadParams) TaskStatus {
	q.mu.Lock()

	// 初始化任务信息
	q.tasks[p.ID] = &TaskInfo{
		ID:      p.ID,
		Type:    p.Type,
		URL:     p.URL,
		Name:    p.Name,
		Status:  StatusPending,
		Percent: 0,
		Speed:   "",
		IsLive:  false,
	}

	if len(q.active) < q.maxRunner {
		q.tasks[p.ID].Status = StatusDownloading
		ctx, cancel := context.WithCancel(context.Background())
		q.active[p.ID] = cancel
		q.mu.Unlock()

		logger.Info("Task started immediately", zap.String("id", string(p.ID)))
		go q.execute(p, ctx)
		return StatusDownloading
	} else {
		q.queue = append(q.queue, p)
		queueLen := len(q.queue)
		q.mu.Unlock()

		logger.Info("Task enqueued",
			zap.String("id", string(p.ID)),
			zap.Int("queueLength", queueLen))
		return StatusPending
	}
}

// Stop 停止指定任务
func (q *TaskQueue) Stop(id TaskID) error {
	q.mu.Lock()
	cancel, ok := q.active[id]
	q.mu.Unlock()

	if !ok {
		logger.Warn("Attempted to stop non-existent task", zap.String("id", string(id)))
		return ErrTaskNotFound
	}

	logger.Info("Stopping task", zap.String("id", string(id)))
	// 调用取消函数
	cancel()
	return nil
}

// tryRun 尝试运行队列中的任务
func (q *TaskQueue) tryRun() {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.active) < q.maxRunner && len(q.queue) > 0 {
		task := q.queue[0]
		q.queue = q.queue[1:]

		q.tasks[task.ID].Status = StatusDownloading
		ctx, cancel := context.WithCancel(context.Background())
		q.active[task.ID] = cancel

		go q.execute(task, ctx)
	}
}

// execute 执行单个下载任务
func (q *TaskQueue) execute(p DownloadParams, ctx context.Context) {
	logger.Info("Executing task",
		zap.String("id", string(p.ID)),
		zap.String("type", string(p.Type)))

	// 更新任务状态为下载中
	q.mu.Lock()
	if task, ok := q.tasks[p.ID]; ok {
		task.Status = StatusDownloading
	}
	q.mu.Unlock()

	// 发送开始事件
	if q.onStart != nil {
		q.onStart(p.ID)
	}

	// 执行下载
	err := q.downloader.Download(ctx, p, Callbacks{
		OnProgress: func(e ProgressEvent) {
			// 更新任务进度信息
			q.mu.Lock()
			if task, ok := q.tasks[p.ID]; ok {
				task.Percent = e.Percent
				task.Speed = e.Speed
				task.IsLive = e.IsLive
			}
			q.mu.Unlock()

			if q.onProgress != nil {
				q.onProgress(e)
			}
		},
		OnMessage: func(m MessageEvent) {
			if q.onMessage != nil {
				q.onMessage(m)
			}
		},
	})

	// 从活跃任务表中移除
	q.mu.Lock()
	delete(q.active, p.ID)
	q.mu.Unlock()

	// 根据错误类型发送相应事件并更新任务状态
	switch {
	case err == nil:
		// 成功完成
		logger.Info("Task completed successfully", zap.String("id", string(p.ID)))
		q.mu.Lock()
		if task, ok := q.tasks[p.ID]; ok {
			task.Status = StatusSuccess
			task.Percent = 100
		}
		q.mu.Unlock()
		if q.onSuccess != nil {
			q.onSuccess(p.ID)
		}
	case errors.Is(err, context.Canceled):
		// 被取消
		logger.Info("Task was stopped", zap.String("id", string(p.ID)))
		q.mu.Lock()
		if task, ok := q.tasks[p.ID]; ok {
			task.Status = StatusStopped
		}
		q.mu.Unlock()
		if q.onStopped != nil {
			q.onStopped(p.ID)
		}
	default:
		// 失败
		logger.Error("Task failed",
			zap.String("id", string(p.ID)),
			zap.Error(err))
		q.mu.Lock()
		if task, ok := q.tasks[p.ID]; ok {
			task.Status = StatusFailed
			task.Error = err.Error()
		}
		q.mu.Unlock()
					if q.onFailed != nil {
						q.onFailed(p.ID, err)
					}
			}
		
			q.tryRun()
		}
// 事件钩子注册方法（供 API 层使用）

func (q *TaskQueue) OnStart(fn func(TaskID)) {
	q.onStart = fn
}

func (q *TaskQueue) OnSuccess(fn func(TaskID)) {
	q.onSuccess = fn
}

func (q *TaskQueue) OnFailed(fn func(TaskID, error)) {
	q.onFailed = fn
}

func (q *TaskQueue) OnStopped(fn func(TaskID)) {
	q.onStopped = fn
}

func (q *TaskQueue) OnProgress(fn func(ProgressEvent)) {
	q.onProgress = fn
}

func (q *TaskQueue) OnMessage(fn func(MessageEvent)) {
	q.onMessage = fn
}

// GetTask 获取指定任务的信息
func (q *TaskQueue) GetTask(id TaskID) (*TaskInfo, bool) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	task, ok := q.tasks[id]
	if !ok {
		return nil, false
	}
	// 返回副本，避免外部修改
	taskCopy := *task
	return &taskCopy, true
}

// GetAllTasks 获取所有任务的信息
func (q *TaskQueue) GetAllTasks() []TaskInfo {
	q.mu.RLock()
	defer q.mu.RUnlock()

	tasks := make([]TaskInfo, 0, len(q.tasks))
	for _, task := range q.tasks {
		tasks = append(tasks, *task)
	}
	return tasks
}
