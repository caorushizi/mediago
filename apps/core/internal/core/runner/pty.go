// Package runner PTY-based 命令执行器(支持进度条)
package runner

import (
	"context"
	"io"
)

// PTYRunner 基于伪终端的命令执行器
// 支持捕获进度条等需要终端交互的输出
type PTYRunner struct{}

// NewPTYRunner 创建 PTY 命令执行器实例
func NewPTYRunner() *PTYRunner {
	return &PTYRunner{}
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

// readPTYOutput 读取 PTY 输出并按块传递原始字节
// 直接传递原始 PTY 输出（包含 ANSI 转义序列），由前端终端渲染器处理
func (r *PTYRunner) readPTYOutput(reader io.Reader, onStdLine func(string)) error {
	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 && onStdLine != nil {
			onStdLine(string(buf[:n]))
		}
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
	}
}

// fallbackToPipe PTY 失败时的降级方案
func (r *PTYRunner) fallbackToPipe(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// 使用原有的 ExecRunner 作为降级方案
	runner := NewExecRunner()
	return runner.Run(ctx, binPath, args, onStdLine)
}
