# @mediago/extension

A Chromium browser extension (Manifest V3) that sniffs downloadable
video / audio resources on every page you visit and sends the picked
ones to your MediaGo server in one click — works with both the
**Desktop** build (auto-detected) and the self-hosted **Docker**
build (filled in manually).

Detection rules live in `@mediago/shared-common` and are shared with
the Electron sniffing helper, so the set of URLs detected in the
browser matches what the desktop in-app browser would see.

## Features (P0)

- MV3, no external runtimes, vanilla TS + tiny CSS
- `chrome.webRequest.onSendHeaders` wiretap on `<all_urls>`
- Per-tab source list with badge count
- Auto-detects a local MediaGo Desktop on `127.0.0.1:9900` at install /
  browser startup (no onboarding needed for desktop users)
- Options page for Docker users to point at a custom URL + API key
- One-click "import all" / per-row "import" to MediaGo's
  `POST /api/downloads`

## Dev

```bash
pnpm --filter @mediago/extension dev
```

This runs Vite with `@crxjs/vite-plugin` and writes a live-reloading
build to `packages/mediago-extension/dist`. Load the `dist/` folder as
an unpacked extension (see **Install** below).

## Build

```bash
pnpm --filter @mediago/extension build
```

Outputs the production bundle to `packages/mediago-extension/dist/`.

## Install (end users)

1. Download / clone the built `dist/` directory (or `.zip` it up).
2. Open `chrome://extensions` (Edge / Brave: `edge://extensions` /
   `brave://extensions`).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `dist/` directory.
5. The 🧲 MediaGo icon should appear in your toolbar.

### Desktop (auto)

If MediaGo Desktop is already running, nothing else to do — the
extension probes `http://127.0.0.1:9900/healthy` on install / startup
and self-configures.

### Docker / self-hosted

1. Click the extension icon → ⚙️ (bottom right) to open Options.
2. Fill in your server URL, e.g. `http://your-host:8899`.
3. Fill in the **API Key** you configured with `--enable-auth`.
4. Click **测试连接**. Green = ready. Click **保存**.

## Use

1. Browse to a page that plays / exposes video (Bilibili, a live-stream
   site, a random MP4 link, etc.).
2. As requests fly by, the extension icon shows a red badge with a
   count — those are the captured sources.
3. Click the icon to open the popup, pick items, hit **导入**.
4. Tasks show up in the MediaGo download list and start downloading.

## Architecture

```
src/
  background/      service_worker — sniffer + probe + HTTP client
    index.ts         registers listeners synchronously at top level
    sniffer.ts       chrome.webRequest.onSendHeaders → matched sources
    storage.ts       chrome.storage.local (settings) + session (tabs)
    probe.ts         auto-detect Desktop on install / startup
    mediago-client.ts  POST /api/downloads, GET /healthy
    messages.ts      popup / options → bg message router
  popup/           extension popup — per-tab source list + import
  options/         extension options page — server URL + API key
  shared/          types & constants shared across the 3 surfaces
```

## Permissions

- `webRequest` — read outbound request URLs + headers for matching
- `tabs` — look up page title / URL for the currently-active tab
- `storage` — save user settings + per-tab sources
- `host_permissions: <all_urls>` — listen across every site

No content scripts, no DOM injection, no remote code. The extension
never sends anything to third parties; its only outbound traffic goes
to the MediaGo server URL configured in Options.
