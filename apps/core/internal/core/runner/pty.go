// Package runner contains the PTY-based command executor (supports progress bars)
package runner

import (
	"context"
	"io"
)

// PTYRunner is a command executor based on a pseudo-terminal
// It supports capturing output that requires terminal interaction, such as progress bars
type PTYRunner struct{}

// NewPTYRunner creates a new PTY command executor instance
func NewPTYRunner() *PTYRunner {
	return &PTYRunner{}
}

// Run executes a command and reads output via a pseudo-terminal
// This method correctly captures progress bars that use control characters like \r and \b
// Platform-specific implementations are in pty_windows.go and pty_unix.go
func (r *PTYRunner) Run(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	return r.runWithPTY(ctx, binPath, args, onStdLine)
}

// The concrete implementation of runWithPTY is in the platform-specific files:
// - pty_windows.go: Windows ConPTY implementation
// - pty_unix.go: Unix/Linux/Mac PTY implementation

// readPTYOutput reads PTY output and passes raw bytes in chunks
// Raw PTY output (including ANSI escape sequences) is passed directly and handled by the frontend terminal renderer
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

// fallbackToPipe is the fallback strategy when PTY fails
func (r *PTYRunner) fallbackToPipe(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// use the existing ExecRunner as the fallback
	runner := NewExecRunner()
	return runner.Run(ctx, binPath, args, onStdLine)
}
