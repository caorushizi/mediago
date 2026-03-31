// Package conf provides a typed, file-backed configuration store inspired by
// sindresorhus/conf. It persists configuration as a JSON file with atomic
// writes and supports dot-notation access, default values, and change listeners.
package conf

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// changeListener holds a callback for a specific key.
type changeListener struct {
	id  uint64
	key string
	fn  func(newVal, oldVal any)
}

// Conf is a typed, file-backed configuration store.
type Conf[T any] struct {
	mu        sync.RWMutex
	path      string
	defaults  T
	data      map[string]any
	listeners []changeListener
	nextID    uint64
}

// New creates a new Conf instance. It reads the config file if it exists,
// or initializes from defaults.
func New[T any](opts Options[T]) (*Conf[T], error) {
	opts.applyDefaults()

	cwd := opts.CWD
	if cwd == "" {
		var err error
		cwd, err = os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("conf: get working directory: %w", err)
		}
	}

	filePath := filepath.Join(cwd, opts.ConfigName+"."+opts.FileExtension)

	c := &Conf[T]{
		path:     filePath,
		defaults: opts.Defaults,
	}

	// Convert defaults to map[string]any
	defaultsMap, err := structToMap(opts.Defaults)
	if err != nil {
		return nil, fmt.Errorf("conf: marshal defaults: %w", err)
	}

	// Try to read existing file
	if fileData, readErr := os.ReadFile(filePath); readErr == nil {
		fileMap := make(map[string]any)
		if jsonErr := json.Unmarshal(fileData, &fileMap); jsonErr == nil {
			// Merge defaults under file data (file wins)
			c.data = mergeMaps(defaultsMap, fileMap)
			return c, nil
		}
	}

	// No existing file or invalid JSON — use defaults
	c.data = defaultsMap

	// Write initial config
	if err := c.write(); err != nil {
		return nil, fmt.Errorf("conf: write initial config: %w", err)
	}

	return c, nil
}

// Get retrieves a value using dot-notation (e.g. "foo.bar").
func (c *Conf[T]) Get(key string) any {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return dotGet(c.data, key)
}

// Set sets a value using dot-notation and persists to disk.
// Change listeners are notified if the value changed.
func (c *Conf[T]) Set(key string, value any) error {
	c.mu.Lock()

	oldVal := dotGet(c.data, key)
	dotSet(c.data, key, value)

	if err := c.write(); err != nil {
		c.mu.Unlock()
		return err
	}

	// Collect matching listeners while holding the lock
	listeners := c.matchListeners(key)
	c.mu.Unlock()

	// Fire listeners outside the lock
	for _, l := range listeners {
		l.fn(value, oldVal)
	}

	return nil
}

// Delete removes a key using dot-notation and persists to disk.
func (c *Conf[T]) Delete(key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	dotDelete(c.data, key)
	return c.write()
}

// Store returns the entire configuration as the typed struct T.
func (c *Conf[T]) Store() T {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var result T
	data, _ := json.Marshal(c.data)
	json.Unmarshal(data, &result)
	return result
}

// SetStore replaces the entire configuration and persists to disk.
func (c *Conf[T]) SetStore(store T) error {
	newMap, err := structToMap(store)
	if err != nil {
		return fmt.Errorf("conf: marshal store: %w", err)
	}

	c.mu.Lock()
	oldData := c.data
	c.data = newMap

	if err := c.write(); err != nil {
		c.mu.Unlock()
		return err
	}

	// Collect all listeners and their old/new values
	type lc struct {
		fn     func(newVal, oldVal any)
		newVal any
		oldVal any
	}
	var calls []lc
	for _, l := range c.listeners {
		oldV := dotGet(oldData, l.key)
		newV := dotGet(newMap, l.key)
		calls = append(calls, lc{fn: l.fn, newVal: newV, oldVal: oldV})
	}
	c.mu.Unlock()

	for _, call := range calls {
		call.fn(call.newVal, call.oldVal)
	}

	return nil
}

