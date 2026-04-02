package service

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"caorushizi.cn/mediago/internal/logger"
)

// ProgressCallback is called with the conversion progress (0-100).
type ProgressCallback func(progress int)

// Converter manages ffmpeg conversion processes.
type Converter struct {
	ffmpegBin string
	mu        sync.Mutex
	cancels   map[int64]context.CancelFunc
}

// NewConverter creates a Converter with the given ffmpeg binary path.
func NewConverter(ffmpegBin string) *Converter {
	return &Converter{
		ffmpegBin: ffmpegBin,
		cancels:   make(map[int64]context.CancelFunc),
	}
}

// Start begins an ffmpeg conversion. It blocks until the conversion completes or is cancelled.
// The onProgress callback is called periodically with the current progress percentage.
func (c *Converter) Start(id int64, inputPath, outputFormat, quality string, onProgress ProgressCallback) (outputPath string, err error) {
	if c.ffmpegBin == "" {
		return "", fmt.Errorf("ffmpeg binary path not configured")
	}

	// Generate output path: same dir, new extension
	dir := filepath.Dir(inputPath)
	base := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	outputPath = filepath.Join(dir, base+"."+outputFormat)

	// Get input duration for progress calculation
	duration := c.probeDuration(inputPath)

	// Build ffmpeg args
	args := buildFFmpegArgs(inputPath, outputPath, outputFormat, quality)

	ctx, cancel := context.WithCancel(context.Background())
	c.mu.Lock()
	c.cancels[id] = cancel
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.cancels, id)
		c.mu.Unlock()
		cancel()
	}()

	cmd := exec.CommandContext(ctx, c.ffmpegBin, args...)

	// ffmpeg writes progress to stderr
	stderr, pipeErr := cmd.StderrPipe()
	if pipeErr != nil {
		return "", fmt.Errorf("failed to get stderr pipe: %w", pipeErr)
	}

	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Parse progress from stderr
	if duration > 0 && onProgress != nil {
		scanner := bufio.NewScanner(stderr)
		scanner.Split(scanFFmpegOutput)
		timeRegex := regexp.MustCompile(`time=(\d+):(\d+):(\d+)\.(\d+)`)
		for scanner.Scan() {
			line := scanner.Text()
			if matches := timeRegex.FindStringSubmatch(line); matches != nil {
				h, _ := strconv.Atoi(matches[1])
				m, _ := strconv.Atoi(matches[2])
				s, _ := strconv.Atoi(matches[3])
				elapsed := time.Duration(h)*time.Hour + time.Duration(m)*time.Minute + time.Duration(s)*time.Second
				pct := int(float64(elapsed) / float64(duration) * 100)
				if pct > 100 {
					pct = 100
				}
				onProgress(pct)
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		if ctx.Err() == context.Canceled {
			return "", fmt.Errorf("conversion cancelled")
		}
		return "", fmt.Errorf("ffmpeg failed: %w", err)
	}

	return outputPath, nil
}

// Stop cancels a running conversion.
func (c *Converter) Stop(id int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if cancel, ok := c.cancels[id]; ok {
		cancel()
	}
}

// probeDuration uses ffprobe to get the input file duration.
func (c *Converter) probeDuration(inputPath string) time.Duration {
	ffprobe := strings.TrimSuffix(c.ffmpegBin, filepath.Ext(c.ffmpegBin))
	if !strings.HasSuffix(ffprobe, "ffprobe") {
		// Derive ffprobe path from ffmpeg path (same directory)
		ffprobe = filepath.Join(filepath.Dir(c.ffmpegBin), "ffprobe")
	}

	cmd := exec.Command(ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", inputPath)
	out, err := cmd.Output()
	if err != nil {
		logger.Warnf("ffprobe failed for %s: %v", inputPath, err)
		return 0
	}
	s := strings.TrimSpace(string(out))
	seconds, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return time.Duration(seconds * float64(time.Second))
}

// scanFFmpegOutput is a split function for bufio.Scanner that splits on \r or \n.
// ffmpeg uses \r for progress line overwrites.
func scanFFmpegOutput(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	for i := 0; i < len(data); i++ {
		if data[i] == '\r' || data[i] == '\n' {
			return i + 1, data[:i], nil
		}
	}
	if atEOF {
		return len(data), data, nil
	}
	return 0, nil, nil
}

// buildFFmpegArgs builds the ffmpeg command-line arguments for a given format and quality.
func buildFFmpegArgs(input, output, format, quality string) []string {
	args := []string{"-y", "-i", input}

	switch format {
	case "mp4", "mkv":
		crf := qualityCRF(quality)
		args = append(args, "-c:v", "libx264", "-crf", strconv.Itoa(crf), "-c:a", "aac", "-b:a", "192k")
	case "webm":
		crf := qualityCRF(quality)
		args = append(args, "-c:v", "libvpx-vp9", "-crf", strconv.Itoa(crf), "-b:v", "0", "-c:a", "libopus")
	case "mp3":
		args = append(args, "-vn", "-acodec", "libmp3lame", "-b:a", audioQualityMP3(quality))
	case "aac":
		args = append(args, "-vn", "-acodec", "aac", "-b:a", audioQualityAAC(quality))
	case "flac":
		args = append(args, "-vn", "-acodec", "flac")
	case "wav":
		args = append(args, "-vn", "-acodec", "pcm_s16le")
	default:
		// Fallback: copy streams
		args = append(args, "-c", "copy")
	}

	args = append(args, output)
	return args
}

func qualityCRF(quality string) int {
	switch quality {
	case "high":
		return 18
	case "low":
		return 28
	default:
		return 23
	}
}

func audioQualityMP3(quality string) string {
	switch quality {
	case "high":
		return "320k"
	case "low":
		return "128k"
	default:
		return "192k"
	}
}

func audioQualityAAC(quality string) string {
	switch quality {
	case "high":
		return "256k"
	case "low":
		return "96k"
	default:
		return "128k"
	}
}
