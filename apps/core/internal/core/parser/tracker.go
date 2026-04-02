// Package parser progress tracking and throttling
package parser

import (
	"sync"
	"time"
)

// TaskID is the unique identifier for a task
type TaskID string

// progressRecord holds a progress record
type progressRecord struct {
	lastUpdate time.Time
}

// ProgressTracker throttles progress updates
type ProgressTracker struct {
	mu      sync.Mutex
	records map[TaskID]*progressRecord
}

// NewTracker creates a progress tracker
func NewTracker() *ProgressTracker {
	return &ProgressTracker{
		records: make(map[TaskID]*progressRecord),
	}
}

// ShouldUpdate determines whether a progress update should be reported.
// Strategy: 200ms throttle
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

// Update records a progress update
func (pt *ProgressTracker) Update(id TaskID) {
	pt.mu.Lock()
	defer pt.mu.Unlock()

	if _, exists := pt.records[id]; !exists {
		pt.records[id] = &progressRecord{}
	}
	pt.records[id].lastUpdate = time.Now()
}

// Remove removes the progress record for a task
func (pt *ProgressTracker) Remove(id TaskID) {
	pt.mu.Lock()
	defer pt.mu.Unlock()
	delete(pt.records, id)
}
