// Package runner contains the command execution and output reading implementation
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

// ExecRunner is a command executor based on exec.CommandContext
type ExecRunner struct{}

// NewExecRunner creates a new command executor instance
func NewExecRunner() *ExecRunner {
	return &ExecRunner{}
}

// Run executes a command and reads stdout/stderr line by line
// ctx: context for cancellation support
// binPath: path to the executable
// args: command-line arguments
// onStdLine: per-line callback (all output is normalized to UTF-8)
func (r *ExecRunner) Run(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// use context for cancellation support
	cmd := exec.CommandContext(ctx, binPath, args...)

	// obtain stdout and stderr pipes
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return err
	}

	// start the process
	if err := cmd.Start(); err != nil {
		return err
	}

	// read pipe lines and normalize to UTF-8
	readPipe := func(scanner *bufio.Scanner) {
		for scanner.Scan() {
			b := scanner.Bytes()
			line := decodeToUTF8(b)
			if onStdLine != nil {
				onStdLine(line)
			}
		}
	}

	// concurrently read stdout and stderr
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

	// wait for reading to complete
	<-done
	<-done

	// wait for the process to exit
	return cmd.Wait()
}

// decodeToUTF8 attempts to decode a byte slice of unknown encoding to a UTF-8 string
func decodeToUTF8(b []byte) string {
	if len(b) == 0 {
		return ""
	}
	if utf8.Valid(b) {
		return string(b)
	}
	// try GB18030 first, then GBK
	if s, ok := tryDecode(simplifiedchinese.GB18030.NewDecoder(), b); ok {
		return s
	}
	if s, ok := tryDecode(simplifiedchinese.GBK.NewDecoder(), b); ok {
		return s
	}
	// fallback: convert as-is
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
