# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo Player is a hybrid application combining a Go backend server with a responsive React frontend application. The project uses a monorepo structure managed by Turborepo and pnpm workspaces, with Go handling the HTTP server and embedded static file serving. The frontend is built with shadcn/ui components and Tailwind CSS for a modern, responsive design that adapts to both desktop and mobile screens.

## Architecture

### Backend (Go)

The backend follows a clean architecture pattern with clear separation of concerns:

- **Entry Point**: [cmd/server/main.go](cmd/server/main.go) - HTTP server setup with graceful shutdown
- **HTTP Layer**: [internal/http/router.go](internal/http/router.go) - Gin router configuration, middleware chain, and SPA routing
- **Domain Logic**: `internal/video/` - Video domain with handler → service → types pattern for video management
- **Static Assets**: [assets/embed.go](assets/embed.go) - Embeds the UI dist directory into the Go binary using `//go:embed`

The router serves a single responsive SPA:
- Main application at `/` (from `ui/dist`)
- Mobile path `/m/` also serves the same responsive UI (for backward compatibility)

### Frontend (React + TypeScript + Vite)

A single responsive React application in the monorepo:
- [ui/](ui/) - Responsive web UI that adapts to desktop and mobile screens

Tech stack:
- React 18.3
- TypeScript 5.9
- Vite 7 (using `rolldown-vite` fork for faster builds)
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS 4 with @tailwindcss/vite plugin
- Lucide React for icons
- XGPlayer for video playback
- ahooks for React hooks utilities
- ESLint with TypeScript support

**UI Components**: The project uses shadcn/ui, a collection of reusable components built with Radix UI and Tailwind CSS. Components are located in `ui/src/components/ui/` and can be added via `pnpm dlx shadcn@latest add [component]`.

## Development Commands

### Full Stack Development

```bash
# Start the app in development mode (backend + frontend)
pnpm dev

# Build the app (frontend + backend)
pnpm build

# Preview production build
pnpm preview
```

### Backend Only (Go)

```bash
# Run server in development mode (with API docs enabled)
pnpm run gulp dev
# or: go run ./cmd/server -enable-docs

# With custom port
go run ./cmd/server -port 3000 -enable-docs

# With custom host and port (for LAN access)
go run ./cmd/server -host 0.0.0.0 -port 8080

# With video root override
go run ./cmd/server -video-root "D:\\Videos"

# Combine multiple flags
go run ./cmd/server -host 0.0.0.0 -port 3000 -video-root "D:\\Videos"

# Run tests
pnpm run gulp test
# or: go test ./...

# Generate Swagger documentation
pnpm run gulp docs
# or: swag init -g cmd/server/main.go -o docs

# Build binary (includes swagger generation)
pnpm run gulp build
# Output: dist/mediago-player(.exe)

# Run built binary
pnpm run gulp run
# or: ./dist/mediago-player(.exe)
```

### API Documentation

The project includes Swagger/OpenAPI documentation:

- **Swagger UI**: Available at `http://localhost:8080/docs/index.html` (disabled in production by default)
- **JSON Spec**: `http://localhost:8080/docs/doc.json`
- **Generation**: Run `pnpm run gulp docs` to regenerate docs (automatically done during `pnpm run gulp build`)

**Enabling Documentation**:
- **Development**: Use `pnpm run gulp dev` or add `-enable-docs` flag when running the server
- **Production**: Disabled by default, can be explicitly enabled with `-enable-docs` flag
- **Note**: `.env` file is NOT automatically loaded. Use command-line flags or set environment variables manually.

  ```bash
  # Development mode with docs
  pnpm run gulp dev  # Automatically includes -enable-docs
  # or
  go run ./cmd/server -enable-docs

  # Production build with docs enabled
  ./dist/mediago-player -enable-docs
  ```

