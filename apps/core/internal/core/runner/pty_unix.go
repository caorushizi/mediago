//go:build !windows
// +build !windows

package runner

import (
	"context"
	"os/exec"

	"github.com/creack/pty"
)

// runWithPTY Unix 平台(Linux/Mac)使用 creack/pty 实现
func (r *PTYRunner) runWithPTY(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// 创建命令
	cmd := exec.CommandContext(ctx, binPath, args...)

	// 启动 PTY
	ptmx, err := pty.Start(cmd)
	if err != nil {
		// PTY 失败,降级到普通管道
		return r.fallbackToPipe(ctx, binPath, args, onStdLine)
	}
	defer ptmx.Close()

	// 设置 PTY 大小
	_ = pty.Setsize(ptmx, &pty.Winsize{
		Rows: 24,
		Cols: 80,
	})

	// 读取输出
	done := make(chan error, 1)
	go func() {
		done <- r.readPTYOutput(ptmx, onStdLine)
	}()

	// 等待进程完成
	cmdDone := make(chan error, 1)
	go func() {
		cmdDone <- cmd.Wait()
	}()

	select {
	case <-ctx.Done():
		ptmx.Close()
		return ctx.Err()
	case err := <-cmdDone:
		ptmx.Close()
		<-done
		return err
	}
}
