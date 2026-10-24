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
  - title: 快速开始
    details: 完成安装，并用内置浏览器创建第一个下载任务。
    link: /guides
  - title: 使用说明
    details: 了解资源嗅探、下载队列、格式转换与移动播放。
    link: /documents
  - title: 浏览器扩展
    details: 在 Chrome 或 Edge 中发现资源并发送到 MediaGo。
    link: /extension
  - title: HTTP API
    details: 通过脚本和第三方应用创建任务、查询进度与管理列表。
    link: /api
  - title: 服务端部署
    details: 在服务器或 NAS 上部署 MediaGo，并通过浏览器访问。
    link: /bt-install
  - title: 常见问题与支持
    details: 排查下载问题，确认站点支持情况，并提交反馈。
    link: /qa
---

<script setup>
import HomeTopics from "./.vitepress/theme/components/HomeTopics.vue";
</script>

<HomeTopics />

## 隐私与代码签名

[隐私政策](/privacy) · [Code signing policy](/code-signing)。Windows SignPath 签名尚在申请准备阶段，已有未签名发布包仍然未签名。
