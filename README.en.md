<div align="center">
  <h1>MediaGo</h1>
  <a href="https://downloader.caorushizi.cn/en/guides.html?form=github">Quick start</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/en?form=github">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/en/documents.html?form=github">Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caorushizi/mediago/discussions">Discussions</a>
  <br>
  <br>

  <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/caorushizi/mediago/total">
  <img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/caorushizi/mediago/latest/total">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/caorushizi/mediago">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/caorushizi/mediago">
  <br>
  <br>
  
  <a href="https://trendshift.io/repositories/11083" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/11083" alt="caorushizi%2Fmediago | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
  </a>

  <hr />
</div>

## Intro

This project supports m3u8 video extraction tools, streaming media download, and m3u8 download.

- **✅&nbsp; No need to capture packets**: You can easily sniff video resources on web pages using the built-in browser. Choose the resource you want to download from the sniffed resource list—simple and fast.
- **📱&nbsp; Mobile playback**: Easily switch between PC and mobile devices seamlessly. Once downloaded, you can watch the video on your phone.
- **⚡️&nbsp; Batch download**: Supports downloading multiple videos and live streams simultaneously, ensuring high bandwidth is fully utilized.
- **🎉&nbsp; Docker deployment supported**: Supports Docker deployment for the web version, making it convenient and quick.

## Quickstart

To run the code, you'll need Node.js and pnpm. Node.js can be downloaded and installed from the official website, and pnpm can be installed via `npm i -g pnpm`.

## Run the code

```shell
# Code download
git clone https://github.com/caorushizi/mediago.git

# Installation dependency
pnpm i

# Development environment
pnpm dev

# Package run
pnpm release

# Build a docker image
docker buildx build -t caorushizi/mediago:latest .

# docker startup
docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago

```

## Releases

### v3.0.0 (Released on 2024.10.7)

#### Software Downloads

- [【mediago】 Windows (Installer) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 Windows (Portable) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macOS ARM64 (Apple Silicon) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macOS x64 (Intel) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-x64-3.0.0.dmg)
- [【mediago】 Linux v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 Docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

#### Domestic Downloads

- [【mediago】 Windows (Installer) v3.0.0](https://static.ziying.site/mediago/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 Windows (Portable) v3.0.0](https://static.ziying.site/mediago/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macOS ARM64 (Apple Silicon) v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macOS x64 (Intel) v3.0.0](https://static.ziying.site/mediago/mediago-setup-darwin-x64-3.0.0-beta.5.dmg)
- [【mediago】 Linux v3.0.0](https://static.ziying.site/mediago/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 Docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago:v3.0.0`

### One-click Docker Panel Deployment (Recommended)

1. Install the BT Panel by visiting [BT Panel](https://www.bt.cn/new/download.html?r=dk_mediago) and downloading the official version script.
2. After installation, log into the BT Panel, click on `Docker` in the menu bar. The first time you enter, it will prompt you to install the `Docker` service. Click to install and follow the instructions to complete the installation.
3. Once installed, find `MediaGo` in the application store, click install, configure domain names, and other basic information to complete the installation.

### Software Screenshots

![Homepage](https://static.ziying.site/images/home.png)

### Major Updates

- Support for Docker deployment on the web version
- Updated desktop UI

### Changelog

- Updated desktop UI
- Support for Docker deployment on the web version
- Added video playback, supporting both desktop and mobile playback
- Fixed issue where the macOS version couldn't display the interface
- Optimized the batch download interaction
- Added portable version for Windows (no installation required)
- Optimized the download list, supporting sniffing multiple videos on a page
- Supported manual import/export of the favorites list
- Supported export of the homepage download list
- Optimized the interaction logic for the "New Download" form
- Supported opening the app via UrlScheme and adding download tasks
- Fixed several bugs and enhanced the user experience

## Software Screenshots

![Homepage](https://static.ziying.site/images/home.png)

![Homepage-dark](https://static.ziying.site/images/home-dark.png)

![Settings Page](https://static.ziying.site/images/settings.png)

![Resource Extraction](https://static.ziying.site/images/browser.png)

## Tech Stack

- React <https://react.dev/>
- Electron <https://www.electronjs.org>
- Koa <https://koajs.com>
- Vite <https://cn.vitejs.dev>
- Ant Design <https://ant.design>
- Tailwind CSS <https://tailwindcss.com>
- Shadcn <https://ui.shadcn.com/>
- Inversify <https://inversify.io>
- TypeORM <https://typeorm.io>

## Acknowledgements

- N_m2u8DL-CLI from <https://github.com/nilaoda/N_m3u8DL-CLI>
- N_m3u8DL-RE from <https://github.com/nilaoda/N_m3u8DL-RE>
- mediago from <https://github.com/caorushizi/hls-downloader>
