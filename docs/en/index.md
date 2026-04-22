---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "MediaGo"
  text: "Cross-platform video downloader"
  tagline: "Built-in sniffing — point it at a page, pick what you want, save. No packet capture, no plugins, no command-line tools."
  image:
    src: /home_en.png
    alt: MediaGo home screen
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guides
    - theme: alt
      text: User Guide
      link: /en/documents

features:
  - icon: ⏩
    title: No packet capture required
    details: The desktop app ships with a built-in browser that sniffs every downloadable resource on the page automatically. No Fiddler, no Charles, no DevTools gymnastics.
  - icon: 🌐
    title: Browser extension for Chrome / Edge
    details: One-click video sniffing in your everyday browser. Detected count shows in the toolbar badge; covers YouTube, Bilibili and most mainstream video platforms. Bundled with the desktop app.
  - icon: 🎬
    title: Broad video source coverage
    details: HLS / m3u8 streams, live streaming, Bilibili, YouTube, Twitter/X, Instagram and over a thousand more video sites — powered by N_m3u8DL-RE, BBDown and yt-dlp under the hood.
  - icon: ⚡️
    title: Batch download
    details: Download multiple videos and live streams at once. Your high-speed bandwidth never sits idle; tweak the concurrency to taste.
  - icon: 🎞️
    title: Built-in format conversion
    details: Convert completed downloads to another format or quality without leaving MediaGo. No separate ffmpeg tool required.
  - icon: 📱
    title: Mobile playback
    details: The desktop app listens on your LAN IP too — open the web UI on a phone or tablet on the same Wi-Fi to browse downloads and play them directly.
  - icon: 🔌
    title: Open HTTP API
    details: Full HTTP API lets scripts, automation tools and third-party apps create download tasks, query progress and manage the list.
  - icon: 🦞
    title: OpenClaw Skill
    details: Tell Claude Code, Cursor or your AI coding assistant "please download this video" — it handles the rest. One command to install.
  - icon: 🐳
    title: One-line Docker deployment
    details: One command to deploy to your NAS or VPS. Access from any browser on your network. Multi-arch images on Docker Hub and GHCR.
---
