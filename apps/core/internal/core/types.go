// Package core 包含下载系统的核心类型定义
package core

import "context"

// DownloadType 下载类型枚举
type DownloadType string

const (
	TypeM3U8     DownloadType = "m3u8"
	TypeBilibili DownloadType = "bilibili"
	TypeDirect   DownloadType = "direct"
)

// TaskID 任务唯一标识符
type TaskID string

// TaskStatus 任务状态枚举
type TaskStatus string

const (
	StatusPending     TaskStatus = "pending"     // 等待中
	StatusDownloading TaskStatus = "downloading" // 下载中
	StatusSuccess     TaskStatus = "success"     // 成功完成
	StatusFailed      TaskStatus = "failed"      // 失败
	StatusStopped     TaskStatus = "stopped"     // 已停止
)

// DownloadParams 下载任务参数
type DownloadParams struct {
	ID      TaskID          `json:"id"`             // 任务 ID
	Type    DownloadType    `json:"type"`           // 下载类型
	URL     string          `json:"url"`            // 下载 URL
	Name    string          `json:"name"`           // 文件名
	Folder  string          `json:"folder"`         // 子文件夹
	Headers []string        `json:"headers"`        // HTTP 请求头
}

// ProgressEvent 进度事件
type ProgressEvent struct {
	ID      TaskID  `json:"id"`      // 任务ID
	Type    string  `json:"type"`    // 事件类型: "ready" | "progress"
	Percent float64 `json:"percent"` // 完成百分比
	Speed   string  `json:"speed"`   // 下载速度
	IsLive  bool    `json:"isLive"`  // 是否为直播流
}

// MessageEvent 消息事件（控制台输出）
type MessageEvent struct {
	ID      TaskID `json:"id"`      // 任务ID
	Message string `json:"message"` // 消息内容
}

// TaskInfo 任务信息
type TaskInfo struct {
	ID      TaskID       `json:"id"`              // 任务ID
	Type    DownloadType `json:"type"`            // 下载类型
	URL     string       `json:"url"`             // 下载URL
	Name    string       `json:"name"`            // 文件名
	Status  TaskStatus   `json:"status"`          // 任务状态
	Percent float64      `json:"percent"`         // 完成百分比
	Speed   string       `json:"speed"`           // 下载速度
	IsLive  bool         `json:"isLive"`          // 是否为直播流
	Error   string       `json:"error,omitempty"` // 错误信息（如果有）
}

// Callbacks 下载回调函数集合
type Callbacks struct {
	OnProgress func(ProgressEvent) // 进度更新回调
	OnMessage  func(MessageEvent)  // 消息输出回调
}

// Runner 命令执行器接口
type Runner interface {
	// Run 执行命令并逐行处理标准输出/错误输出
	Run(ctx context.Context, binPath string, args []string, onStdLine func(line string)) error
}

// Downloader 下载器接口
type Downloader interface {
	Download(ctx context.Context, p DownloadParams, cb Callbacks) error
	Config() interface{}
}
