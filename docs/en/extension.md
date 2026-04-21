---
layout: doc
outline: deep
---

# Browser Extension

MediaGo ships a lightweight Manifest V3 browser extension that sniffs downloadable video / audio URLs on any site and sends them to MediaGo in one click.

## What it does

- Detects HLS / m3u8 streams and direct `.mp4` / `.flv` / `.mov` media files across every page you browse
- Recognises Bilibili video pages and YouTube video / short / live / embed URLs
- Shows the number of detected resources on the toolbar icon badge
- One-click import single or all sources to MediaGo (Desktop or self-hosted)

## Install

The extension is not on the Chrome Web Store yet, so it must be "loaded unpacked". The MediaGo Desktop installer already bundles the extension — you don't need to download it separately.

1. Open the MediaGo Desktop app
2. Go to **Settings → More Settings → Browser extension directory** and click the button to open the extension folder
3. In Chrome / Edge, visit `chrome://extensions/`
4. Toggle **Developer mode** in the top-right
5. Click **Load unpacked** and pick the folder you opened in step 2
6. You should see the extension icon appear in the toolbar — pin it for easy access

## Dispatch modes

Click the gear icon in the popup to open the options page, then pick one mode:

| Mode                               | When to use                                                                   | Requires                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Desktop · Schema protocol**      | MediaGo Desktop installed locally; browser allowed to hand off protocol links | No config; first call shows "Open MediaGo?" dialog — tick "Always allow" for silent dispatch afterwards |
| **Desktop · HTTP local** (default) | MediaGo Desktop installed AND running                                         | No config; extension connects to `127.0.0.1:39719`                                                      |
| **Docker / Self-hosted · HTTP**    | Connect to a remote MediaGo server (e.g. Docker deployment)                   | Server URL required; API Key if the server runs with `--enable-auth`                                    |

> **The extension never silently falls back.** Once a mode is chosen, any failure is reported as-is — switch modes manually on the options page if you need to.

## Import behaviour

Two toggles on the options page under **Import Behaviour**:

- **Start downloading immediately** — On: the task is queued AND started. Off: it's only added to the list, waiting for the user to start it. Applies to both Schema and HTTP modes.
- **Silent import (Schema mode)** — On: the deeplink carries `silent=1` so MediaGo creates the task immediately. Off: MediaGo opens its download form prefilled with the sniffed name / type / folder for review. Only takes effect in Schema mode; HTTP mode is always silent.

## Interface language

The extension supports Chinese and English. By default it follows the browser UI language (Chinese browser → Chinese UI). You can force a choice on the options page under **Interface Language**: Follow system / 中文 / English.

## Troubleshooting

### "Browser extension directory" button does nothing

- **Development**: run `pnpm -F @mediago/extension build` first to produce the dist
- **Production**: reinstall MediaGo — the `resources/extension/` folder should exist in the app install directory

### Desktop · HTTP test connection fails

- Verify MediaGo Desktop is running
- Verify port `39719` isn't taken by another process (`netstat -ano | findstr 39719` on Windows)
- If you also run MediaGo in web/server mode locally, note that standalone Go Core uses `9900`, not `39719`

### Schema mode prompts every time

On the first hand-off Chrome shows "Open MediaGo-community?" — tick **Always allow**. Subsequent calls are silent.

### Schema mode fails on batch import

Schema dispatches a single task per call — a fundamental limitation of protocol hand-offs. Switch to HTTP mode (Desktop or Docker) for batch imports.
