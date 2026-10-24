package core

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"syscall"
	"testing"

	"caorushizi.cn/mediago/internal/core/schema"
)

func requireDownloadSymlink(t *testing.T, target, link string) {
	t.Helper()
	if err := os.Symlink(target, link); err != nil {
		if runtime.GOOS == "windows" && errors.Is(err, syscall.Errno(1314)) {
			t.Skipf("Windows symlink privilege unavailable: %v", err)
		}
		t.Fatal(err)
	}
}

func writeDownloadFixture(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(contents), 0o600); err != nil {
		t.Fatal(err)
	}
}

func TestOpenDownloadDirectoryCreatesSelectedLocation(t *testing.T) {
	for _, desktop := range []bool{false, true} {
		t.Run(map[bool]string{false: "server", true: "desktop"}[desktop], func(t *testing.T) {
			configured := filepath.Join(t.TempDir(), "new", "downloads")
			custom := ""
			selected := configured
			if desktop {
				custom = filepath.Join(t.TempDir(), "new", "custom")
				selected = custom
			}
			root, err := openDownloadDirectory(configured, custom, "courses\\chapter1", desktop)
			if err != nil {
				t.Fatal(err)
			}
			defer root.Close()
			if err := root.WriteFile("video.mp4", []byte("media"), 0o600); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(filepath.Join(selected, "courses", "chapter1", "video.mp4"))
			if err != nil || string(data) != "media" {
				t.Fatalf("selected output = %q, %v", data, err)
			}
			if desktop {
				if _, err := os.Stat(configured); !errors.Is(err, os.ErrNotExist) {
					t.Fatalf("custom download touched configured directory: %v", err)
				}
			}
		})
	}
}

func TestOpenDownloadDirectorySupportsContainedAliases(t *testing.T) {
	directory := t.TempDir()
	inside := filepath.Join(directory, "inside")
	if err := os.Mkdir(inside, 0o755); err != nil {
		t.Fatal(err)
	}
	requireDownloadSymlink(t, inside, filepath.Join(directory, "absolute-alias"))
	requireDownloadSymlink(t, "inside", filepath.Join(directory, "relative-alias"))
	configuredAlias := filepath.Join(t.TempDir(), "configured")
	requireDownloadSymlink(t, directory, configuredAlias)
	for _, folder := range []string{"absolute-alias/new", "relative-alias/new"} {
		root, err := openDownloadDirectory(configuredAlias, "", folder, false)
		if err != nil {
			t.Fatalf("%s: %v", folder, err)
		}
		if err := root.WriteFile("video.mp4", []byte("media"), 0o600); err != nil {
			t.Fatal(err)
		}
		_ = root.Close()
		if data, err := os.ReadFile(filepath.Join(inside, "new", "video.mp4")); err != nil || string(data) != "media" {
			t.Fatalf("alias output = %q, %v", data, err)
		}
	}
}

func TestOpenDownloadDirectoryRejectsEscapingAndDanglingAliases(t *testing.T) {
	directory, outside := t.TempDir(), t.TempDir()
	requireDownloadSymlink(t, outside, filepath.Join(directory, "escape"))
	requireDownloadSymlink(t, filepath.Join(directory, "missing"), filepath.Join(directory, "dangling"))
	for _, folder := range []string{"escape", "escape/new", "dangling", "dangling/new"} {
		if root, err := openDownloadDirectory(directory, "", folder, false); err == nil {
			_ = root.Close()
			t.Fatalf("opened invalid folder %q", folder)
		}
	}
	if _, err := os.Stat(filepath.Join(outside, "new")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("created escaping directory: %v", err)
	}
}

func TestDownloadUsesNormalizedFolderForArgumentsAndArtifacts(t *testing.T) {
	ensureTestLogger()
	directory := t.TempDir()
	bin := filepath.Join(t.TempDir(), "downloader")
	writeDownloadFixture(t, bin, "test")
	wantDir := filepath.Join(directory, "courses", "chapter1")
	wantPath := filepath.Join(wantDir, "video.mp4")
	downloader := NewDownloader(map[DownloadType]string{TypeDirect: bin}, runnerFunc(func(_ context.Context, _ string, args []string, _ func(string)) error {
		if !slices.Contains(args, wantDir) {
			t.Fatalf("arguments do not match validated directory: %v", args)
		}
		return os.WriteFile(wantPath, []byte("media"), 0o600)
	}), schema.DefaultSchemas(), testDownloaderConfig{localDir: directory})
	result, err := downloader.Download(context.Background(), DownloadParams{
		ID: "normalized", Type: TypeDirect, URL: "http://192.168.1.10/video.mp4",
		Name: "video", Folder: "courses\\chapter1",
	}, Callbacks{})
	if err != nil || result.PrimaryPath != wantPath {
		t.Fatalf("download = %+v, %v", result, err)
	}
}

