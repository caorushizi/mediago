<div align="center">
  <h1>MediaGo</h1>
  <a href="https://downloader.caorushizi.cn/en/guides.html?form=github">Quick Start</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/en?form=github">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/en/documents.html?form=github">Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caorushizi/mediago/discussions">Discussions</a>
  <br>

<a href="https://github.com/caorushizi/mediago/blob/master/README.zh.md">中文</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="https://github.com/caorushizi/mediago/blob/master/README.jp.md">日本語</a>
<br>

  <!-- MediaGo Pro -->
  <a href="https://mediago.torchstellar.com/?from=github">
    <img src="https://img.shields.io/badge/✨_New_Release-MediaGo_Pro-ff6b6b?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDMgN2wzIDMgNi00IDYgNCAzLTMtOS01eiIvPjxwYXRoIGQ9Ik0zIDE3bDkgNSA5LTUtMy0zLTYgNC02LTQtMyAzeiIvPjwvc3ZnPg==" alt="MediaGo Pro" />
  </a>
  <a href="https://mediago.torchstellar.com/?from=github">
    <img src="https://img.shields.io/badge/🚀_Try_Now-Online_Version_No_Install-2a82f6?style=for-the-badge" alt="Try Now" />
  </a>
  <br>

  <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/caorushizi/mediago/total">
  <img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/caorushizi/mediago/latest/total">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/caorushizi/mediago">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/caorushizi/mediago">
  <img alt="GitCode" src="https://gitcode.com/caorushizi/mediago/star/badge.svg">
  <br>

  <a href="https://trendshift.io/repositories/11083" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/11083" alt="caorushizi%2Fmediago | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
  </a>

  <hr />
</div>

## What is MediaGo?

A cross-platform streaming media downloader with built-in browser sniffing — grab m3u8, HLS, and more with zero packet-capture hassle.

- **✅&nbsp; No packet capture needed** — The built-in browser automatically detects video resources on any page. Just pick what you want from the detected list and download.
- **📱&nbsp; Watch on mobile** — Seamlessly switch between PC and mobile. Once a video is downloaded, scan a QR code to watch it on your phone.
- **⚡️&nbsp; Batch downloads** — Download multiple videos and live streams at the same time — no wasted bandwidth.
- **🎉&nbsp; Docker support** — Deploy the web UI via Docker for quick, headless operation.
- **🦞&nbsp; OpenClaw Skill** — Download videos with natural language through AI coding assistants (OpenClaw, Claude Code, etc.). Install with `npx clawhub@latest install mediago`.

## Quick Start

You need **Node.js** and **pnpm**. Install Node.js from the [official site](https://nodejs.org/), then install pnpm:

```shell
npm i -g pnpm
```

## Running locally

```shell
# Clone the repo
git clone https://github.com/caorushizi/mediago.git

# Install dependencies
pnpm install

# Start the Electron desktop app (dev mode)
pnpm dev:electron

# — or — start the web server (dev mode)
pnpm dev:server

# Package the Electron app for distribution
pnpm pack:electron

# Package the web server for distribution
pnpm pack:server
```

## Releases

### v3.5.0-beta.0 (Apr 3, 2026)

#### Downloads

- [Windows (installer) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-win32-x64-3.5.0-beta.0.exe)
- [Windows (portable) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-portable-win32-x64-3.5.0-beta.0.exe)
- [macOS ARM64 (Apple Silicon) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-darwin-arm64-3.5.0-beta.0.dmg)
- [macOS x64 (Intel) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-darwin-x64-3.5.0-beta.0.dmg)
- [Linux v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-linux-amd64-3.5.0-beta.0.deb)
- Docker v3.5.0-beta.0: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:3.5.0-beta.0`

### v3.0.0 (Oct 7, 2024)

#### Downloads

- [Windows (installer) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-win32-x64-3.0.0.exe)
- [Windows (portable) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-portable-win32-x64-3.0.0.exe)
- [macOS ARM64 (Apple Silicon) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-arm64-3.0.0.dmg)
- [macOS x64 (Intel) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-x64-3.0.0.dmg)
- [Linux v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-linux-amd64-3.0.0.deb)
- Docker: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:latest`

### One-click Docker deployment via BT Panel

1. Install [BT Panel](https://www.bt.cn/new/download.html?r=dk_mediago) using the official script.
2. Log in to the panel, click **Docker** in the sidebar, and follow the prompts to install the Docker service.
3. Find **MediaGo** in the app store, click **Install**, configure your domain, and you're done.

## Screenshots

![Home](./images/home.png)

![Home — dark mode](./images/home-dark.png)

![Settings](./images/settings.png)

![Resource extraction](./images/browser.png)

## Changelog (v3.0.0)

- Docker deployment for the web UI
- Redesigned desktop UI
- Video playback on desktop and mobile
- Fixed blank window on macOS launch
- Improved batch download UX
- Added Windows portable build (no install required)
- Enhanced resource sniffing — detect multiple videos per page
- Import / export favorites
- Export the download list from the home page
- Improved "New download" form flow
- Open the app and add downloads via URL scheme
- Various bug fixes and UX improvements

## Tech Stack

- [React](https://react.dev/)
- [Electron](https://www.electronjs.org)
- [Koa](https://koajs.com)
- [Vite](https://vitejs.dev)
- [Ant Design](https://ant.design)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com/)
- [Inversify](https://inversify.io)

## Acknowledgements

- [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE)
- [BBDown](https://github.com/nilaoda/BBDown)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [mediago-core](https://github.com/caorushizi/mediago-core)

## Disclaimer

> **This project is for educational and research purposes only. Do not use it for any commercial or illegal purposes.**
>
> 1. All code and functionality provided by this project are intended solely as a reference for learning about streaming media technologies. Users must comply with the laws and regulations of their jurisdiction.
> 2. Any content downloaded using this project remains the property of its original copyright holders. Users should delete downloaded content within 24 hours or obtain proper authorization.
> 3. The developers of this project are not responsible for any actions taken by users, including but not limited to downloading copyrighted content or impacting third-party platforms.
> 4. Using this project for mass scraping, disrupting platform services, or any activity that infringes upon the legitimate rights of others is strictly prohibited.
> 5. By using this project you acknowledge that you have read and agree to this disclaimer. If you do not agree, stop using the project and delete it immediately.
