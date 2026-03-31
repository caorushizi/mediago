//go:build windows
// +build windows

package runner

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/UserExistsError/conpty"
)

// runWithPTY Windows 平台使用 ConPTY 实现
func (r *PTYRunner) runWithPTY(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// 检查 ConPTY 是否可用 (需要 Windows 10 1809+)
	if !conpty.IsConPtyAvailable() {
		// ConPTY 不可用,降级到普通管道
		return r.fallbackToPipe(ctx, binPath, args, onStdLine)
	}

	// 构建命令行字符串
	// 需要对包含空格的参数进行引号转义
	cmdLine := buildCommandLine(binPath, args)

	// 创建 ConPTY (80 列 × 24 行)
	cpty, err := conpty.Start(cmdLine, conpty.ConPtyDimensions(80, 24))
	if err != nil {
		// ConPTY 创建失败,降级到普通管道
		return r.fallbackToPipe(ctx, binPath, args, onStdLine)
	}

	// 使用 defer 确保 ConPTY 总是被关闭
	var closeOnce sync.Once
	closeConPty := func() {
		closeOnce.Do(func() {
			cpty.Close()
		})
	}
	defer closeConPty()

	// 读取输出 (ConPty 自身实现了 io.Reader)
	readDone := make(chan error, 1)
	go func() {
		readDone <- r.readPTYOutput(cpty, onStdLine)
	}()

	// 创建一个独立的上下文用于 Wait,避免影响主进程
	waitCtx, waitCancel := context.WithCancel(context.Background())
	defer waitCancel()

	// 等待进程完成
	waitDone := make(chan error, 1)
	go func() {
		exitCode, err := cpty.Wait(waitCtx)
		if err != nil {
			waitDone <- err
		} else if exitCode != 0 {
			waitDone <- fmt.Errorf("process exited with code %d", exitCode)
		} else {
			waitDone <- nil
		}
	}()

	// 等待完成或取消
	var finalErr error
	select {
	case <-ctx.Done():
		// 上下文取消
		waitCancel()  // 取消 Wait
		closeConPty() // 关闭 ConPTY (会终止子进程)
		<-readDone    // 等待读取完成
		finalErr = ctx.Err()

	case err := <-waitDone:
		// 进程完成
		closeConPty() // 关闭 ConPTY
		<-readDone    // 等待读取完成
		finalErr = err
	}

	return finalErr
}

// buildCommandLine 构建 Windows 命令行字符串
// 处理包含空格和特殊字符的参数
func buildCommandLine(binPath string, args []string) string {
	parts := make([]string, 0, len(args)+1)

	// 添加可执行文件路径
	if strings.Contains(binPath, " ") {
		parts = append(parts, fmt.Sprintf(`"%s"`, binPath))
	} else {
		parts = append(parts, binPath)
	}

	// 添加参数
	for _, arg := range args {
		if strings.Contains(arg, " ") || strings.Contains(arg, "\t") {
			// 包含空格或制表符,需要引号
			parts = append(parts, fmt.Sprintf(`"%s"`, strings.ReplaceAll(arg, `"`, `\"`)))
		} else {
			parts = append(parts, arg)
		}
	}

	return strings.Join(parts, " ")
}
