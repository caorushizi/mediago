# @mediago/player

MediaGo Player is a hybrid Go+React video player server that combines a powerful Go backend with a responsive React frontend.

## Installation

```bash
npm install @mediago/player
# or
pnpm add @mediago/player
# or
yarn add @mediago/player
```

## Usage

### As a CLI

```bash
npx @mediago/player
```

### With Custom Flags

```bash
npx @mediago/player -host 0.0.0.0 -port 8080
```

### Available Flags

- `-host` - Server host address (default: `0.0.0.0`)
- `-port` - Server port (default: `8080`)
- `-video-root` - Path to video directory
- `-enable-docs` - Enable Swagger API documentation at `/docs`

### Environment Variables

You can also configure the server using environment variables:

- `HTTP_ADDR` - Server address in `host:port` format
- `GIN_MODE` - Gin mode: `debug`, `release`, or `test`
- `VIDEO_ROOT_PATH` - Local folder for video files

## Supported Platforms

This package automatically installs the correct binary for your platform:

- macOS (x64 and ARM64)
- Linux (x64 and ARM64)
- Windows (x64)

## Features

- Hybrid Go backend with embedded React frontend
- RESTful API with Swagger documentation
- Responsive UI that adapts to desktop and mobile
- Built-in video player with XGPlayer
- Modern UI with shadcn/ui components

## License

ISC

## Repository

https://github.com/mediago/mediago-player
