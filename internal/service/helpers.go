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

// videoExtensions 视频文件扩展名列表（与 TypeScript videoPattern 一致）。
var videoExtensions = []string{
	"mp4", "flv", "avi", "rmvb", "wmv", "mov", "mkv", "webm",
	"mpeg", "mpg", "m4v", "3gp", "3g2", "f4v", "f4p", "f4a", "f4b",
	"ts", "m4a", "mp3", "aac",
}

var titleRegexp = regexp.MustCompile(`(?i)<title[^>]*>(.*?)</title>`)

const randomChars = "abcdefghijklmnopqrstuvwxyz0123456789"

// RandomName 生成 "YYYYMMDD-<10随机字符>" 格式的名称。
func RandomName() string {
	now := time.Now()
	prefix := now.Format("20060102")
	b := make([]byte, 10)
	for i := range b {
		b[i] = randomChars[rand.Intn(len(randomChars))]
	}
	return fmt.Sprintf("%s-%s", prefix, string(b))
}

// GetPageTitle 通过 HTTP GET 请求获取网页标题。
func GetPageTitle(url string, fallback string) string {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return fallback
	}
	defer resp.Body.Close()

	// 只读取前 64KB 来查找 title
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

// CheckFileExists 检查指定名称的视频文件是否存在于 localPath 目录中。
// 返回是否存在以及完整文件路径。
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

	// 也检查不带扩展名的目录（某些下载器输出到文件夹）
	dirPath := filepath.Join(localPath, name)
	if info, err := os.Stat(dirPath); err == nil && info.IsDir() {
		return true, dirPath
	}

	return false, ""
}
