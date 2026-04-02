package video

import (
	"fmt"
	"mime"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/caorushizi/mediago-player/internal/util"
)

// Service provides video-related operations
type Service interface {
	// GetVideoFiles returns all video files from the configured directory
	GetVideoFiles() ([]Video, error)
	// GetVideoDir returns the video directory path
	GetVideoDir() string
}

type service struct {
	videoDir string
	serverIP string
	port     string
}

// NewService creates a new video service
func NewService(videoDir, serverAddr string) (Service, error) {
	if videoDir == "" {
		return nil, fmt.Errorf("video directory not configured")
	}

	// Check if directory exists
	if _, err := os.Stat(videoDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("video directory does not exist: %s", videoDir)
	}

	// Get local IP
	localIP := util.GetLocalIP()

	// Extract port from server address (e.g., ":8080" -> "8080")
	port := strings.TrimPrefix(serverAddr, ":")
	if port == "" {
		port = "8080"
	}

	return &service{
		videoDir: videoDir,
		serverIP: localIP,
		port:     port,
	}, nil
}

// GetVideoFiles scans the video directory and returns all video files
func (s *service) GetVideoFiles() ([]Video, error) {
	var videos []Video

	// Walk through all files in the directory
	err := filepath.Walk(s.videoDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Check if file is a video based on MIME type
		ext := filepath.Ext(path)
		mimeType := mime.TypeByExtension(ext)

		if mimeType != "" && strings.HasPrefix(mimeType, "video") {
			fileName := filepath.Base(path)
			encodedFileName := url.PathEscape(fileName)

			video := Video{
				Title: fileName,
				URL:   fmt.Sprintf("videos/%s", encodedFileName),
			}
			videos = append(videos, video)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to scan video directory: %w", err)
	}

	return videos, nil
}

// GetVideoDir returns the configured video directory path
func (s *service) GetVideoDir() string {
	return s.videoDir
}
