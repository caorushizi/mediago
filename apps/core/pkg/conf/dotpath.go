package conf

import (
	"strings"
)

// dotGet retrieves a value from a nested map using dot-notation.
// e.g. dotGet(m, "foo.bar") returns m["foo"]["bar"].
// Returns nil if the path does not exist.
func dotGet(data map[string]any, key string) any {
	parts := strings.Split(key, ".")
	current := any(data)

	for _, part := range parts {
		m, ok := current.(map[string]any)
		if !ok {
			return nil
		}
		current, ok = m[part]
		if !ok {
			return nil
		}
	}

	return current
}

// dotSet sets a value in a nested map using dot-notation.
// e.g. dotSet(m, "foo.bar", 42) sets m["foo"]["bar"] = 42.
// Intermediate maps are created as needed.
func dotSet(data map[string]any, key string, value any) {
	parts := strings.Split(key, ".")

	// For a single key (no dot), set directly.
	if len(parts) == 1 {
		data[key] = value
		return
	}

	// Navigate to the parent, creating intermediate maps.
	current := data
	for _, part := range parts[:len(parts)-1] {
		next, ok := current[part]
		if !ok {
			next = make(map[string]any)
			current[part] = next
		}
		nextMap, ok := next.(map[string]any)
		if !ok {
			nextMap = make(map[string]any)
			current[part] = nextMap
		}
		current = nextMap
	}

	current[parts[len(parts)-1]] = value
}

// dotDelete removes a key from a nested map using dot-notation.
func dotDelete(data map[string]any, key string) {
	parts := strings.Split(key, ".")

	if len(parts) == 1 {
		delete(data, key)
		return
	}

	current := data
	for _, part := range parts[:len(parts)-1] {
		next, ok := current[part]
		if !ok {
			return
		}
		nextMap, ok := next.(map[string]any)
		if !ok {
			return
		}
		current = nextMap
	}

	delete(current, parts[len(parts)-1])
}
