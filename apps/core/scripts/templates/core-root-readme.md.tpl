# {{npmScope}}/{{corePackageName}}

MediaGo Player is a hybrid Go+React video player server that combines a powerful Go backend with a responsive React frontend.

_Current package version: {{version}}_

## Installation

```bash
npm install {{npmScope}}/{{corePackageName}}
# or
pnpm add {{npmScope}}/{{corePackageName}}
# or
yarn add {{npmScope}}/{{corePackageName}}
```

## Usage

### As a CLI

```bash
npx {{npmScope}}/{{corePackageName}}
```

### With Custom Flags

```bash
npx {{npmScope}}/{{corePackageName}} -host 0.0.0.0 -port 8080
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
- Windows (x64 and ARM64)

## Features

- Hybrid Go backend with embedded React frontend
- RESTful API with Swagger documentation
- Responsive UI that adapts to desktop and mobile
- Built-in video player with XGPlayer
- Modern UI with shadcn/ui components

## License

ISC

## Repository

https://github.com/mediago/mediago-core
