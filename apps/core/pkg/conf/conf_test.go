package conf

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type testConfig struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
	Debug bool   `json:"debug"`
}

func tempDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	return dir
}

func TestNew_CreatesFileWithDefaults(t *testing.T) {
	dir := tempDir(t)
	defaults := testConfig{Name: "test", Count: 5, Debug: true}

	c, err := New(Options[testConfig]{
		CWD:      dir,
		Defaults: defaults,
	})
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	// File should exist
	if _, err := os.Stat(c.Path()); err != nil {
		t.Fatalf("config file not created: %v", err)
	}

	// Store should match defaults
	store := c.Store()
	if store.Name != "test" || store.Count != 5 || !store.Debug {
		t.Errorf("Store() = %+v, want %+v", store, defaults)
	}
}

func TestNew_ReadsExistingFile(t *testing.T) {
	dir := tempDir(t)

	// Write a pre-existing config file
	existing := map[string]any{"name": "existing", "count": 99.0, "debug": false}
	data, _ := json.Marshal(existing)
	os.WriteFile(filepath.Join(dir, "config.json"), data, 0o644)

	c, err := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "default", Count: 1, Debug: true},
	})
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	store := c.Store()
	if store.Name != "existing" {
		t.Errorf("Name = %q, want %q", store.Name, "existing")
	}
	if store.Count != 99 {
		t.Errorf("Count = %d, want 99", store.Count)
	}
}

func TestNew_MergesDefaultsWithExisting(t *testing.T) {
	dir := tempDir(t)

	// File only has "name"
	data, _ := json.Marshal(map[string]any{"name": "partial"})
	os.WriteFile(filepath.Join(dir, "config.json"), data, 0o644)

	c, err := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "default", Count: 10, Debug: true},
	})
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	store := c.Store()
	if store.Name != "partial" {
		t.Errorf("Name = %q, want %q (from file)", store.Name, "partial")
	}
	if store.Count != 10 {
		t.Errorf("Count = %d, want 10 (from defaults)", store.Count)
	}
	if !store.Debug {
		t.Error("Debug = false, want true (from defaults)")
	}
}

func TestGetSet(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "hello"},
	})

	if v := c.Get("name"); v != "hello" {
		t.Errorf("Get(name) = %v, want hello", v)
	}

	if err := c.Set("name", "world"); err != nil {
		t.Fatalf("Set: %v", err)
	}

	if v := c.Get("name"); v != "world" {
		t.Errorf("Get(name) = %v, want world", v)
	}

	// Verify persisted to disk
	fileData, _ := os.ReadFile(c.Path())
	var m map[string]any
	json.Unmarshal(fileData, &m)
	if m["name"] != "world" {
		t.Errorf("persisted name = %v, want world", m["name"])
	}
}

func TestSetStore(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "old", Count: 1},
	})

	newStore := testConfig{Name: "new", Count: 42, Debug: true}
	if err := c.SetStore(newStore); err != nil {
		t.Fatalf("SetStore: %v", err)
	}

	store := c.Store()
	if store.Name != "new" || store.Count != 42 || !store.Debug {
		t.Errorf("Store() = %+v, want %+v", store, newStore)
	}
}

func TestUpdate(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "original", Count: 1, Debug: false},
	})

	if err := c.Update(map[string]any{"name": "updated", "debug": true}); err != nil {
		t.Fatalf("Update: %v", err)
	}

	store := c.Store()
	if store.Name != "updated" {
		t.Errorf("Name = %q, want updated", store.Name)
	}
	if store.Count != 1 {
		t.Errorf("Count = %d, want 1 (unchanged)", store.Count)
	}
	if !store.Debug {
		t.Error("Debug = false, want true")
	}
}

func TestDelete(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "hello", Count: 5},
	})

	if err := c.Delete("name"); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	if v := c.Get("name"); v != nil {
		t.Errorf("Get(name) after Delete = %v, want nil", v)
	}

	// Count should be untouched
	store := c.Store()
	if store.Count != 5 {
		t.Errorf("Count = %d, want 5", store.Count)
	}
}

func TestOnDidChange(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "before"},
	})

	var gotNew, gotOld any
	c.OnDidChange("name", func(newVal, oldVal any) {
		gotNew = newVal
		gotOld = oldVal
	})

	c.Set("name", "after")

	if gotOld != "before" {
		t.Errorf("oldVal = %v, want before", gotOld)
	}
	if gotNew != "after" {
		t.Errorf("newVal = %v, want after", gotNew)
	}
}

func TestOnDidChange_Unsubscribe(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "a"},
	})

	called := 0
	unsub := c.OnDidChange("name", func(newVal, oldVal any) {
		called++
	})

	c.Set("name", "b")
	if called != 1 {
		t.Errorf("called = %d, want 1", called)
	}

	unsub()
	c.Set("name", "c")
	if called != 1 {
		t.Errorf("called = %d after unsub, want 1", called)
	}
}

func TestDotNotation(t *testing.T) {
	type nested struct {
		Outer struct {
			Inner string `json:"inner"`
		} `json:"outer"`
	}

	dir := tempDir(t)
	c, _ := New(Options[nested]{
		CWD: dir,
		Defaults: nested{
			Outer: struct {
				Inner string `json:"inner"`
			}{Inner: "deep"},
		},
	})

	if v := c.Get("outer.inner"); v != "deep" {
		t.Errorf("Get(outer.inner) = %v, want deep", v)
	}

	c.Set("outer.inner", "deeper")
	if v := c.Get("outer.inner"); v != "deeper" {
		t.Errorf("after Set, Get(outer.inner) = %v, want deeper", v)
	}
}

func TestReload(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "original"},
	})

	// Externally modify the file
	newData, _ := json.Marshal(map[string]any{"name": "external", "count": 77, "debug": true})
	os.WriteFile(c.Path(), newData, 0o644)

	if err := c.Reload(); err != nil {
		t.Fatalf("Reload: %v", err)
	}

	store := c.Store()
	if store.Name != "external" {
		t.Errorf("Name = %q, want external", store.Name)
	}
	if store.Count != 77 {
		t.Errorf("Count = %d, want 77", store.Count)
	}
}

func TestCustomFileName(t *testing.T) {
	dir := tempDir(t)
	c, err := New(Options[testConfig]{
		CWD:           dir,
		ConfigName:    "settings",
		FileExtension: "json",
		Defaults:      testConfig{Name: "custom"},
	})
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	expected := filepath.Join(dir, "settings.json")
	if c.Path() != expected {
		t.Errorf("Path() = %q, want %q", c.Path(), expected)
	}
}

func TestAtomicWrite(t *testing.T) {
	dir := tempDir(t)
	c, _ := New(Options[testConfig]{
		CWD:      dir,
		Defaults: testConfig{Name: "atomic"},
	})

	// After write, no .tmp file should remain
	c.Set("name", "updated")

	tmpPath := c.Path() + ".tmp"
	if _, err := os.Stat(tmpPath); err == nil {
		t.Error("temp file still exists after write")
	}
}
