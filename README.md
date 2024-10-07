<img src="https://socialify.git.ci/caorushizi/mediago/image?font=Inter&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto" alt="MediaDownloader"/>

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
  <br>

  <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/caorushizi/mediago/total">
  <img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/caorushizi/mediago/latest/total">
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/caorushizi/mediago">
  <img alt="GitHub forks" src="https://img.shields.io/github/forks/caorushizi/mediago">

  <hr />
</div>

## Intro

本项目支持 m3u8 视频在线提取工具 流媒体下载 m3u8 下载。

- **✅&nbsp; 无需抓包**： 使用软件自带浏览器可以轻松嗅探网页中的视频资源，通过嗅探到的资源列表选择自己想要下载的资源，简单快速。
- **📱&nbsp; 移动播放**： 可以轻松无缝的在 PC 和移动设备之前切换，下载完成后即可使用手机观看视频。
- **⚡️&nbsp; 批量下载**： 支持同时下载多个视频和直播资源，高速带宽不闲置。

## Quickstart

运行代码需要 node 和 pnpm，node 需要在官网下载安装，pnpm 可以通过`npm i -g pnpm`安装。

## 运行代码

```shell
# 代码下载
git clone https://github.com/caorushizi/mediago.git

# 安装依赖
pnpm i

# 开发环境
pnpm dev

# 打包运行
pnpm release

# docker 启动
docker run -d --name mediago -p 8899:8899 -v /root/mediago:/root/mediago registry.cn-beijing.aliyuncs.com/caorushizi/mediago

# 构建 docker 镜像
docker buildx build -t caorushizi/mediago:latest .
```

## Releases

**v2.2.3 (2024.7.06 发布)**

- [windows mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-x64-2.2.3.exe)
- [macos mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-x64-2.2.3.dmg)
- [linux mediago v2.2.3](https://github.com/caorushizi/mediago/releases/download/v2.2.3/mediago-setup-arm64-2.2.3.dmg)

**更新日志**

- 设置中添加【自动更新】开关：仅更新 release 版本，beta 版本不会自动更新
- 下载表单中增加【批量更新】
- 新增 Linux 版本发布
- 载时自动选择清晰度最高的视频
- 新增【清空缓存】&【无痕模式】
- 自定义选择安装位置
- 修复了一些 bug

**v2.2.0 (2024.5.22 发布)**

- [windows mediago v2.2.0](https://github.com/caorushizi/mediago/releases/download/v2.2.0/mediago-setup-2.2.0.exe)
- [macos mediago v2.2.0](https://github.com/caorushizi/mediago/releases/download/v2.2.0/mediago-setup-2.2.0.dmg)

**更新日志**

- 支持下载直播流
- 支持哔哩哔哩视频下载
- 优化沉浸式嗅探流程
- 支持下载控制台输出
- 修复了一些 bug

**v2.0.2（2023.7.9 发布）**

- [windows mediago v2.0.2](https://github.com/caorushizi/mediago/releases/download/v2.0.2/media-downloader-setup-2.0.2.exe)
- [macos mediago v2.0.2](https://github.com/caorushizi/mediago/releases/download/v2.0.2/media-downloader-setup-2.0.2.dmg)

**更新日志**

- 暗黑模式
- 更多下载配置
- 支持请求标头自动带入
- 支持开启广告过滤
- 支持开启沉浸式嗅探
- 支持切换手机和 PC 模式
- 支持修改同时下载数量
- 修复了一些 bug

## 软件截图

![首页](https://static.ziying.site/v2.0.3-beta-home.png)

![设置页面](https://static.ziying.site/v2.0.3-beta-settings.png)

![资源提取](https://static.ziying.site/v2.0.3-beta-extract.png)

## 技术栈

- vite <https://cn.vitejs.dev>
- antd <https://ant.design>
- electron <https://www.electronjs.org>

## 鸣谢

N_m3u8DL-RE 来自于 <https://github.com/nilaoda/N_m3u8DL-RE>
