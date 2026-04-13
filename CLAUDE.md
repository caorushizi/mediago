# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo is a cross-platform video downloader supporting m3u8/HLS streams. The codebase is a pnpm monorepo with three products:

1. **Desktop app** (`apps/electron` + `apps/ui`) — Electron wrapper that launches Go Core as a subprocess
2. **Web server** (`apps/server` + `apps/ui`) — Node.js launcher that spawns Go Core as a subprocess
3. **Video player** (`apps/core` + `apps/player-ui`) — Player UI embedded in Go Core for video playback

All three products share the Go Core backend (`apps/core`) for download orchestration.

## Common Commands

```bash
pnpm install                # Install all dependencies (run once per clone)
pnpm dev:electron           # Start Electron desktop dev environment (HMR)
pnpm dev:server             # Start server dev environment (HMR)
pnpm build:electron         # Production build for Electron
pnpm build:web              # Build UI only (server mode)
pnpm core:dev               # Start Go Core dev server (port 9900)
pnpm core:build             # Compile Go Core binary
pnpm player:dev             # Start Player dev (alias for core:dev)
pnpm player:build           # Build Player (alias for core:build)
pnpm deps:download          # Download third-party tools (ffmpeg, BBDown, etc.)
pnpm deps:download:all      # Download tools for all platforms
pnpm lint                   # Lint with oxlint
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Format with oxfmt
pnpm format:check           # Check formatting without modifying
pnpm check                  # Full check: lint + format + type check
pnpm type:check             # TypeScript type checking via Turborepo
pnpm pack:electron          # Build + package Electron distributable
```

Commits use Conventional Commits format (e.g. `feat(electron): add queue UI`).

## Architecture

### Monorepo Layout

**Apps:**

- **`apps/core/`** — Go (Gin) REST API backend for download orchestration. Runs on port 9900. Uses SQLite (GORM), SSE for real-time events, PTY for capturing download tool output. Built with Gulp + Go cross-compilation.
- **`apps/electron/`** — Electron main process (tsdown build, inversify DI). Launches Go Core via `@mediago/service-runner`.
- **`apps/server/`** — Node.js launcher (tsdown build). Spawns Go Core via `@mediago/service-runner`.
- **`apps/ui/`** — Shared React 19 frontend (Vite 8, Ant Design 6, Zustand, TailwindCSS 4, i18next). Used by both Electron and server targets.
- **`apps/player-ui/`** — React 19 frontend for player (Vite 8, shadcn/ui, video.js, TailwindCSS 4). Built assets are embedded into Go Core via `//go:embed`.

**Packages:**

- **`packages/shared/common/`** — Platform-agnostic shared types, constants, and utilities
- **`packages/core-sdk/`** — TypeScript SDK for Go Core REST API (Axios, SSE via eventsource)
- **`packages/electron-preload/`** — Electron preload scripts for IPC bridge
- **`packages/browser-extension/`** — Browser extension (Lit web components)
- **`docs/`** — VitePress documentation (Chinese, English, Japanese)

### Multi-Target Build

The `APP_TARGET` env var (`electron` | `server`) controls which backend the UI builds against. Both targets share the same React UI but connect via different transports:

- **Electron**: IPC bridge (preload) + Go Core direct (via `@mediago/core-sdk`)
- **Server/Web**: HTTP/WebSocket + Go Core direct (via `@mediago/core-sdk`)

The UI adapter layer (`apps/ui/src/hooks/adapters/`) abstracts this: `electron.ts` provides IPC bridge in desktop mode, `platform-stubs.ts` provides no-op stubs in web mode, and `index.ts` exports `platformApi` which selects the appropriate adapter.

### Key Patterns

- **Go Core as subprocess**: Both Electron and server apps launch Go Core via `@mediago/service-runner`, which manages the process lifecycle and port allocation
- **Dependency Injection**: inversify with `@inversifyjs/binding-decorators` in Electron backend
- **State Management**: Zustand in the UI
- **Real-time events**: Go Core emits SSE events (`/api/events`); the UI's `api/events.ts` subscribes and dispatches to React via a listener pattern
- **TypeScript**: Strict mode with experimental decorators and decorator metadata enabled
- **Module format**: ES Modules everywhere

## Tooling

- **Package manager**: pnpm 10.15.0 (enforced via `packageManager` field)
- **Build orchestration**: Turborepo
- **App bundling**: tsdown for Node/Electron, Vite 8 for UI apps
- **Go builds**: Gulp orchestrating `go build` / `go run` in `apps/core`
- **Linter**: oxlint (config in `.oxlintrc.json`)
- **Formatter**: oxfmt (config in `.oxfmtrc.json`)
- **Pre-commit**: husky + lint-staged (runs oxlint --fix + oxfmt --write on staged files)
- **Electron packaging**: electron-builder

## Style Conventions

- TypeScript, ES modules, 2-space indentation, UTF-8, LF endings
- Components: PascalCase. Utilities: camelCase. Constants: SCREAMING_SNAKE_CASE
- UI port: 8555 (strict). Go Core port: 9900. Player UI port: 8556