func TestRootedOutputInspectionRejectsEscapingLinks(t *testing.T) {
	directory, outside := t.TempDir(), t.TempDir()
	writeDownloadFixture(t, filepath.Join(directory, "video.mp4"), "media")
	writeDownloadFixture(t, filepath.Join(directory, "video", "part.mp4"), "part")
	writeDownloadFixture(t, filepath.Join(outside, "private.mp4"), "private")
	requireDownloadSymlink(t, filepath.Join(outside, "private.mp4"), filepath.Join(directory, "video.leak.mp4"))
	requireDownloadSymlink(t, outside, filepath.Join(directory, "video", "escape"))
	requireDownloadSymlink(t, "video.mp4", filepath.Join(directory, "internal.mp4"))
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	files, err := captureOutputFiles(root, "video")
	if err != nil || len(files) != 2 {
		t.Fatalf("captured files = %+v, %v", files, err)
	}
	if _, ok := files[filepath.Join("video", "part.mp4")]; !ok {
		t.Fatal("regular nested output was omitted")
	}
	for _, reported := range []string{
		"video.leak.mp4", filepath.Join("video", "escape", "private.mp4"),
		filepath.Join(outside, "private.mp4"), "../private.mp4",
	} {
		if got := normalizeReportedOutputPath(root, reported); got != "" {
			t.Fatalf("accepted escaping reported output %q: %q", reported, got)
		}
	}
	for _, reported := range []string{"video.mp4", "internal.mp4", filepath.Join(directory, "video.mp4")} {
		if got := normalizeReportedOutputPath(root, reported); got == "" {
			t.Fatalf("rejected contained reported output %q", reported)
		}
	}
}

func TestRootedLiveRecoveryPreservesOutsideFilesAndExistingOutput(t *testing.T) {
	directory, outside := t.TempDir(), t.TempDir()
	writeDownloadFixture(t, filepath.Join(directory, "recording", "0.ts"), "first")
	writeDownloadFixture(t, filepath.Join(directory, "recording", "1.ts"), "second")
	outsidePath := filepath.Join(outside, "private.ts")
	writeDownloadFixture(t, outsidePath, "private")
	requireDownloadSymlink(t, outsidePath, filepath.Join(directory, "recording.ts"))
	requireDownloadSymlink(t, outside, filepath.Join(directory, "recording", "outside"))
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	got, err := recoverLiveM3U8Segments(root, "recording")
	want := filepath.Join(directory, "recording.recovered.ts")
	if err != nil || got != want {
		t.Fatalf("recovery = %q, %v; want %q", got, err, want)
	}
	if data, err := os.ReadFile(want); err != nil || string(data) != "firstsecond" {
		t.Fatalf("recovered content = %q, %v", data, err)
	}
	if data, err := os.ReadFile(outsidePath); err != nil || string(data) != "private" {
		t.Fatalf("outside file changed: %q, %v", data, err)
	}
	matches, err := filepath.Glob(filepath.Join(directory, ".mediago-live-recovery-*"))
	if err != nil || len(matches) != 0 {
		t.Fatalf("temporary recovery outputs remain: %v, %v", matches, err)
	}
}

func TestRootedLiveRecoveryDoesNotReadLinkedSegmentTrees(t *testing.T) {
	directory, outside := t.TempDir(), t.TempDir()
	writeDownloadFixture(t, filepath.Join(outside, "0.ts"), "private")
	requireDownloadSymlink(t, outside, filepath.Join(directory, "recording"))
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	// Root.FS rejects the escaping starting directory before walking it.
	if _, err := recoverLiveM3U8Segments(root, "recording"); !errors.Is(err, ErrLiveSegmentRecovery) {
		t.Fatalf("linked segment tree recovery = %v", err)
	}
	if _, err := os.Stat(filepath.Join(directory, "recording.ts")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("published output from linked segment tree: %v", err)
	}
}

func TestDownloadRejectsDirectoryReplacement(t *testing.T) {
	ensureTestLogger()
	parent, outside := t.TempDir(), t.TempDir()
	directory, moved := filepath.Join(parent, "downloads"), filepath.Join(parent, "moved")
	if err := os.Mkdir(directory, 0o755); err != nil {
		t.Fatal(err)
	}
	// Check symlink support before the downloader opens its directory handle.
	requireDownloadSymlink(t, outside, filepath.Join(parent, "probe"))
	bin := filepath.Join(t.TempDir(), "downloader")
	writeDownloadFixture(t, bin, "test")
	writeDownloadFixture(t, filepath.Join(outside, "video.mp4"), "private")
	downloader := NewDownloader(map[DownloadType]string{TypeDirect: bin}, runnerFunc(func(context.Context, string, []string, func(string)) error {
		if err := os.Rename(directory, moved); err != nil {
			t.Fatal(err)
		}
		requireDownloadSymlink(t, outside, directory)
		return nil
	}), schema.DefaultSchemas(), testDownloaderConfig{localDir: directory})
	result, err := downloader.Download(context.Background(), DownloadParams{
		ID: "replacement", Type: TypeDirect, URL: "http://192.168.1.10/video.mp4", Name: "video",
	}, Callbacks{})
	if err == nil || result.PrimaryPath != "" {
		t.Fatalf("directory replacement accepted: %+v, %v", result, err)
	}
	if data, err := os.ReadFile(filepath.Join(outside, "video.mp4")); err != nil || string(data) != "private" {
		t.Fatalf("outside file changed: %q, %v", data, err)
	}
}
