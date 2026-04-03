<div align="center">
  <h1>MediaGo</h1>
  <a href="https://downloader.caorushizi.cn/guides.html?form=github">快速开始</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn?form=github">官网</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/documents.html?form=github">文档</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caorushizi/mediago/discussions">Discussions</a>
  <br>

<a href="https://github.com/caorushizi/mediago/blob/master/README.en.md">English</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="https://github.com/caorushizi/mediago/blob/master/README.jp.md">日本語</a>
<br>

  <!-- MediaGo Pro 推广 -->
  <a href="https://mediago.torchstellar.com/?from=github">
    <img src="https://img.shields.io/badge/✨_全新发布-MediaGo_Pro-ff6b6b?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDMgN2wzIDMgNi00IDYgNCAzLTMtOS01eiIvPjxwYXRoIGQ9Ik0zIDE3bDkgNSA5LTUtMy0zLTYgNC02LTQtMyAzeiIvPjwvc3ZnPg==" alt="MediaGo Pro" />
  </a>
  <a href="https://mediago.torchstellar.com/?from=github">
    <img src="https://img.shields.io/badge/🚀_立即体验-在线版本_无需安装-2a82f6?style=for-the-badge" alt="Try Now" />
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

## Intro

本项目支持 m3u8 视频在线提取工具 流媒体下载 m3u8 下载。

- **✅&nbsp; 无需抓包**： 使用软件自带浏览器可以轻松嗅探网页中的视频资源，通过嗅探到的资源列表选择自己想要下载的资源，简单快速。
- **📱&nbsp; 移动播放**： 可以轻松无缝的在 PC 和移动设备之前切换，下载完成后即可使用手机观看视频。
- **⚡️&nbsp; 批量下载**： 支持同时下载多个视频和直播资源，高速带宽不闲置。
- **🎉&nbsp; 支持 docker 部署**： 支持 docker 部署 web 端，方便快捷。
- **🦞&nbsp; OpenClaw Skill**： 支持通过 AI 编程助手（Openclaw、Claude Code 等）用自然语言下载视频，`npx clawhub@latest install mediago` 一键安装。

## Quickstart

运行代码需要 node 和 pnpm，node 需要在官网下载安装，pnpm 可以通过`npm i -g pnpm`安装。

## 运行代码

```shell
# 代码下载
git clone https://github.com/caorushizi/mediago.git

# 安装依赖
pnpm install

# 首次安装需要 rebuild 一下
pnpm rebuild:workspace

# electron 开发环境
pnpm dev:electron

# electron 打包运行
pnpm release:electron

# server 开发环境
pnpm dev:server

# server 打包运行
pnpm release:server

```

## Releases

### v3.5.0-beta.0 (2026.4.3 发布)

### 软件下载

- [【mediago】 windows(安装版) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-win32-x64-3.5.0-beta.0.exe)
- [【mediago】 windows(便携版) v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-portable-win32-x64-3.5.0-beta.0.exe)
- [【mediago】 macos arm64（apple 芯片） v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-darwin-arm64-3.5.0-beta.0.dmg)
- [【mediago】 macos x64（intel 芯片） v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-darwin-x64-3.5.0-beta.0.dmg)
- [【mediago】 linux v3.5.0-beta.0](https://github.com/caorushizi/mediago/releases/download/v3.5.0-beta.0/mediago-community-setup-linux-amd64-3.5.0-beta.0.deb)
- 【mediago】 docker v3.0 `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:v3.5.0-beta.0`

### v3.0.0 (2024.10.7 发布)

#### 软件下载

- [【mediago】 windows(安装版) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-win32-x64-3.0.0.exe)
- [【mediago】 windows(便携版) v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-portable-win32-x64-3.0.0.exe)
- [【mediago】 macos arm64（apple 芯片） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-arm64-3.0.0.dmg)
- [【mediago】 macos x64（intel 芯片） v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-darwin-x64-3.0.0.dmg)
- [【mediago】 linux v3.0.0](https://github.com/caorushizi/mediago/releases/download/v3.0.0/mediago-setup-linux-amd64-3.0.0.deb)
- 【mediago】 docker `docker run -d --name mediago -p 8899:8899 -v /path/to/mediago:/app/mediago ghcr.io/caorushizi/mediago:latest`

### docker 宝塔面板一键部署（推荐）

1. 安装宝塔面板，前往 [宝塔面板](https://www.bt.cn/new/download.html?r=dk_mediago) 官网，选择正式版的脚本下载安装

2. 安装后登录宝塔面板，在菜单栏中点击 `Docker`，首次进入会提示安装`Docker`服务，点击立即安装，按提示完成安装

3. 安装完成后在应用商店中找到`MediaGo`，点击安装，配置域名等基本信息即可完成安装

### 软件截图

![首页](./images/home.png)

### 重要更新

- 支持 docker 部署 web 端
- 更新桌面端 UI

### 更新日志

- 更新桌面端 UI
- 支持 docker 部署 web 端
- 新增视频播放，支持桌面端和移动端播放
- 修复 mac 打开无法展示界面的问题
- 优化了批量下载的交互
- 添加了 windows 的便携版（免安装哦）
- 优化了下载列表，支持页面中多个视频的嗅探
- 支持收藏列表手动导入导出
- 支持首页下载列表导出
- 优化了【新建下载】表单的交互逻辑
- 支持 UrlScheme 打开应用，并添加下载任务
- 修复了一些 bug 并提升用户体验

## 软件截图

![首页](./images/home.png)

![首页-dark](./images/home-dark.png)

![设置页面](./images/settings.png)

![资源提取](./images/browser.png)

## 技术栈

- react <https://react.dev/>
- electron <https://www.electronjs.org>
- koa <https://koajs.com>
- vite <https://cn.vitejs.dev>
- antd <https://ant.design>
- tailwindcss <https://tailwindcss.com>
- shadcn <https://ui.shadcn.com/>
- inversify <https://inversify.io>
- typeorm <https://typeorm.io>

## 鸣谢

- N_m3u8DL-RE 来自于 <https://github.com/nilaoda/N_m3u8DL-RE>
- BBDown 来自于 <https://github.com/nilaoda/BBDown>
- mediago 来自于 <https://github.com/caorushizi/mediago-core>

## 免责声明

> **本项目仅供学习和研究使用，请勿用于任何商业或非法用途。**
>
> 1. 本项目提供的所有代码和功能仅作为学习流媒体技术的参考，使用者需自行遵守所在地区的法律法规。
> 2. 使用本项目下载的任何内容，其版权归原始内容所有者所有。使用者应在下载后 24 小时内删除，或取得版权方授权。
> 3. 本项目开发者不对使用者的任何行为承担责任，包括但不限于：下载受版权保护的内容、对第三方平台造成的影响等。
> 4. 禁止将本项目用于大规模抓取、破坏平台服务或任何侵犯他人合法权益的行为。
> 5. 使用本项目即表示您已阅读并同意本免责声明。如不同意，请立即停止使用并删除本项目。
