import { HeadConfig, defineConfig } from "vitepress";

const isDev = process.env.NODE_ENV === "development";

const head: HeadConfig[] = [
  ["link", { rel: "shortcut icon", href: "/favicon.svg" }],
  [
    "meta",
    {
      name: "keywords",
      content: "mediago, 视频下载, 流媒体下载, 哔哩哔哩, m3u8",
    },
  ],
  [
    "meta",
    {
      name: "description",
      content:
        "Mediago 是一款强大的跨平台视频在线提取工具，支持流媒体下载、视频下载、M3U8 文件下载以及 B站视频下载。无论是获取高清电影、音乐视频还是直播内容，Mediago 都能提供快捷、稳定的下载体验。该工具还提供桌面客户端，支持多种操作系统，让您随时随地轻松下载和保存喜欢的视频。",
    },
  ],
  ["meta", { property: "og:title", content: "MediaGo - 跨平台视频下载工具" }],
  [
    "meta",
    {
      property: "og:description",
      content:
        "Mediago 是一款强大的跨平台视频在线提取工具，支持流媒体下载、视频下载、M3U8 文件下载以及 B站视频下载。无论是获取高清电影、音乐视频还是直播内容，Mediago 都能提供快捷、稳定的下载体验。该工具还提供桌面客户端，支持多种操作系统，让您随时随地轻松下载和保存喜欢的视频。",
    },
  ],
  ["meta", { property: "og:url", content: "https://downloader.caorushizi.cn" }],
  [
    "meta",
    {
      property: "og:image",
      content: "https://downloader.caorushizi.cn/home.png",
    },
  ],
];

if (!isDev) {
  head.push([
    "script",
    {},
    `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?eefcbd14f0323044aa0ca678cd278381";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`,
  ]);
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MediaGo - 跨平台视频下载工具",
  description:
    "Mediago 是一款强大的跨平台视频在线提取工具，支持流媒体下载、视频下载、M3U8 文件下载以及 B站视频下载。无论是获取高清电影、音乐视频还是直播内容，Mediago 都能提供快捷、稳定的下载体验。该工具还提供桌面客户端，支持多种操作系统，让您随时随地轻松下载和保存喜欢的视频。",
  lastUpdated: true,
  head,
  themeConfig: {
    siteTitle: "MediaGo",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "教程", link: "/guides" },
      { text: "更新日志", link: "/changelog" },
    ],

    sidebar: [
      {
        text: "开始",
        items: [
          { text: "快速开始", link: "/guides" },
          { text: "使用说明", link: "/documents" },
          { text: "更新日志", link: "/changelog" },
        ],
      },
      {
        text: "Q&A",
        items: [
          { text: "旧版本", link: "/history" },
          { text: "意见收集", link: "/proposal" },
          { text: "支持列表", link: "/list" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/caorushizi/m3u8-downloader" },
    ],

    footer: {
      message: '<a href="https://beian.miit.gov.cn">豫ICP备20012967号-2</a>',
      copyright: "Copyright © 2021-present caorushizi",
    },
  },
  sitemap: {
    hostname: "https://downloader.caorushizi.cn",
  },
});
