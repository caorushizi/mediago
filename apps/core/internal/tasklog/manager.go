package tasklog

import (
	"errors"
	"os"
	"regexp"
	"sync"
)

var taskIDPattern = regexp.MustCompile("^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$")
var ErrTaskID = errors.New("invalid task ID")

// ValidTaskID accepts one portable filename component, never a path.
func ValidTaskID(id string) bool { return taskIDPattern.MatchString(id) }

// Manager handles per-task log persistence.
type Manager struct {
	baseDir string
	mu      sync.Mutex
}

func NewManager(baseDir string) *Manager { return &Manager{baseDir: baseDir} }

func (m *Manager) open(taskID string, create bool) (*os.Root, error) {
	if m == nil {
		return nil, errors.New("task log manager is nil")
	}
	if !ValidTaskID(taskID) {
		return nil, ErrTaskID
	}
	if create {
		if err := os.MkdirAll(m.baseDir, 0755); err != nil {
			return nil, err
		}
	}
	return os.OpenRoot(m.baseDir)
}

// Append writes a line within the log root, including when a symlink is present.
func (m *Manager) Append(taskID, line string) error {
	if m == nil {
		return errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	root, err := m.open(taskID, true)
	if err != nil {
		return err
	}
	defer root.Close()
	file, err := root.OpenFile(taskID+".log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.WriteString(line + "\n")
	return err
}

// Reset removes only a log entry beneath the root.
func (m *Manager) Reset(taskID string) error {
	if m == nil {
		return errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	root, err := m.open(taskID, true)
	if err != nil {
		return err
	}
	defer root.Close()
	err = root.Remove(taskID + ".log")
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

func (m *Manager) Read(taskID string) (string, error) {
	if m == nil {
		return "", errors.New("task log manager is nil")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	root, err := m.open(taskID, false)
	if err != nil {
		return "", err
	}
	defer root.Close()
	data, err := root.ReadFile(taskID + ".log")
	return string(data), err
}
