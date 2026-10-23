package app

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const AuthSetupTokenFilename = "setup-token"

// PrepareAuthSetup keeps the bootstrap secret outside the API-visible store.
// Only an operator with access to the config volume can read it.
func PrepareAuthSetup(cfg *AppConfig, store interface{ Get(string) any }) (string, error) {
	if !cfg.EnableAuth {
		return "", nil
	}
	password, _ := store.Get("passwordHash").(string)
	apiKey, _ := store.Get("apiKey").(string)
	if password != "" || apiKey != "" {
		return "", nil
	}
	if err := os.MkdirAll(cfg.ConfigDir, 0o700); err != nil {
		return "", fmt.Errorf("create authentication config directory: %w", err)
	}
	root, err := os.OpenRoot(cfg.ConfigDir)
	if err != nil {
		return "", fmt.Errorf("open authentication config directory: %w", err)
	}
	defer root.Close()
	file, err := root.OpenFile(AuthSetupTokenFilename, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if errors.Is(err, os.ErrExist) {
		info, err := root.Lstat(AuthSetupTokenFilename)
		if err != nil || !info.Mode().IsRegular() {
			return "", errors.New("authentication setup token must be a regular file")
		}
		if runtime.GOOS != "windows" && info.Mode().Perm()&0o077 != 0 {
			return "", errors.New("authentication setup token file must be readable only by its owner")
		}
		existing, err := root.Open(AuthSetupTokenFilename)
		if err != nil {
			return "", fmt.Errorf("open authentication setup token: %w", err)
		}
		defer existing.Close()
		data, err := io.ReadAll(io.LimitReader(existing, 66))
		if err != nil {
			return "", fmt.Errorf("read authentication setup token: %w", err)
		}
		token := strings.TrimSuffix(string(data), "\n")
		decoded, err := hex.DecodeString(token)
		if err != nil || len(token) != 64 || len(decoded) != 32 {
			return "", errors.New("authentication setup token file is invalid; remove it locally to generate a new token")
		}
		return token, nil
	}
	if err != nil {
		return "", fmt.Errorf("create authentication setup token: %w", err)
	}
	var secret [32]byte
	if _, err := rand.Read(secret[:]); err != nil {
		_ = file.Close()
		_ = root.Remove(AuthSetupTokenFilename)
		return "", fmt.Errorf("generate authentication setup token: %w", err)
	}
	token := hex.EncodeToString(secret[:])
	if _, err := file.WriteString(token + "\n"); err != nil {
		_ = file.Close()
		_ = root.Remove(AuthSetupTokenFilename)
		return "", fmt.Errorf("write authentication setup token: %w", err)
	}
	if err := file.Close(); err != nil {
		_ = root.Remove(AuthSetupTokenFilename)
		return "", fmt.Errorf("close authentication setup token: %w", err)
	}
	return token, nil
}

func AuthSetupTokenPath(cfg *AppConfig) string {
	return filepath.Join(cfg.ConfigDir, AuthSetupTokenFilename)
}

func ClearAuthSetupToken(cfg *AppConfig) error {
	root, err := os.OpenRoot(cfg.ConfigDir)
	if err != nil {
		return err
	}
	defer root.Close()
	if err := root.Remove(AuthSetupTokenFilename); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
