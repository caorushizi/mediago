# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo is a multi-platform video downloader application that supports m3u8 video extraction and streaming media downloads. It provides:
- Desktop application (Electron-based)
- Web interface for browser usage
- Mobile support
- Docker deployment option

## Architecture

This is a monorepo using pnpm workspaces with the following packages:

- **main** - Electron main process (Node.js backend for desktop app)
- **renderer** - Frontend UI (React + Vite, used for both Electron renderer and web)
- **backend** - Standalone web server (Koa.js, for Docker/web deployments)
- **shared** - Shared utilities and types across packages
- **plugin** - Browser plugin for resource detection
- **mobile** - Mobile-specific components

## Key Technologies

- **Frontend**: React 18, Vite, Antd, TailwindCSS, Shadcn/ui, Zustand
- **Backend**: Electron, Koa.js, TypeORM, Better-sqlite3
- **Build**: esbuild, Gulp, TypeScript
- **DI**: Inversify for dependency injection
- **Database**: SQLite with TypeORM

## Development Commands

```bash
# Install dependencies
pnpm i

# Development (starts all packages)
pnpm dev

# Web-only development
pnpm dev:web

# Build all packages
pnpm build

# Individual package builds
pnpm build:main      # Electron main process
pnpm build:renderer  # Frontend (Electron renderer)
pnpm build:web       # Frontend (web version)
pnpm build:backend   # Standalone web server
pnpm build:plugin    # Browser plugin
pnpm build:mobile    # Mobile components

# Release builds
pnpm release         # Build and package Electron app
pnpm beta           # Build and create beta package
pnpm build:web-release # Build web version for Docker

# Type checking
pnpm types          # Main package types
pnpm types:renderer # Renderer package types
pnpm types:watch    # Watch mode for main package

# Docker
pnpm build:docker   # Build Docker image
docker run -d --name mediago -p 8899:8899 -v mediago-data:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago

# Code quality
pnpm spellcheck     # Run spell checker
pnpm lint-staged    # Run lint-staged on all packages
```

## Build Scripts

The build process is orchestrated by custom scripts in the `scripts/` directory:
- `scripts/dev.ts` - Development build (builds plugin and mobile only)
- `scripts/build.ts` - Production build (builds all packages in order)
- `scripts/web.ts` - Web release build

## Package-Specific Commands

Each package has its own scripts. Key patterns:
- `pnpm -F <package> <command>` to run commands in specific packages
- Most packages support `dev`, `build`, `types`, and `lint-staged`

## Testing

No specific test commands are configured in the root package.json. Check individual packages for testing setup.

## Code Style

- ESLint configured with TypeScript support
- Prettier integration in individual packages
- Spell checking with cspell
- Commitizen for conventional commits
- Husky for pre-commit hooks

## Architecture Notes

- Uses Inversify for dependency injection across the codebase
- TypeORM with SQLite for data persistence
- Socket.io for real-time communication between frontend and backend
- Electron for desktop app packaging
- Express/Koa.js servers embedded in both main process and standalone backend
- Shared package contains common types and utilities used across all packages