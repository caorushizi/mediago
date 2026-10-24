package core

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

var ErrLiveSegmentRecovery = errors.New("live recording segments could not be merged automatically")

type liveSegment struct {
	index int64
	path  string
	size  int64
}

// recoverLiveM3U8Segments rebuilds the top-level MPEG-TS recording when the
// downloader exits before publishing it. Automatic recovery is deliberately
// limited to one continuous, numerically ordered TS track. Multi-track and
// fragmented-MP4 layouts need the downloader's metadata-aware muxer and are
// left untouched instead of risking a corrupt output.
func recoverLiveM3U8Segments(root *os.Root, downloadName string) (string, error) {
	segmentRoot := outputBaseName(downloadName)
	groups, err := liveTSSegmentGroups(root, segmentRoot)
	if err != nil {
		return "", err
	}
	if len(groups) == 0 {
		return "", ErrM3U8OutputMissing
	}
	if len(groups) != 1 {
		return "", fmt.Errorf("%w: found %d media tracks", ErrLiveSegmentRecovery, len(groups))
	}

	var segments []liveSegment
	for _, group := range groups {
		segments = group
	}
	if err := validateLiveTSSegments(segments); err != nil {
		return "", err
	}

	temporaryPath := ".mediago-live-recovery-" + rand.Text() + ".ts"
	temporary, err := root.OpenFile(temporaryPath, os.O_RDWR|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return "", fmt.Errorf("%w: create temporary output: %v", ErrLiveSegmentRecovery, err)
	}
	keepTemporary := false
	defer func() {
		_ = temporary.Close()
		if !keepTemporary {
			_ = root.Remove(temporaryPath)
		}
	}()

	var expectedSize int64
	for _, segment := range segments {
		source, openErr := root.Open(segment.path)
		if openErr != nil {
			return "", fmt.Errorf("%w: open segment: %v", ErrLiveSegmentRecovery, openErr)
		}
		written, copyErr := io.Copy(temporary, source)
		closeErr := source.Close()
		if copyErr != nil {
			return "", fmt.Errorf("%w: copy segment: %v", ErrLiveSegmentRecovery, copyErr)
		}
		if closeErr != nil {
			return "", fmt.Errorf("%w: close segment: %v", ErrLiveSegmentRecovery, closeErr)
		}
		if written != segment.size {
			return "", fmt.Errorf("%w: segment changed during recovery", ErrLiveSegmentRecovery)
		}
		expectedSize += written
	}

	if err := temporary.Sync(); err != nil {
		return "", fmt.Errorf("%w: flush recovered output: %v", ErrLiveSegmentRecovery, err)
	}
	if err := temporary.Close(); err != nil {
		return "", fmt.Errorf("%w: close recovered output: %v", ErrLiveSegmentRecovery, err)
	}
	if expectedSize == 0 {
		return "", fmt.Errorf("%w: recovered output is empty", ErrLiveSegmentRecovery)
	}

	outputPath, err := availableRecoveredOutputPath(root, outputBaseName(downloadName))
	if err != nil {
		return "", err
	}
	if err := root.Rename(temporaryPath, outputPath); err != nil {
		return "", fmt.Errorf("%w: publish recovered output: %v", ErrLiveSegmentRecovery, err)
	}
	keepTemporary = true

	info, err := root.Stat(outputPath)
	if err != nil || !info.Mode().IsRegular() || info.Size() != expectedSize {
		_ = root.Remove(outputPath)
		if err != nil {
			return "", fmt.Errorf("%w: inspect recovered output: %v", ErrLiveSegmentRecovery, err)
		}
		return "", fmt.Errorf("%w: recovered output size mismatch", ErrLiveSegmentRecovery)
	}
	absolute, err := filepath.Abs(filepath.Join(root.Name(), outputPath))
	if err != nil {
		return "", fmt.Errorf("%w: resolve recovered output: %v", ErrLiveSegmentRecovery, err)
	}
	return absolute, nil
}

func liveTSSegmentGroups(root *os.Root, segmentDirectory string) (map[string][]liveSegment, error) {
	groups := make(map[string][]liveSegment)
	err := fs.WalkDir(root.FS(), filepath.ToSlash(segmentDirectory), func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			if errors.Is(walkErr, os.ErrNotExist) {
				return nil
			}
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		if entry.Type()&os.ModeSymlink != 0 || !strings.EqualFold(filepath.Ext(entry.Name()), ".ts") {
			return nil
		}
		index, parseErr := strconv.ParseInt(strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name())), 10, 64)
		if parseErr != nil {
			return fmt.Errorf("%w: non-numeric TS segment name", ErrLiveSegmentRecovery)
		}
		relative := filepath.FromSlash(path)
		info, infoErr := root.Lstat(relative)
		if infoErr != nil {
			return infoErr
		}
		if !info.Mode().IsRegular() || info.Size() == 0 {
			return fmt.Errorf("%w: empty or non-regular TS segment", ErrLiveSegmentRecovery)
		}
		directory := filepath.Dir(relative)
		groups[directory] = append(groups[directory], liveSegment{index: index, path: relative, size: info.Size()})
		return nil
	})
	if errors.Is(err, os.ErrNotExist) {
		return groups, nil
	}
	if err != nil {
		return nil, fmt.Errorf("%w: inspect preserved segments: %v", ErrLiveSegmentRecovery, err)
	}
	return groups, nil
}

func validateLiveTSSegments(segments []liveSegment) error {
	if len(segments) == 0 {
		return ErrM3U8OutputMissing
	}
	sort.Slice(segments, func(i, j int) bool { return segments[i].index < segments[j].index })
	for index := 1; index < len(segments); index++ {
		if segments[index].index != segments[index-1].index+1 {
			return fmt.Errorf("%w: TS segment sequence has a gap", ErrLiveSegmentRecovery)
		}
	}
	return nil
}

func availableRecoveredOutputPath(root *os.Root, baseName string) (string, error) {
	candidates := []string{
		baseName + ".ts",
		baseName + ".recovered.ts",
	}
	for suffix := 2; ; suffix++ {
		for _, candidate := range candidates {
			_, err := root.Lstat(candidate)
			if errors.Is(err, os.ErrNotExist) {
				return candidate, nil
			}
			if err != nil {
				return "", fmt.Errorf("%w: inspect output target: %v", ErrLiveSegmentRecovery, err)
			}
		}
		candidates = []string{fmt.Sprintf("%s.recovered-%d.ts", baseName, suffix)}
	}
}
