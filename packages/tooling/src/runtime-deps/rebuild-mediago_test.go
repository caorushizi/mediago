package main

import (
	"encoding/json"
	"testing"
)

func TestRejectsUnverifiedSource(t *testing.T) {
	for _, data := range []string{`{}`, `not json`, `{"Dir":"/cache","Sum":"h1:tampered"}`, `{"Dir":"","Sum":"` + sourceSum + `"}`} {
		if _, err := validatedSource([]byte(data)); err == nil {
			t.Fatalf("accepted unverified source metadata: %s", data)
		}
	}
	data, _ := json.Marshal(map[string]string{"Dir": "/verified/source", "Sum": sourceSum})
	if dir, err := validatedSource(data); err != nil || dir != "/verified/source" {
		t.Fatalf("verified source: %q %v", dir, err)
	}
}

func TestRejectsUnsupportedBuildTargetsBeforeWriting(t *testing.T) {
	for _, target := range []string{"", "linux", "linux-arm", "other-amd64", "linux-amd64-extra"} {
		if err := rebuild("unused", target); err == nil {
			t.Fatalf("accepted %q", target)
		}
	}
}
