package app

import (
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"testing"
)

type setupStore map[string]any

func (s setupStore) Get(key string) any { return s[key] }

func TestPrepareAuthSetupPersistsPrivateTokenAcrossRestarts(t *testing.T) {
	cfg := &AppConfig{EnableAuth: true, ConfigDir: filepath.Join(t.TempDir(), "config")}
	store := setupStore{}
	first, err := PrepareAuthSetup(cfg, store)
	if err != nil {
		t.Fatal(err)
	}
	decoded, err := hex.DecodeString(first)
	if err != nil || len(decoded) != 32 {
		t.Fatal("setup token does not contain 256 random bits")
	}
	second, err := PrepareAuthSetup(cfg, store)
	if err != nil || first != second {
		t.Fatalf("restart lost bootstrap credential: %v", err)
	}
	info, err := os.Stat(AuthSetupTokenPath(cfg))
	if err != nil {
		t.Fatal(err)
	}
	if runtime.GOOS != "windows" && info.Mode().Perm() != 0o600 {
		t.Fatalf("token permissions = %o", info.Mode().Perm())
	}
	if len(store) != 0 {
		t.Fatal("setup token leaked into API configuration")
	}
	if err := ClearAuthSetupToken(cfg); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(AuthSetupTokenPath(cfg)); !os.IsNotExist(err) {
		t.Fatalf("completed token remains: %v", err)
	}
}

func TestPrepareAuthSetupDoesNotChangeConfiguredOrDisabledInstances(t *testing.T) {
	for _, test := range []struct {
		name    string
		enabled bool
		store   setupStore
	}{
		{"disabled", false, setupStore{}},
		{"password configured", true, setupStore{"passwordHash": "existing"}},
		{"legacy key configured", true, setupStore{"apiKey": "existing"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			cfg := &AppConfig{EnableAuth: test.enabled, ConfigDir: filepath.Join(t.TempDir(), "untouched")}
			token, err := PrepareAuthSetup(cfg, test.store)
			if err != nil || token != "" {
				t.Fatalf("bootstrap required unexpectedly: %v", err)
			}
			if _, err := os.Stat(cfg.ConfigDir); !os.IsNotExist(err) {
				t.Fatalf("existing instance touched: %v", err)
			}
		})
	}
}

func TestPrepareAuthSetupFailsClosedOnInvalidTokenFiles(t *testing.T) {
	for _, contents := range []string{"", "invalid", strings.Repeat("a", 1024)} {
		cfg := &AppConfig{EnableAuth: true, ConfigDir: t.TempDir()}
		if err := os.WriteFile(AuthSetupTokenPath(cfg), []byte(contents), 0o600); err != nil {
			t.Fatal(err)
		}
		if _, err := PrepareAuthSetup(cfg, setupStore{}); err == nil {
			t.Fatal("invalid existing token accepted")
		}
	}
}

func TestPrepareAuthSetupRejectsLinkedTokenFile(t *testing.T) {
	cfg := &AppConfig{EnableAuth: true, ConfigDir: t.TempDir()}
	outside := filepath.Join(t.TempDir(), "unrelated")
	if err := os.WriteFile(outside, []byte(strings.Repeat("a", 64)+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, AuthSetupTokenPath(cfg)); err != nil {
		if runtime.GOOS == "windows" && errors.Is(err, syscall.Errno(1314)) {
			t.Skip("Windows symlink privilege unavailable")
		}
		t.Fatal(err)
	}
	if _, err := PrepareAuthSetup(cfg, setupStore{}); err == nil {
		t.Fatal("linked setup token was accepted")
	}
}