To add API documentation to new endpoints:
1. Add Swagger comments to handler functions (see [internal/video/handler.go](internal/video/handler.go) for examples)
2. Run `pnpm run gulp docs` to regenerate documentation
3. Swagger comments follow [swaggo annotation format](https://github.com/swaggo/swag#declarative-comments-format)

### Frontend Only

```bash
# Work in the UI app
cd ui

# Development server (runs on port 8556)
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Preview build
pnpm preview

# Add shadcn/ui components
pnpm dlx shadcn@latest add [component-name]
```

## Configuration

### Environment Variables

See [.env.example](.env.example):
- `HTTP_ADDR` - Server address in `host:port` format (default: `0.0.0.0:8080`)
- `GIN_MODE` - Gin mode: `debug`, `release`, or `test` (default: `release`)
- `VIDEO_ROOT_PATH` - Local folder for video files (can also pass `-video-root` flag)

### Command-Line Flags

All flags are optional and override environment variables:
- `-host` - Server host address (e.g., `0.0.0.0` for LAN access, `localhost` for local only)
- `-port` - Server port (e.g., `8080`, `3000`)
- `-video-root` - Local folder path containing video files
- `-enable-docs` - Enable Swagger API documentation at `/docs` (disabled in production by default)

**Priority**: Command-line flags > `HTTP_ADDR` environment variable > default (`0.0.0.0:8080`)

**Examples**:
```bash
# Listen on all interfaces (LAN accessible) on port 8080
go run ./cmd/server -host 0.0.0.0 -port 8080

# Listen only locally on port 3000
go run ./cmd/server -host localhost -port 3000

# Change only the port (keeps host from HTTP_ADDR or defaults to 0.0.0.0)
go run ./cmd/server -port 9000
```

## Project Structure

```
mediago-player/
├── ui/                      # Frontend application (responsive React app)
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── lib/           # Utility functions
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Entry point
│   ├── components.json    # shadcn/ui configuration
│   └── package.json       # Frontend dependencies
├── assets/                 # Static assets embedded into Go binary
│   ├── desktop/           # Built UI assets (git-ignored, copied from ui/dist)
│   ├── mobile/            # Built UI assets (git-ignored, same as desktop for compatibility)
│   └── embed.go           # Embeds frontend dist folders using //go:embed
├── cmd/server/            # Go HTTP server entry point
│   └── main.go            # Server startup and configuration
├── internal/              # Go private packages
│   ├── http/             # Router, middleware, and static file serving
│   │   ├── middleware/   # CORS, request ID, etc.
│   │   ├── router.go     # Main router configuration
│   │   └── static.go     # SPA static file handler
│   ├── video/            # Video domain (handler/service/types pattern)
│   └── util/             # Shared utilities (graceful shutdown, etc.)
├── gulpfile.ts           # Build automation tasks (TypeScript + Gulp)
├── turbo.json            # Turborepo pipeline configuration
└── pnpm-workspace.yaml   # pnpm workspace definition
```

## Key Patterns

### Adding New Domains (Go Backend)

1. Create directory under `internal/` (e.g., `internal/product/`)
2. Define domain types in `types.go`
3. Implement service interface in `service.go`
4. Create HTTP handlers in `handler.go` with `RegisterRoutes(rg *gin.RouterGroup)` function
5. Register routes in [internal/http/router.go](internal/http/router.go) under the `/api/v1` group

See [internal/video/](internal/video/) for reference implementation.

### Embedded Static Files

Frontend builds are embedded into the Go binary at compile time. The build pipeline:
1. `pnpm run gulp build` runs the UI build (`pnpm build` in `ui/`) and syncs assets
2. The Gulp build task copies `ui/dist/` to the embedded assets directory (git-ignored)
3. Go's `//go:embed` directive in [assets/embed.go](assets/embed.go) embeds these directories
4. [internal/http/static.go](internal/http/static.go) provides `NewSPAHandler()` for serving embedded files with:
   - Automatic MIME type detection (using `mime.TypeByExtension` and content-based detection)
   - SPA routing fallback to `index.html` for client-side routes
   - Path prefix support (e.g., `/m/` for mobile path)
   - Security: Path traversal protection via `path.Clean()`

**Important**: The `assets/desktop/` and `assets/mobile/` directories are generated during build and should not be committed to git. They are populated by the Gulp build pipeline which copies the `ui/dist/` folder.

**Note**: The same responsive UI is served at both `/` and `/m/` paths for backward compatibility. The UI automatically adapts to screen size using Tailwind CSS responsive utilities.

### Vite Configuration

The frontend app uses rolldown-vite instead of standard Vite for better performance. This is configured via pnpm overrides in the root package.json. The UI includes Tailwind CSS v4 with the @tailwindcss/vite plugin for optimal styling performance.

## Testing

```bash
# Backend tests
go test ./...

# Test specific package
go test ./internal/user

# Test with coverage
go test -cover ./...

# Frontend tests (when added)
cd ui && pnpm test
```
