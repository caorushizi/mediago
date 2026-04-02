//go:build !windows
// +build !windows

package runner

import (
	"context"
	"os/exec"

	"github.com/creack/pty"
)

// runWithPTY uses creack/pty on Unix platforms (Linux/Mac)
func (r *PTYRunner) runWithPTY(ctx context.Context, binPath string, args []string, onStdLine func(string)) error {
	// create the command
	cmd := exec.CommandContext(ctx, binPath, args...)

	// start the PTY
	ptmx, err := pty.Start(cmd)
	if err != nil {
		// PTY failed, fall back to regular pipe
		return r.fallbackToPipe(ctx, binPath, args, onStdLine)
	}
	defer ptmx.Close()

	// set PTY window size
	_ = pty.Setsize(ptmx, &pty.Winsize{
		Rows: 24,
		Cols: 80,
	})

	// read output
	done := make(chan error, 1)
	go func() {
		done <- r.readPTYOutput(ptmx, onStdLine)
	}()

	// wait for the process to complete
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
