// Package runner PTY-based 命令执行器(支持进度条)
package runner

import (
	"bufio"
	"context"
	"io"
	"time"
)

// PTYRunner 基于伪终端的命令执行器
// 支持捕获进度条等需要终端交互的输出
type PTYRunner struct {
	// 输出刷新间隔(用于进度条更新)
	flushInterval time.Duration
}

// NewPTYRunner 创建 PTY 命令执行器实例
func NewPTYRunner() *PTYRunner {
	return &PTYRunner{
		flushInterval: 100 * time.Millisecond, // 默认100ms刷新一次
	}
}

// NewPTYRunnerWithInterval 创建带自定义刷新间隔的 PTY 执行器
func NewPTYRunnerWithInterval(interval time.Duration) *PTYRunner {
	return &PTYRunner{
		flushInterval: interval,
	}
}

// Run 执行命令并通过伪终端读取输出
// 这个方法能够正确捕获使用 \r、\b 等控制符的进度条
// 平台特定的实现在 pty_windows.go 和 pty_unix.go 中
func (r *PTYRunner) Run(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	return r.runWithPTY(ctx, binPath, args, onStdLine)
}

// runWithPTY 的具体实现在平台特定的文件中:
// - pty_windows.go: Windows ConPTY 实现
// - pty_unix.go: Unix/Linux/Mac PTY 实现

// readPTYOutput 读取 PTY 输出并按行处理
// 使用定时刷新机制捕获进度条更新
func (r *PTYRunner) readPTYOutput(reader io.Reader, onStdLine func(string)) error {
	scanner := bufio.NewScanner(reader)

	// 自定义分割函数: 同时支持 \n 和 \r 作为行分隔符
	scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		onStdLine(string(data))

		return bufio.ScanLines(data, atEOF)
	})

	for scanner.Scan() {
	}

	return scanner.Err()
}

// fallbackToPipe PTY 失败时的降级方案
func (r *PTYRunner) fallbackToPipe(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// 使用原有的 ExecRunner 作为降级方案
	runner := NewExecRunner()
	return runner.Run(ctx, binPath, args, onStdLine)
}
