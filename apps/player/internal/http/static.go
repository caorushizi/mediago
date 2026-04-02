package http

import (
	"embed"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// SPAConfig defines configuration for serving a Single Page Application
type SPAConfig struct {
	// FS is the embedded filesystem containing the SPA files
	FS embed.FS
	// Root is the root directory in the embedded FS (e.g., "web-desktop/dist")
	Root string
	// PathPrefix is the URL path prefix for this SPA (e.g., "/m" for mobile, "" for desktop)
	PathPrefix string
	// IndexFile is the fallback file for SPA routing (default: "index.html")
	IndexFile string
	// ExcludePrefixes is a list of URL path prefixes to exclude from SPA handling (e.g., ["/api/", "/healthy"])
	ExcludePrefixes []string
}

// NewSPAHandler creates a handler for serving SPA static files with proper fallback
func NewSPAHandler(config SPAConfig) gin.HandlerFunc {
	if config.IndexFile == "" {
		config.IndexFile = "index.html"
	}

	// Create a sub-filesystem rooted at the specified directory
	subFS, err := fs.Sub(config.FS, config.Root)
	if err != nil {
		panic("failed to create sub filesystem: " + err.Error())
	}

	return func(c *gin.Context) {
		// Get the requested path
		urlPath := c.Request.URL.Path

		// Check if the path should be excluded from SPA handling
		for _, prefix := range config.ExcludePrefixes {
			if strings.HasPrefix(urlPath, prefix) || urlPath == strings.TrimSuffix(prefix, "/") {
				c.Next()
				return
			}
		}

		// Remove the path prefix if present
		if config.PathPrefix != "" {
			if !strings.HasPrefix(urlPath, config.PathPrefix) {
				c.Next()
				return
			}
			urlPath = strings.TrimPrefix(urlPath, config.PathPrefix)
		}

		// Clean the path and ensure it doesn't escape the root
		cleanPath := path.Clean(urlPath)
		if cleanPath == "." || cleanPath == "/" {
			cleanPath = config.IndexFile
		} else {
			// Remove leading slash for fs.FS
			cleanPath = strings.TrimPrefix(cleanPath, "/")
		}

		// Try to read the requested file
		data, err := fs.ReadFile(subFS, cleanPath)
		if err != nil {
			// File not found - fallback to index.html for SPA routing
			data, err = fs.ReadFile(subFS, config.IndexFile)
			if err != nil {
				// If even index.html is not found, let the next handler deal with it
				c.Next()
				return
			}
			cleanPath = config.IndexFile
		}

		// Set appropriate content type
		contentType := detectContentType(cleanPath, data)
		c.Data(http.StatusOK, contentType, data)
		c.Abort() // Prevent further handlers from executing
	}
}

// detectContentType determines the MIME type of a file based on extension and content
func detectContentType(filename string, data []byte) string {
	// First, try to detect by extension
	ext := filepath.Ext(filename)
	if mimeType := mime.TypeByExtension(ext); mimeType != "" {
		// Add charset for text types
		if strings.HasPrefix(mimeType, "text/") ||
			mimeType == "application/javascript" ||
			mimeType == "application/json" {
			return mimeType + "; charset=utf-8"
		}
		return mimeType
	}

	// Fallback to content-based detection for first 512 bytes
	contentType := http.DetectContentType(data)

	// Special handling for common web files that might not be detected correctly
	switch ext {
	case ".js", ".mjs":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".wasm":
		return "application/wasm"
	case ".svg":
		return "image/svg+xml"
	case ".webp":
		return "image/webp"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	case ".otf":
		return "font/otf"
	case ".ico":
		return "image/x-icon"
	case ".webmanifest":
		return "application/manifest+json"
	}

	return contentType
}
