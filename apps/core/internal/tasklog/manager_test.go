package tasklog

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestManagerRoundTripAndInvalidIDs(t *testing.T) {
	manager := NewManager(t.TempDir())
	for _, id := range []string{"task-1", "42", "a_b.c", "cfb4e7e9-8894-4504-8b08-e6f883645321"} {
		if err := manager.Append(id, "line"); err != nil {
			t.Fatal(err)
		}
		value, err := manager.Read(id)
		if err != nil || value != "line\n" {
			t.Fatalf("Read(%q)=%q,%v", id, value, err)
		}
		if err := manager.Reset(id); err != nil {
			t.Fatal(err)
		}
		if _, err := manager.Read(id); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("Read deleted=%v", err)
		}
	}
	for _, id := range []string{"", "..", "../outside", "a/../../outside", `..\outside`, "C:outside", "/absolute", "bad\x00id", strings.Repeat("a", 129)} {
		if err := manager.Append(id, "line"); !errors.Is(err, ErrTaskID) {
			t.Fatalf("Append accepted %q: %v", id, err)
		}
		if _, err := manager.Read(id); !errors.Is(err, ErrTaskID) {
			t.Fatalf("Read accepted %q: %v", id, err)
		}
		if err := manager.Reset(id); !errors.Is(err, ErrTaskID) {
			t.Fatalf("Reset accepted %q: %v", id, err)
		}
	}
}

func TestManagerRejectsEscapingSymlink(t *testing.T) {
	logs := t.TempDir()
	outside := filepath.Join(t.TempDir(), "outside.log")
	if err := os.WriteFile(outside, []byte("outside"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(logs, "task.log")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	manager := NewManager(logs)
	if _, err := manager.Read("task"); err == nil {
		t.Fatal("read escaped log root")
	}
	if err := manager.Append("task", "changed"); err == nil {
		t.Fatal("write escaped log root")
	}
	if err := manager.Reset("task"); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(outside)
	if err != nil || string(data) != "outside" {
		t.Fatalf("outside modified: %q,%v", data, err)
	}
}
