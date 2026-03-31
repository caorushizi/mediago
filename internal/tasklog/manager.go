package tasklog

import (
	"errors"
	"os"
	"path/filepath"
	"sync"
)

// Manager handles per-task log persistence.
type Manager struct {
	baseDir string
	mu      sync.Mutex
}

// NewManager creates a new Manager with the given base directory.
func NewManager(baseDir string) *Manager {
	return &Manager{baseDir: baseDir}
}

// Append writes a log line for the specified task, ensuring the log file exists.
func (m *Manager) Append(taskID string, line string) error {
	if m == nil {
		return errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.ensureDir(); err != nil {
		return err
	}

	f, err := os.OpenFile(m.logPath(taskID), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.WriteString(line + "\n"); err != nil {
		return err
	}
	return nil
}

// Reset removes any existing log file for the given task ID.
func (m *Manager) Reset(taskID string) error {
	if m == nil {
		return errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.ensureDir(); err != nil {
		return err
	}

	if err := os.Remove(m.logPath(taskID)); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

// Read returns the full log content for the given task ID.
func (m *Manager) Read(taskID string) (string, error) {
	if m == nil {
		return "", errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()

	data, err := os.ReadFile(m.logPath(taskID))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (m *Manager) logPath(taskID string) string {
	filename := taskID + ".log"
	return filepath.Join(m.baseDir, filename)
}

func (m *Manager) ensureDir() error {
	return os.MkdirAll(m.baseDir, 0755)
}
