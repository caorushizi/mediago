// Package runner 命令执行与输出读取实现
package runner

import (
	"bufio"
	"bytes"
	"context"
	"io"
	"os/exec"
	"unicode/utf8"

	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

// ExecRunner 基于 exec.CommandContext 的命令执行器
type ExecRunner struct{}

// NewExecRunner 创建命令执行器实例
func NewExecRunner() *ExecRunner {
	return &ExecRunner{}
}

// Run 执行命令并逐行读取标准输出/标准错误
// ctx: 上下文控制（支持取消）
// binPath: 可执行文件路径
// args: 命令行参数
// onStdLine: 每行回调（统一转为 UTF-8）
func (r *ExecRunner) Run(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// 使用 context 支持取消
	cmd := exec.CommandContext(ctx, binPath, args...)

	// 获取标准输出和标准错误管道
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	// 启动进程
	if err := cmd.Start(); err != nil {
		return err
	}

	// 读取管道行并统一转为 UTF-8
	readPipe := func(scanner *bufio.Scanner) {
		for scanner.Scan() {
			b := scanner.Bytes()
			line := decodeToUTF8(b)
			if onStdLine != nil {
				onStdLine(line)
			}
		}
	}

	// 并发读取 stdout 和 stderr
	stdoutScanner := bufio.NewScanner(stdout)
	stderrScanner := bufio.NewScanner(stderr)

	done := make(chan struct{}, 2)

	go func() {
		readPipe(stdoutScanner)
		done <- struct{}{}
	}()

	go func() {
		readPipe(stderrScanner)
		done <- struct{}{}
	}()

	// 等待读取完成
	<-done
	<-done

	// 等待进程结束
	return cmd.Wait()
}

// decodeToUTF8 尝试将未知编码的字节切片解码为 UTF-8 字符串
func decodeToUTF8(b []byte) string {
	if len(b) == 0 {
		return ""
	}
	if utf8.Valid(b) {
		return string(b)
	}
	// 优先尝试 GB18030，其次 GBK
	if s, ok := tryDecode(simplifiedchinese.GB18030.NewDecoder(), b); ok {
		return s
	}
	if s, ok := tryDecode(simplifiedchinese.GBK.NewDecoder(), b); ok {
		return s
	}
	// 回退：原样转换
	return string(b)
}

func tryDecode(dec *encoding.Decoder, b []byte) (string, bool) {
	r := transform.NewReader(bytes.NewReader(b), dec)
	out, err := io.ReadAll(r)
	if err != nil {
		return "", false
	}
	if utf8.Valid(out) {
		return string(out), true
	}
	return string(out), true
}
