// Package parser 进度追踪与节流
package parser

import (
	"sync"
	"time"
)

// TaskID 任务唯一标识符
type TaskID string

// progressRecord 进度记录
type progressRecord struct {
	lastUpdate time.Time
}

// ProgressTracker 进度节流
type ProgressTracker struct {
	mu      sync.Mutex
	records map[TaskID]*progressRecord
}

// NewTracker 创建进度追踪器
func NewTracker() *ProgressTracker {
	return &ProgressTracker{
		records: make(map[TaskID]*progressRecord),
	}
}

// ShouldUpdate 判断是否应当上报进度
// 策略：200ms 节流
func (pt *ProgressTracker) ShouldUpdate(id TaskID) bool {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	rec, exists := pt.records[id]
	if !exists {
		return true
	}

	if time.Since(rec.lastUpdate) < 50*time.Millisecond {
		return false
	}

	return true
}

// Update 更新进度记录
func (pt *ProgressTracker) Update(id TaskID) {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	if _, exists := pt.records[id]; !exists {
		pt.records[id] = &progressRecord{}
	}
	pt.records[id].lastUpdate = time.Now()
}

// Remove 移除某任务的进度记录
func (pt *ProgressTracker) Remove(id TaskID) {
	pt.mu.Lock()
	defer pt.mu.Unlock()
	delete(pt.records, id)
}
