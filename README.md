# MediaGo Player

MediaGo Player is a hybrid application combining a Go backend server with a responsive React frontend application for video playback and management.

## Features

- Hybrid Go + React architecture
- RESTful API with Swagger documentation
- Responsive UI that adapts to desktop and mobile
- Built-in video player with XGPlayer
- Modern UI with shadcn/ui components and Tailwind CSS
- Embedded static assets for single-binary distribution

## Installation

### Via npm (Recommended)

Install the package globally or use directly with npx:

```bash
# Install globally
npm install -g @mediago/player

# Run directly without installing
npx @mediago/player

# Or with pnpm
pnpm dlx @mediago/player

# Or with yarn
yarn dlx @mediago/player
```

The package automatically installs the correct binary for your platform (macOS, Linux, or Windows on x64 or ARM64).

### From Source

```bash
# Clone the repository
git clone https://github.com/mediago/mediago-player.git
cd mediago-player

# Install dependencies
pnpm install

# Build and run
pnpm run gulp build
pnpm run gulp run
```

## Usage

### Basic Usage

Start the server with default settings:

```bash
npx @mediago/player
```

The server will start on `http://0.0.0.0:8080` by default.

### Custom Configuration

Use command-line flags to customize the server:

```bash
# Specify host and port
npx @mediago/player -host localhost -port 3000

# Set video directory
npx @mediago/player -video-root "/path/to/videos"

# Enable API documentation
npx @mediago/player -enable-docs

# Combine multiple flags
npx @mediago/player -host 0.0.0.0 -port 8080 -video-root "/media/videos" -enable-docs
```

### Environment Variables

Alternatively, configure using environment variables:

```bash
export HTTP_ADDR="0.0.0.0:8080"
export GIN_MODE="release"
export VIDEO_ROOT_PATH="/path/to/videos"
npx @mediago/player
```

Available environment variables:
- `HTTP_ADDR` - Server address in `host:port` format (default: `0.0.0.0:8080`)
- `GIN_MODE` - Gin mode: `debug`, `release`, or `test` (default: `release`)
- `VIDEO_ROOT_PATH` - Local folder for video files

### Command-Line Flags

- `-host` - Server host address (e.g., `0.0.0.0` for LAN access, `localhost` for local only)
- `-port` - Server port (e.g., `8080`, `3000`)
- `-video-root` - Path to local video directory
- `-enable-docs` - Enable Swagger API documentation at `/docs/index.html`

**Priority**: Command-line flags > Environment variables > Defaults

## API Documentation

When running with `-enable-docs`, Swagger documentation is available at:
- Swagger UI: `http://localhost:8080/docs/index.html`
- JSON Spec: `http://localhost:8080/docs/doc.json`

## Development

This project uses a monorepo structure with pnpm workspaces and Turborepo.

### Prerequisites

- Go 1.21 or later
- Node.js 18 or later
- pnpm 8 or later
- Gulp CLI (installed locally via `pnpm install`)

### Development Workflow

```bash
# Install dependencies
pnpm install

# Start development servers (backend + frontend)
pnpm dev
# or
pnpm run gulp dev

# Run backend tests
pnpm run gulp test

# Build for production (frontend + backend)
pnpm run gulp build

# Generate Swagger documentation
pnpm run gulp docs
```

### Project Structure

```
mediago-player/
├── cmd/server/          # Go HTTP server entry point
├── internal/            # Go private packages
│   ├── http/           # Router, middleware, static serving
│   ├── video/          # Video domain logic
│   └── util/           # Shared utilities
├── assets/             # Embedded static files (UI build output)
├── ui/                 # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   └── lib/        # Utility functions
│   └── package.json
├── npm/                # npm package distribution
│   ├── @mediago/player             # Main package
│   ├── @mediago/player-darwin-x64  # macOS Intel binary
│   ├── @mediago/player-darwin-arm64 # macOS ARM binary
│   ├── @mediago/player-linux-x64   # Linux x64 binary
│   ├── @mediago/player-linux-arm64 # Linux ARM binary
│   └── @mediago/player-win32-x64   # Windows x64 binary
├── scripts/            # Build and release scripts
├── docs/               # Documentation
├── gulpfile.ts         # Build and automation tasks (TypeScript)
└── package.json        # Root package (development)
```

## Building from Source

### Build UI Only

```bash
cd ui
pnpm build
```

### Build Backend Only

```bash
pnpm run gulp build
# Output: dist/mediago-player(.exe)
```

### Cross-Compilation

Build binaries for all platforms:

```bash
pnpm run gulp release:npm:build-binaries
```

This creates binaries for:
- macOS (x64 and ARM64)
- Linux (x64 and ARM64)
- Windows (x64)

## Releasing

For maintainers publishing to npm, see [docs/releasing.md](docs/releasing.md) for the complete release process.

Quick release:

```bash
# Dry run (build only)
VERSION=1.2.3 pnpm run gulp release:npm

# Publish to npm
PUBLISH=true VERSION=1.2.3 pnpm run gulp release:npm
```

## Supported Platforms

The npm package `@mediago/player` includes prebuilt binaries for:

- macOS (Intel): `@mediago/player-darwin-x64`
- macOS (Apple Silicon): `@mediago/player-darwin-arm64`
- Linux (x64): `@mediago/player-linux-x64`
- Linux (ARM64): `@mediago/player-linux-arm64`
- Windows (x64): `@mediago/player-win32-x64`
- Windows (ARM64): `@mediago/player-win32-arm64`

The correct binary is automatically selected during installation based on your platform.

## Technology Stack

### Backend
- Go 1.21+
- Gin web framework
- Swagger/OpenAPI documentation
- Embedded file system for static assets

### Frontend
- React 18.3
- TypeScript 5.9
- Vite 7 (rolldown-vite fork)
- shadcn/ui components (Radix UI)
- Tailwind CSS 4
- XGPlayer for video playback
- Lucide React icons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Repository

https://github.com/mediago/mediago-player
