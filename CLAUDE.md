# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo is a cross-platform video downloader supporting m3u8/HLS streams. It ships as both an Electron desktop app and a Node.js web server, sharing a single React UI. The codebase is a pnpm monorepo orchestrated by Turborepo.

## Common Commands

```bash
pnpm install                # Install all dependencies (run once per clone)
pnpm dev:electron           # Start Electron desktop dev environment (HMR)
pnpm dev:server             # Start Koa web server dev environment (HMR)
pnpm build:electron         # Production build for Electron
pnpm build:server           # Production build for server
pnpm lint                   # Lint with oxlint
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Format with oxfmt
pnpm format:check           # Check formatting without modifying
pnpm check                  # Full check: lint + format + type check
pnpm type:check             # TypeScript type checking via Turborepo
pnpm pack:electron          # Build + package Electron distributable
pnpm pack:server            # Build + package server distributable
```

Commits use Conventional Commits format (e.g. `feat(electron): add queue UI`). Use `pnpm commit` for Commitizen-guided commits.

## Architecture

### Monorepo Layout

- **`apps/electron/`** - Electron main process (tsdown build, inversify DI, TypeORM + better-sqlite3)
- **`apps/server/`** - Koa 3 web server backend (tsdown build, inversify DI, TypeORM + better-sqlite3, socket.io)
- **`apps/ui/`** - Shared React 19 frontend (Vite 8, Ant Design 6, Zustand, TailwindCSS 4, socket.io-client, i18next)
- **`packages/shared/common/`** - Platform-agnostic shared types and utilities
- **`packages/shared/node/`** - Node.js-specific shared code (uses @mediago/core, inversify, typeorm)
- **`packages/shared/browser/`** - Browser-specific shared code
- **`packages/electron-preload/`** - Electron preload scripts for IPC bridge
- **`packages/browser-extension/`** - Browser extension (Lit web components)
- **`packages/config/`** - Shared TypeScript configs (tsconfig.base, tsconfig.app, tsconfig.node)
- **`docs/`** - VitePress documentation (Chinese, English, Japanese)

### Multi-Target Build

The `APP_TARGET` env var (`electron` | `server`) controls which backend the UI builds against. Both targets share the same React UI but connect via different transports (Electron IPC vs HTTP/WebSocket).

### Key Patterns

- **Dependency Injection**: inversify with `@inversifyjs/binding-decorators` throughout both backends
- **ORM**: TypeORM with better-sqlite3 for local database
- **State Management**: Zustand in the UI
- **TypeScript**: Strict mode with experimental decorators and decorator metadata enabled
- **Module format**: ES Modules everywhere except server output (CommonJS)

## Tooling

- **Package manager**: pnpm 10.15.0 (enforced via `packageManager` field)
- **Build orchestration**: Turborepo
- **App bundling**: tsdown for Node/Electron, Vite 8 for UI
- **Linter**: oxlint (config in `.oxlintrc.json`)
- **Formatter**: oxfmt (config in `.oxfmtrc.json`)
- **Pre-commit**: husky + lint-staged (runs oxlint --fix + oxfmt --write on staged files)
- **Electron packaging**: electron-builder

## Style Conventions

- TypeScript, ES modules, 2-space indentation, UTF-8, LF endings
- Components: PascalCase. Utilities: camelCase. Constants: SCREAMING_SNAKE_CASE
- UI port: 8555 (strict)
