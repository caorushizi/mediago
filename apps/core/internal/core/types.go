// Package core contains the core type definitions for the download system
package core

import "context"

// DownloadType is the download type enum
type DownloadType string

const (
	TypeM3U8     DownloadType = "m3u8"
	TypeBilibili DownloadType = "bilibili"
	TypeDirect   DownloadType = "direct"
)

// TaskID is the unique identifier for a task
type TaskID string

// TaskStatus is the task status enum
type TaskStatus string

const (
	StatusPending     TaskStatus = "pending"     // waiting
	StatusDownloading TaskStatus = "downloading" // downloading
	StatusSuccess     TaskStatus = "success"     // completed successfully
	StatusFailed      TaskStatus = "failed"      // failed
	StatusStopped     TaskStatus = "stopped"     // stopped
)

// DownloadParams holds the parameters for a download task
type DownloadParams struct {
	ID      TaskID       `json:"id"`      // task ID
	Type    DownloadType `json:"type"`    // download type
	URL     string       `json:"url"`     // download URL
	Name    string       `json:"name"`    // file name
	Folder  string       `json:"folder"`  // subdirectory
	Headers []string     `json:"headers"` // HTTP request headers
}

// ProgressEvent is a progress update event
type ProgressEvent struct {
	ID      TaskID  `json:"id"`      // task ID
	Type    string  `json:"type"`    // event type: "ready" | "progress"
	Percent float64 `json:"percent"` // completion percentage
	Speed   string  `json:"speed"`   // download speed
	IsLive  bool    `json:"isLive"`  // whether this is a live stream
}

// MessageEvent is a message event (console output)
type MessageEvent struct {
	ID      TaskID `json:"id"`      // task ID
	Message string `json:"message"` // message content
}

// TaskInfo holds information about a task
type TaskInfo struct {
	ID      TaskID       `json:"id"`              // task ID
	Type    DownloadType `json:"type"`            // download type
	URL     string       `json:"url"`             // download URL
	Name    string       `json:"name"`            // file name
	Status  TaskStatus   `json:"status"`          // task status
	Percent float64      `json:"percent"`         // completion percentage
	Speed   string       `json:"speed"`           // download speed
	IsLive  bool         `json:"isLive"`          // whether this is a live stream
	Error   string       `json:"error,omitempty"` // error message (if any)
}

// Callbacks is a collection of download callback functions
type Callbacks struct {
	OnProgress func(ProgressEvent) // progress update callback
	OnMessage  func(MessageEvent)  // message output callback
}

// Runner is the interface for a command executor
type Runner interface {
	// Run executes a command and processes stdout/stderr line by line
	Run(ctx context.Context, binPath string, args []string, onStdLine func(line string)) error
}

// Downloader is the interface for a downloader
type Downloader interface {
	Download(ctx context.Context, p DownloadParams, cb Callbacks) error
	Config() interface{}
}
