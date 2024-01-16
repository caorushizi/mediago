<img src="https://socialify.git.ci/caorushizi/m3u8-downloader/image?font=Inter&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto" alt="MediaDownloader"/>

<div align="center">
  <h1>Media downloader</h1>
  <a href="https://downloader.caorushizi.cn/guides.html?form=github">快速开始</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn?form=github">官网</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://downloader.caorushizi.cn/documents.html?form=github">文档</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/caorushizi/m3u8-downloader/discussions">Discussions</a>
  <br>
  <br>

  <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/caorushizi/m3u8-downloader/total">
  <img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/caorushizi/m3u8-downloader/latest/total">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/caorushizi/m3u8-downloader">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/caorushizi/m3u8-downloader">

  <hr />
</div>

## Intro

本项目支持 m3u8 视频在线提取工具 流媒体下载 m3u8 下载。

- **✅&nbsp; 无需抓包**： 使用软件自带浏览器可以轻松嗅探网页中的视频资源，通过嗅探到的资源列表选择自己想要下载的资源，简单快速。
- **📱&nbsp; 移动播放**： 可以轻松无缝的在PC和移动设备之前切换，下载完成后即可使用手机观看视频。
- **⚡️&nbsp; 批量下载**： 支持同时下载多个视频和直播资源，高速带宽不闲置。

## Quickstart

运行代码需要 node 、 pnpm 和 go，node、go 需要在官网下载安装，pnpm 可以通过`npm i -g pnpm`安装。

## 运行代码

```shell
# 代码下载
git clone --recursive https://github.com/caorushizi/m3u8-downloader.git

# 安装依赖
pnpm i

# 开发环境
pnpm dev

# 打包运行
pnpm release
```

## Releases

**v2.0.1（2023.7.9 发布）**

- [windows media-downloader v2.0.2](https://github.com/caorushizi/m3u8-downloader/releases/download/v2.0.2/media-downloader-setup-2.0.2.exe)
- [macos media-downloader v2.0.2](https://github.com/caorushizi/m3u8-downloader/releases/download/v2.0.2/media-downloader-setup-2.0.2.dmg)

**v2.0.1（2023.7.1 发布）**

- [windows media-downloader v2.0.1](https://github.com/caorushizi/m3u8-downloader/releases/download/v2.0.1/media-downloader-setup-2.0.1.exe)
- [macos media-downloader v2.0.1](https://github.com/caorushizi/m3u8-downloader/releases/download/v2.0.1/media-downloader-setup-2.0.1.dmg)

**更新日志**

- 暗黑模式
- 更多下载配置
- 支持请求标头自动带入
- 支持开启广告过滤
- 支持开启沉浸式嗅探
- 支持切换手机和 PC 模式
- 支持修改同时下载数量
- 修复了一些 bug

**v1.1.5（2022.2.5 发布）**

- [windows media-downloader v1.1.5](https://github.com/caorushizi/m3u8-downloader/releases/download/1.1.5/media-downloader-setup-1.1.4.exe)

**更新日志**

## 软件截图

![首页](https://static.ziying.site/v2.0.3-beta-home.png)

![设置页面](https://static.ziying.site/v2.0.3-beta-settings.png)

![资源提取](https://static.ziying.site/v2.0.3-beta-extract.png)

## 技术栈

- vite <https://cn.vitejs.dev>
- antd <https://ant.design>
- electron <https://www.electronjs.org>

## 鸣谢

N_m3u8DL-CLI 来自于 <https://github.com/nilaoda/N_m3u8DL-CLI>

mediago 来自于 <https://github.com/caorushizi/mediago>
