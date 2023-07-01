import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "在线视频下载",
  description: "简单易用，快速下载",
  head: [
    [
      "script",
      {},
      `<script>
        var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?eefcbd14f0323044aa0ca678cd278381";
          var s = document.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(hm, s);
        })();
        </script>`,
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
