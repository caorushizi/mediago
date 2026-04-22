---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "MediaGo"
  text: "跨平台视频下载器"
  tagline: "内置嗅探，打开网页、选一下想要的资源、保存完事。不用抓包，不用折腾浏览器插件，不用碰命令行。"
  image:
    src: /home.png
    alt: MediaGo 首页
  actions:
    - theme: brand
      text: 快速开始
      link: /guides
    - theme: alt
      text: 使用说明
      link: /documents

features:
  - icon: ⏩
    title: 无需抓包
    details: 桌面端内置浏览器，打开视频页就自动嗅探出所有可下载的资源，不用 Fiddler、Charles 之类的抓包工具。
  - icon: 🌐
    title: 浏览器扩展（Chrome / Edge）
    details: 日常用的 Chrome / Edge 里也能一键嗅探视频，检测到的数量显示在工具栏图标上。随桌面端一起打包。
  - icon: 🎬
    title: 多种视频源一锅端
    details: HLS / m3u8 流媒体、直播推流、Bilibili、YouTube、Twitter/X、Instagram 等一千多个视频站点，底层集成 N_m3u8DL-RE、BBDown、yt-dlp 等专业下载工具。
  - icon: ⚡️
    title: 支持批量下载
    details: 同时下载多个视频和直播流资源，高速带宽不闲置，队列并发全由你调。
  - icon: 🎞️
    title: 内置格式转换
    details: 下载完成后直接在 MediaGo 里转换格式、选画质，不用再打开别的工具。
  - icon: 📱
    title: 移动播放
    details: 桌面端同时监听局域网 IP，同一 Wi-Fi 下的手机、平板打开浏览器就能访问下载列表并直接播放。
  - icon: 🔌
    title: 开放 HTTP 接口
    details: 提供完整的 HTTP API，脚本、自动化工具、第三方应用都能创建任务、查询进度、管理下载列表。
  - icon: 🦞
    title: OpenClaw Skill
    details: 在 Claude Code、Cursor 等 AI 编程助手中直接说"帮我下这个视频"即可，剩下的交给 AI。一条命令安装 Skill。
  - icon: 🐳
    title: Docker 一键部署
    details: 一条命令部署到 NAS / VPS 上，浏览器直接访问。Docker Hub 和 GHCR 同步发布多架构镜像。
---
