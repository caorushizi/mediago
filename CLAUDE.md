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
│   ├── main/               # Electron main process (Node.js backend for desktop app)
│   ├── renderer/           # Frontend UI (React + Vite, used for both Electron renderer and web)
│   ├── backend/            # Standalone web server (Koa.js, for Docker/web deployments)
│   ├── mobile/             # Mobile-specific components
│   └── plugin/             # Browser plugin for resource detection
├── packages/               # Shared packages
│   ├── shared/             # Shared utilities and types across apps
│   └── config/             # Shared configuration (tsconfig, build configs)
└── tools/                  # Build tools and utilities
    └── scripts/            # Custom build scripts
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

# Build all apps (with Turbo caching and parallelization)
pnpm build

# Individual app builds
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

# Type checking (across all packages)
pnpm types          # All packages type checking
pnpm types:renderer # Renderer package types
pnpm types:watch    # Watch mode for main package

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

## Build Scripts

Custom build scripts are located in `tools/scripts/`:
- `tools/scripts/dev.ts` - Development build (builds plugin and mobile only)
- `tools/scripts/build.ts` - Production build (builds all packages in order)
- `tools/scripts/web.ts` - Web release build

## Package-Specific Commands

Run commands in specific packages using Turbo filters:
```bash
# Single package
turbo build --filter=renderer
turbo dev --filter=main

# Multiple packages
turbo lint --filter=main --filter=renderer

# All packages in apps/
turbo build --filter="apps/*"
```

## Testing

No specific test commands are configured in the root package.json. Check individual app packages for testing setup.

## Code Style

- **Biome** for unified linting and formatting
- Spell checking with cspell
- Commitizen for conventional commits
- Husky for pre-commit hooks
- Configuration managed centrally in `packages/config`

## Architecture Notes

- **App-centric design**: Main applications in `apps/`, shared code in `packages/`
- **Unified UI**: `renderer` package provides UI for both Electron and web platforms
- **Independent services**: `backend` can run standalone in Docker
- **Dependency injection**: Uses Inversify across the codebase
- **Data persistence**: TypeORM with SQLite
- **Real-time communication**: Socket.io between frontend and backend
- **Cross-platform**: Electron for desktop, web for browser access