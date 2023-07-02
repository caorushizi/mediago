import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "media-downloader",
  description: "简单易用，快速下载",
  lastUpdated: true,
  head: [
    ["link", { rel: "shortcut icon", href: "/favicon.svg" }],
    [
      "script",
      {},
      `var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?eefcbd14f0323044aa0ca678cd278381";
          var s = document.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(hm, s);
        })();`,
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "教程", link: "/guides" },
    ],

    sidebar: [
      {
        text: "开始",
        items: [
          { text: "快速开始", link: "/guides" },
          { text: "使用说明", link: "/documents" },
        ],
      },
      {
        text: "其他",
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
      copyright: "Copyright © 2019-present caorushizi",
    },
  },
});
