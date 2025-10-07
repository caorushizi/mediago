# Electron Main Process

The Electron main process that handles the desktop application lifecycle, window management, and system integration for MediaGo.

## Overview

This package contains the Electron main process code that:
- Creates and manages application windows
- Handles system tray integration
- Manages application menus and shortcuts
- Provides native file system access
- Handles auto-updates and app packaging
- Communicates with the frontend renderer process

## Key Features

- **Window Management**: Creates and manages the main application window
- **System Integration**: System tray, notifications, and OS-specific features
- **Security**: Implements secure IPC communication with the renderer
- **Auto-Updates**: Built-in update mechanism for the desktop app
- **Cross-Platform**: Supports Windows, macOS, and Linux

## Technologies

- **Electron**: Desktop application framework
- **Node.js**: Backend runtime for main process
- **IPC**: Inter-process communication with frontend
- **Native APIs**: File system, OS integration

## Development

```bash
# Start development mode
pnpm dev

# Build electron app
pnpm build:electron

# Package for release
pnpm release

# Create beta build
pnpm beta
```

## Architecture

The electron app loads the frontend React application in a BrowserWindow and provides native desktop functionality through Electron's main process APIs.
