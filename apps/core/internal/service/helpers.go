package service

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// videoExtensions is the list of video file extensions (aligned with the TypeScript videoPattern).
var videoExtensions = []string{
	"mp4", "flv", "avi", "rmvb", "wmv", "mov", "mkv", "webm",
	"mpeg", "mpg", "m4v", "3gp", "3g2", "f4v", "f4p", "f4a", "f4b",
	"ts", "m4a", "mp3", "aac",
}

var titleRegexp = regexp.MustCompile(`(?i)<title[^>]*>(.*?)</title>`)

const randomChars = "abcdefghijklmnopqrstuvwxyz0123456789"

// RandomName generates a name in the format "YYYYMMDD-<10 random characters>".
func RandomName() string {
	now := time.Now()
	prefix := now.Format("20060102")
	b := make([]byte, 10)
	for i := range b {
		b[i] = randomChars[rand.Intn(len(randomChars))]
	}
	return fmt.Sprintf("%s-%s", prefix, string(b))
}

// GetPageTitle fetches the page title via an HTTP GET request.
func GetPageTitle(pageURL string, fallback string) string {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", pageURL, nil)
	if err != nil {
		return fallback
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
	req.Header.Set("Referer", pageURL)

	resp, err := client.Do(req)
	if err != nil {
		return fallback
	}
	defer resp.Body.Close()

	// Read only the first 64KB to find the title
	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return fallback
	}

	matches := titleRegexp.FindSubmatch(body)
	if len(matches) >= 2 {
		title := strings.TrimSpace(string(matches[1]))
		if title != "" {
			return title
		}
	}

	return fallback
}

// CheckFileExists checks whether a video file with the given name exists in the localPath directory.
// Returns whether it exists and the full file path.
func CheckFileExists(name, localPath string) (bool, string) {
	for _, ext := range videoExtensions {
		pattern := filepath.Join(localPath, name+"."+ext)
		matches, err := filepath.Glob(pattern)
		if err != nil {
			continue
		}
		if len(matches) > 0 {
			return true, matches[0]
		}
	}

	// Also check a directory without extension (some downloaders output to a folder)
	dirPath := filepath.Join(localPath, name)
	if info, err := os.Stat(dirPath); err == nil && info.IsDir() {
		return true, dirPath
	}

	return false, ""
}
