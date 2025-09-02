# Web API

The standalone Koa.js-based web server that provides HTTP APIs and serves the frontend for browser-based access to MediaGo.

## Overview

This package contains the web API server that:
- Provides RESTful APIs for video downloading operations
- Serves the frontend React application for web access
- Handles file uploads and downloads
- Manages video processing and conversion
- Provides real-time updates via Socket.io
- Can run independently for Docker deployments

## Key Features

- **RESTful APIs**: Complete HTTP API for all download operations
- **Static File Serving**: Serves the built frontend application
- **Real-time Communication**: Socket.io server for live updates
- **File Management**: Handles video files, thumbnails, and metadata
- **Docker Support**: Designed for containerized deployments
- **CORS Support**: Configured for cross-origin requests
- **Database Integration**: TypeORM with SQLite for data persistence

## Technologies

- **Koa.js**: Modern Node.js web framework
- **TypeORM**: Database ORM for data management
- **SQLite**: Lightweight database (Better-sqlite3)
- **Socket.io**: Real-time bidirectional communication
- **Inversify**: Dependency injection container
- **TypeScript**: Type-safe server development
- **Node.js**: Server runtime environment

## Development

```bash
# Start development mode (with frontend)
pnpm dev:web

# Build webapi
pnpm build:backend

# Run in Docker
pnpm build:docker
docker run -d --name mediago -p 8899:8899 -v mediago-data:/root/mediago caorushizi/mediago:latest
```

## Architecture

The webapi server:
1. Serves the frontend React application on the root path
2. Provides `/api/*` endpoints for video operations
3. Uses Socket.io for real-time progress updates
4. Stores data in SQLite database via TypeORM
5. Can run standalone or alongside the Electron desktop app

## API Endpoints

The server provides comprehensive REST APIs for:
- Video URL processing and metadata extraction
- Download queue management
- File operations and storage
- Settings and configuration management
- Real-time status updates via WebSocket
