import vueI18n from "@intlify/unplugin-vue-i18n/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type HeadConfig } from "vitepress";
import { baiduAnalytics, googleAnalytics } from "./plugins";

const isDev = process.env.NODE_ENV === "development";

const head: HeadConfig[] = [["link", { rel: "shortcut icon", href: "/favicon.svg" }]];
if (!isDev) {
  head.push(...baiduAnalytics(), ...googleAnalytics());
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MediaGo",
  description: "简单易用，快速下载",
  lastUpdated: true,
  head,
  themeConfig: {
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
          { text: "通过宝塔面板部署", link: "/bt-install" },
          { text: "配合猫爪下载视频", link: "/catcatch" },
        ],
      },
      {
        text: "Q&A",
        items: [
          { text: "常见问题", link: "/qa" },
          { text: "windows7支持（64位）", link: "/history" },
          { text: "意见收集", link: "/proposal" },
          { text: "支持列表", link: "/list" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/caorushizi/m3u8-downloader" }],
  },

  locales: {
    root: {
      label: "简体中文",
      lang: "zh",
    },
    en: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Home", link: "/en" },
          { text: "Guides", link: "/en/guides" },
          { text: "Changelog", link: "/en/changelog" },
        ],

        sidebar: [
          {
            text: "Quick start",
            items: [
              { text: "Quick start", link: "/en/guides" },
              { text: "Baota Panel", link: "/en/bt-install" },
              { text: "Documents", link: "/en/documents" },
              { text: "Changelog", link: "/en/changelog" },
            ],
          },
          {
            text: "Q&A",
            items: [
              { text: "History", link: "/en/history" },
              { text: "Proposal", link: "/en/proposal" },
              { text: "Support list", link: "/en/list" },
            ],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/caorushizi/mediago",
          },
        ],
      },
    },
    jp: {
      label: "日本語",
      lang: "jp",
      themeConfig: {
        nav: [
          { text: "Home", link: "/jp" },
          { text: "です", link: "/jp/guides" },
          { text: "ログを更新します。", link: "/jp/changelog" },
        ],

        sidebar: [
          {
            text: "始める",
            items: [
              { text: "早く始めます", link: "/jp/guides" },
              { text: "塔のパネル配置です", link: "/jp/bt-install" },
              { text: "使用説明書です", link: "/jp/documents" },
              { text: "ログを更新します。", link: "/jp/changelog" },
            ],
          },
          {
            text: "Q&A",
            items: [
              { text: "古いバージョンです", link: "/jp/history" },
              { text: "意見収集です", link: "/jp/proposal" },
              { text: "サポートリストです", link: "/jp/list" },
            ],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/caorushizi/mediago",
          },
        ],
      },
    },
  },

  vite: {
    plugins: [
      vueI18n({
        ssr: true,
      }) as any,
      tailwindcss(),
    ],
  },
});
