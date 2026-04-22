---
layout: doc
outline: deep
---

# Quick Start

This article provides a simple guide to help you get started with using the software. Supports [OpenClaw Skill](/en/skills) for downloading videos via natural language in AI coding assistants.

::: tip
To facilitate communication and feedback, you can join the feedback group:

MediaGo QQ Feedback Group 1: 574209001
:::

::: info

v3.5 is the latest version. Please feel free to provide feedback in this release and we will address it as quickly as possible.

:::

## Download and Installation

### v3.5.0 (Released on April 22, 2026)

#### Software Download

- [【mediago】 Windows (Installer) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-win32-x64-3.5.0.exe)
- [【mediago】 Windows (Portable) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-portable-win32-x64-3.5.0.exe)
- [【mediago】 macOS arm64 (Apple Silicon) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-arm64-3.5.0.dmg)
- [【mediago】 macOS x64 (Intel) v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-darwin-x64-3.5.0.dmg)
- [【mediago】 Linux v3.5.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0/mediago-community-setup-linux-amd64-3.5.0.deb)
- [**Docker Hub**](https://hub.docker.com/r/caorushizi/mediago): `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago caorushizi/mediago:3.5.0`
- **GHCR**: `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:3.5.0`

Older releases are on the [GitHub Releases page](https://github.com/caorushizi/mediago/releases).

#### What's New

- **Browser extension** (Chrome / Edge) — one-click video sniffing on any site.
- **YouTube and 1000+ sites** — powered by yt-dlp.
- **OpenClaw Skill** — download videos through AI coding assistants.
- **Open HTTP API** — integrate with scripts, automation and third-party tools.
- **In-app format conversion** — pick output format and quality after downloading.
- **Simpler Docker deployment** — multi-arch images on GHCR, mount a single folder.
- **Faster startup** — backend rewritten in Go, lower memory footprint, built-in player.

## Operation Instructions

### Automatic Video Sniffing

1. Select "Resource Extraction"

   ![step 1](../images/guides-step1.png)

2. Enter the video URL

   ![step 2](../images/guides-step2.png)

3. Click "Start Download" to begin downloading the video

   ![step 3](../images/guides-step3.png)

### Manual Download

1. Click the "New Download" button at the top right of the page

   ![step 1](../images/guides-step4.png)

2. In the new download window, enter the "Video Name" and the "Stream (m3u8)" or "Bilibili" link

   ![step 2](../images/guides-step5.png)

3. Click to download the video from the list

   ![step 3](../images/guides-step3.png)

### Batch Download

![step 3](../images/guides-step6.png)

### Additional Features

1. Convert to Audio

   ![step 1](../images/guides-step7.png)

2. More features will be added in the future. Stay tuned!

### Video Playback

- PC Playback

  ![step 2](../images/addition-step3.png)

- Mobile Playback

  ![step 3](../images/addition-step4.png)

## Start Downloading Your Videos

It's so simple! Go ahead and download your videos now.

::: warning
This software is for learning and communication purposes only.
:::
