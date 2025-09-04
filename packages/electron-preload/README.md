# @mediago/electron-preload

Electron preload script package for MediaGo application.

## Overview

This package contains the preload script that bridges the communication between the Electron main process and renderer process. It exposes safe APIs to the frontend through Electron's `contextBridge`.

## Features

- Safe IPC communication between main and renderer processes
- Type-safe API definitions
- Centralized preload logic for better maintainability
- Optimized build with esbuild

## Usage

In your Electron main process:

```typescript
import { join } from "path";
import { BrowserWindow } from "electron";

const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: join(__dirname, "../node_modules/@mediago/electron-preload/dist/preload.js"),
  },
});
```

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm types
```

## API

The preload script exposes all Electron APIs through `window.electron` object, providing type-safe access to:

- File system operations
- Download management
- Browser window controls
- Settings management
- And much more...

See the `ElectronApi` type definition for complete API reference.