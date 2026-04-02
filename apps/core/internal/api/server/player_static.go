package server

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

// playerSPAConfig defines configuration for serving the embedded player SPA
type playerSPAConfig struct {
	// FS is the embedded filesystem containing the SPA files
	FS embed.FS
	// Root is the root directory in the embedded FS (e.g., "player")
	Root string
	// PathPrefix is the URL path prefix for this SPA (e.g., "/player")
	PathPrefix string
}

// newPlayerSPAHandler creates a handler for serving the embedded player UI
func newPlayerSPAHandler(config playerSPAConfig) gin.HandlerFunc {
	indexFile := "index.html"

	// Create a sub-filesystem rooted at the specified directory
	subFS, err := fs.Sub(config.FS, config.Root)
	if err != nil {
		panic("failed to create sub filesystem: " + err.Error())
	}

	return func(c *gin.Context) {
		urlPath := c.Request.URL.Path

		// Only handle paths under the prefix
		if !strings.HasPrefix(urlPath, config.PathPrefix) {
			c.Next()
			return
		}

		// Remove the path prefix
		urlPath = strings.TrimPrefix(urlPath, config.PathPrefix)

		// Clean the path
		cleanPath := path.Clean(urlPath)
		if cleanPath == "." || cleanPath == "/" || cleanPath == "" {
			cleanPath = indexFile
		} else {
			cleanPath = strings.TrimPrefix(cleanPath, "/")
		}

		// Try to read the requested file
		data, err := fs.ReadFile(subFS, cleanPath)
		if err != nil {
			// File not found - fallback to index.html for SPA routing
			data, err = fs.ReadFile(subFS, indexFile)
			if err != nil {
				c.Next()
				return
			}
			cleanPath = indexFile
		}

		// Set appropriate content type
		contentType := detectPlayerContentType(cleanPath, data)
		c.Data(http.StatusOK, contentType, data)
		c.Abort()
	}
}

// detectPlayerContentType determines the MIME type of a file
func detectPlayerContentType(filename string, data []byte) string {
	ext := filepath.Ext(filename)
	if mimeType := mime.TypeByExtension(ext); mimeType != "" {
		if strings.HasPrefix(mimeType, "text/") ||
			mimeType == "application/javascript" ||
			mimeType == "application/json" {
			return mimeType + "; charset=utf-8"
		}
		return mimeType
	}

	contentType := http.DetectContentType(data)

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