// Update merges partial updates into the configuration.
// Only the provided keys are updated; others remain unchanged.
func (c *Conf[T]) Update(partial map[string]any) error {
	c.mu.Lock()

	// Track old values for listeners
	type lc struct {
		fn     func(newVal, oldVal any)
		newVal any
		oldVal any
	}
	var calls []lc

	for key, value := range partial {
		oldVal := dotGet(c.data, key)
		dotSet(c.data, key, value)

		for _, l := range c.listeners {
			if l.key == key {
				calls = append(calls, lc{fn: l.fn, newVal: value, oldVal: oldVal})
			}
		}
	}

	if err := c.write(); err != nil {
		c.mu.Unlock()
		return err
	}
	c.mu.Unlock()

	for _, call := range calls {
		call.fn(call.newVal, call.oldVal)
	}

	return nil
}

// OnDidChange registers a listener that fires when the given key changes.
// Returns an unsubscribe function.
func (c *Conf[T]) OnDidChange(key string, fn func(newVal, oldVal any)) func() {
	c.mu.Lock()
	defer c.mu.Unlock()

	id := c.nextID
	c.nextID++
	c.listeners = append(c.listeners, changeListener{id: id, key: key, fn: fn})

	return func() {
		c.mu.Lock()
		defer c.mu.Unlock()
		for i, existing := range c.listeners {
			if existing.id == id {
				c.listeners = append(c.listeners[:i], c.listeners[i+1:]...)
				return
			}
		}
	}
}

// Path returns the path to the config file.
func (c *Conf[T]) Path() string {
	return c.path
}

// Reload re-reads the config file from disk and fires OnDidChange listeners
// for any keys whose values differ from the in-memory state.
func (c *Conf[T]) Reload() error {
	fileData, err := os.ReadFile(c.path)
	if err != nil {
		return fmt.Errorf("conf: read file: %w", err)
	}

	fileMap := make(map[string]any)
	if err := json.Unmarshal(fileData, &fileMap); err != nil {
		return fmt.Errorf("conf: unmarshal: %w", err)
	}

	c.mu.Lock()
	oldData := c.data
	c.data = fileMap

	// Collect listeners with changed values
	type lc struct {
		fn     func(newVal, oldVal any)
		newVal any
		oldVal any
	}
	var calls []lc
	for _, l := range c.listeners {
		oldV := dotGet(oldData, l.key)
		newV := dotGet(fileMap, l.key)
		if !jsonEqual(oldV, newV) {
			calls = append(calls, lc{fn: l.fn, newVal: newV, oldVal: oldV})
		}
	}
	c.mu.Unlock()

	for _, call := range calls {
		call.fn(call.newVal, call.oldVal)
	}

	return nil
}

// write persists the current data to disk atomically.
// Must be called with c.mu held.
func (c *Conf[T]) write() error {
	data, err := json.MarshalIndent(c.data, "", "  ")
	if err != nil {
		return fmt.Errorf("conf: marshal: %w", err)
	}

	dir := filepath.Dir(c.path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("conf: create directory: %w", err)
	}

	// Atomic write: write to temp file, then rename
	tmp := c.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return fmt.Errorf("conf: write temp file: %w", err)
	}
	if err := os.Rename(tmp, c.path); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("conf: rename: %w", err)
	}

	return nil
}

// matchListeners returns listeners whose key matches. Must be called with c.mu held.
func (c *Conf[T]) matchListeners(key string) []changeListener {
	var matched []changeListener
	for _, l := range c.listeners {
		if l.key == key {
			matched = append(matched, l)
		}
	}
	return matched
}

// jsonEqual compares two values by their JSON representation.
func jsonEqual(a, b any) bool {
	aj, _ := json.Marshal(a)
	bj, _ := json.Marshal(b)
	return string(aj) == string(bj)
}

// structToMap converts a struct to map[string]any via JSON round-trip.
func structToMap(v any) (map[string]any, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	return m, nil
}

// mergeMaps merges src into dst. Values in src override those in dst.
func mergeMaps(dst, src map[string]any) map[string]any {
	result := make(map[string]any)
	for k, v := range dst {
		result[k] = v
	}
	for k, v := range src {
		if srcMap, ok := v.(map[string]any); ok {
			if dstMap, ok := result[k].(map[string]any); ok {
				result[k] = mergeMaps(dstMap, srcMap)
				continue
			}
		}
		result[k] = v
	}
	return result
}
