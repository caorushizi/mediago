# media-downloader

m3u8 视频在线提取工具 流媒体下载 m3u8 下载 桌面客户端 windows mac。
可以直接在线获取 m3u8 链接地址，无需使用使用网络抓包，无需安装浏览器插件，可以直接带出请求标头……

模板： <https://github.com/caorushizi/electron-template>

## 上手指南

以下指南将帮助你在本地机器上安装和运行该项目，进行开发和测试。关于如何将该项目部署到在线环境，请参考部署小节。

【使用帮助】[blog.ziying.site](https://downloader.caorushizi.cn/guides.html?form=github)

## 安装要求

运行代码需要 node 和 pnpm，node 需要在官网下载安装，pnpm 可以通过`npm i -g pnpm`安装。

## 运行代码

安装依赖 `pnpm i`

开发环境 `pnpm run dev`

打包运行 `pnpm run release`

## 下载链接

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

![首页](https://raw.githubusercontent.com/caorushizi/m3u8-downloader/master/screenshot/home-page.png)

![设置页面](https://raw.githubusercontent.com/caorushizi/m3u8-downloader/master/screenshot/setting-page.png)

![资源提取](https://raw.githubusercontent.com/caorushizi/m3u8-downloader/master/screenshot/browser-page.png)

## 技术栈

- vite <https://cn.vitejs.dev>
- antd <https://ant.design>
- electron <https://www.electronjs.org>

## 鸣谢

N_m3u8DL-CLI 来自于 <https://github.com/nilaoda/N_m3u8DL-CLI>

mediago 来自于 <https://github.com/caorushizi/mediago>
