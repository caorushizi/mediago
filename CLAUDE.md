# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaGo is a multi-platform video downloader application that supports m3u8 video extraction and streaming media downloads. It provides:
- Desktop application (Electron-based)
- Web interface for browser usage
- Mobile support
- Docker deployment option

## Architecture

This is a monorepo using **Turborepo + pnpm workspaces** with the following structure:

```
mediago/
├── apps/                    # Applications
│   ├── backend-electron/   # Electron main process (Node.js backend for desktop app)
│   ├── frontend-main/      # Frontend UI (React + Vite, used for both Electron renderer and web)
│   ├── backend-web/        # Standalone web server (Koa.js, for Docker/web deployments)
│   └── frontend-mobile/    # Mobile-specific components
└── packages/               # Shared packages
    ├── shared/             # Shared utilities and types across apps
    ├── shared-common/      # Common utilities for all platforms
    ├── shared-node/        # Node.js specific utilities
    ├── shared-browser/     # Browser-specific utilities
    ├── config/             # Shared configuration (tsconfig, build configs)
    ├── electron-preload/   # Electron preload scripts
    └── extension/          # Browser extension for resource detection
```

## Key Technologies

- **Build System**: Turborepo for build orchestration and caching
- **Package Management**: pnpm workspaces
- **Frontend**: React 18, Vite, Antd, TailwindCSS, Shadcn/ui, Zustand
- **Backend**: Electron, Koa.js, TypeORM, Better-sqlite3
- **Build Tools**: esbuild, Gulp, TypeScript, Turbo
- **Code Quality**: Biome (linting + formatting)
- **DI**: Inversify for dependency injection
- **Database**: SQLite with TypeORM

## Development Commands

```bash
# Install dependencies
pnpm i

# Development (starts all apps with Turbo)
pnpm dev

# Web-only development
pnpm dev:web

# Electron-only development
pnpm dev:electron

# Build all apps (with Turbo caching and parallelization)
pnpm build

# Individual app builds
pnpm build:extra       # Build plugin and mobile components
pnpm build:web-release # Build web version for Docker

# Release builds
pnpm release         # Build and package Electron app
pnpm beta           # Build and create beta package
pnpm build:docker   # Build Docker image

# Type checking (across all packages)
pnpm types          # All packages type checking
pnpm types:watch    # Watch mode for type checking

# Code quality (powered by Turbo + Biome)
pnpm lint           # Lint all packages
pnpm lint:fix       # Auto-fix linting issues
pnpm format         # Format all code
pnpm spellcheck     # Run spell checker

# Docker
pnpm build:docker   # Build Docker image
docker run -d --name mediago -p 8899:8899 -v mediago-data:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago
```

## Turborepo Benefits

- **Fast builds**: Incremental builds and intelligent caching
- **Parallel execution**: Multiple packages build simultaneously
- **Task dependencies**: Automatic build order based on dependencies
- **Remote caching**: Optional remote cache for team efficiency

## Turborepo Build Management

All build tasks are managed by Turborepo with intelligent caching and parallel execution:
- **Dependency-based builds**: Packages build in the correct order based on dependencies
- **Incremental builds**: Only rebuild changed packages and their dependents
- **Parallel execution**: Multiple packages can build simultaneously
- **Smart caching**: Avoid rebuilding unchanged code

## Package-Specific Commands

Run commands in specific packages using Turbo filters:
```bash
# Single package
turbo build --filter=frontend-main
turbo dev --filter=backend-electron

# Multiple packages
turbo lint --filter=backend-electron --filter=frontend-main

# All packages in apps/
turbo build --filter="apps/*"
```

## Testing

No specific test commands are configured in the root package.json. Check individual app packages for testing setup.

## Code Style

- **Biome** for unified linting and formatting (configured in biome.json)
- Spell checking with cspell
- Commitizen for conventional commits with emoji support
- Husky for pre-commit hooks
- Configuration managed centrally in `packages/config`

## Architecture Notes

- **App-centric design**: Main applications in `apps/`, shared code in `packages/`
- **Unified UI**: `frontend-main` package provides UI for both Electron and web platforms
- **Independent services**: `backend-web` can run standalone in Docker
- **Dependency injection**: Uses Inversify across the codebase
- **Data persistence**: TypeORM with SQLite
- **Real-time communication**: Socket.io between frontend and backend
- **Cross-platform**: Electron for desktop, web for browser access

## Build System Details

- **Frontend (Vite)**: Uses React + SWC for fast builds, outputs to different directories based on target (web/electron)
- **Backend (Gulp + esbuild)**: Custom build pipeline for Node.js backends with TypeScript compilation
- **Electron**: Complex build process with main/renderer separation and native dependencies
- **Hot reload**: Development mode supports hot reload for both web and electron targets

## Dependency Management

- **Workspace dependencies**: Uses `workspace:*` protocol for internal package references
- **Native dependencies**: Special handling for Electron native modules (better-sqlite3, node-pty)
- **Build dependencies**: Only build dependencies are installed in production (configured in pnpm settings)