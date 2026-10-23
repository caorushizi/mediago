package core

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var (
	ErrCustomDownloadDirectory  = errors.New("downloadDir is only supported by the desktop app; Docker/server downloads use the configured download directory")
	ErrInvalidDownloadDirectory = errors.New("downloadDir must be an absolute directory path")
	ErrInvalidDownloadFolder    = errors.New("folder must be a relative subdirectory within the download directory")
)

type downloadLocation struct {
	directory string
	root      string
	relative  string
}

// ResolveDownloadDirectory validates a task's location without creating it.
// Existing symlinks in folder must stay within the selected download root.
func ResolveDownloadDirectory(defaultDir, downloadDir, folder string, desktop bool) (string, error) {
	location, err := resolveDownloadLocation(defaultDir, downloadDir, folder, desktop)
	return location.directory, err
}

func resolveDownloadLocation(defaultDir, downloadDir, folder string, desktop bool) (downloadLocation, error) {
	root := defaultDir
	if downloadDir != "" {
		if !desktop {
			return downloadLocation{}, ErrCustomDownloadDirectory
		}
		if !filepath.IsAbs(downloadDir) || strings.ContainsRune(downloadDir, '\x00') {
			return downloadLocation{}, ErrInvalidDownloadDirectory
		}
		root = filepath.Clean(downloadDir)
	}
	// Interpret both separators so Windows-style traversal is also rejected
	// by Linux servers and validated folders match the downloader arguments.
	folder = strings.ReplaceAll(folder, "\\", "/")
	if folder != "" && (!filepath.IsLocal(folder) || strings.ContainsAny(folder, ":\x00")) {
		return downloadLocation{}, ErrInvalidDownloadFolder
	}
	dir := root
	if folder != "" {
		dir = filepath.Join(root, folder)
	}
	resolvedRoot, err := resolveExistingDirectory(root)
	if err != nil {
		return downloadLocation{}, fmt.Errorf("resolve download directory: %w", err)
	}
	resolvedDir, err := resolveExistingDirectory(dir)
	if err != nil {
		return downloadLocation{}, fmt.Errorf("resolve download subdirectory: %w", err)
	}
	relative, err := filepath.Rel(resolvedRoot, resolvedDir)
	if err != nil || !filepath.IsLocal(relative) {
		return downloadLocation{}, ErrInvalidDownloadFolder
	}
	return downloadLocation{directory: dir, root: resolvedRoot, relative: relative}, nil
}

// Keep a handle to the selected directory throughout output inspection and
// recovery. Resolve contained aliases first, since os.Root rejects absolute
// symlinks even when their targets are inside the selected directory.
func openDownloadDirectory(defaultDir, downloadDir, folder string, desktop bool) (*os.Root, error) {
	location, err := resolveDownloadLocation(defaultDir, downloadDir, folder, desktop)
	if err != nil {
		return nil, err
	}
	selected, err := openOrCreateDirectoryRoot(location.root)
	if err != nil {
		return nil, fmt.Errorf("open download directory: %w", err)
	}
	defer selected.Close()
	if err := selected.MkdirAll(location.relative, 0o755); err != nil {
		return nil, fmt.Errorf("create download subdirectory: %w", err)
	}
	output, err := selected.OpenRoot(location.relative)
	if err != nil {
		return nil, fmt.Errorf("open download subdirectory: %w", err)
	}
	return output, nil
}

func openOrCreateDirectoryRoot(directory string) (*os.Root, error) {
	root, err := os.OpenRoot(directory)
	if err == nil || !errors.Is(err, os.ErrNotExist) {
		return root, err
	}
	parent := filepath.Dir(directory)
	if parent == directory {
		return nil, err
	}
	parentRoot, err := openOrCreateDirectoryRoot(parent)
	if err != nil {
		return nil, err
	}
	defer parentRoot.Close()
	base := filepath.Base(directory)
	if err := parentRoot.Mkdir(base, 0o755); err != nil && !errors.Is(err, os.ErrExist) {
		return nil, err
	}
	return parentRoot.OpenRoot(base)
}

// Resolve the closest existing ancestor so a new nested directory can be
// validated without losing symlink information from its existing parents.
func resolveExistingDirectory(dir string) (string, error) {
	absolute, err := filepath.Abs(dir)
	if err != nil {
		return "", err
	}
	resolved, err := filepath.EvalSymlinks(absolute)
	if err == nil {
		root, openErr := os.OpenRoot(resolved)
		if openErr != nil {
			return "", openErr
		}
		if err := root.Close(); err != nil {
			return "", err
		}
		return resolved, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return "", err
	}
	parent := filepath.Dir(absolute)
	if parent == absolute {
		return "", err
	}
	parentRoot, openErr := os.OpenRoot(parent)
	if openErr == nil {
		_, linkErr := parentRoot.Lstat(filepath.Base(absolute))
		_ = parentRoot.Close()
		if linkErr == nil {
			return "", err // Reject dangling symlinks.
		}
		if !errors.Is(linkErr, os.ErrNotExist) {
			return "", linkErr
		}
	} else if !errors.Is(openErr, os.ErrNotExist) {
		return "", openErr
	}
	resolvedParent, err := resolveExistingDirectory(parent)
	if err != nil {
		return "", err
	}
	return filepath.Join(resolvedParent, filepath.Base(absolute)), nil
}

// Verify the pathname still identifies the opened directory before returning
// path strings to callers; rooted operations alone survive a directory rename.
func verifyDownloadDirectory(root *os.Root) error {
	current, err := os.OpenRoot(root.Name())
	if err != nil {
		return fmt.Errorf("download directory changed: %w", err)
	}
	defer current.Close()
	selectedInfo, err := root.Stat(".")
	if err != nil {
		return err
	}
	currentInfo, err := current.Stat(".")
	if err != nil {
		return err
	}
	if !os.SameFile(selectedInfo, currentInfo) {
		return errors.New("download directory changed during download")
	}
	return nil
}
