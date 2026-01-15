import Theme from "vitepress/theme";
import "./style/var.css";
import "./style/global.css";
import type { EnhanceAppContext } from "vitepress";
import { createI18n } from "vue-i18n";
import Layout from "./Layout.vue";

const i18n = createI18n({
  legacy: false,
  locale: "zh",
  messages: {
    en: {
      slogan: "Easy to use, fast download",
      articles: "Articles",
      help: "Help",
      search: "intelligent search",
      privacy: "Privacy Policy",
      links: "Links",
      "jiexi.im": "Smart Video Analysis",
      banner: {
        new: "NEW",
        title: "MediaGo Pro is Live!",
        desc: "- Experience faster downloads & exclusive features",
        action: "Try Now",
        close: "Close",
      },
    },
    jp: {
      slogan: "使いやすく、ダウンロードも速い",
      articles: "記事",
      help: "ヘルプ",
      search: "スマート検索",
      privacy: "プライバシーポリシー",
      links: "友情リンク",
      "jiexi.im": "スマートビデオ解析",
      banner: {
        new: "新着",
        title: "MediaGo Pro がリリースされました！",
        desc: "- より高速なダウンロードと限定機能をお楽しみください",
        action: "今すぐ試す",
        close: "閉じる",
      },
    },
    zh: {
      slogan: "简单易用，快速下载",
      articles: "文章",
      help: "帮助",
      search: "智能搜索",
      privacy: "隐私政策",
      links: "友情链接",
      "jiexi.im": "智能视频解析",
      banner: {
        new: "全新上线",
        title: "MediaGo Pro 正式发布！",
        desc: "- 更快的下载速度，更多专属功能",
        action: "立即体验",
        close: "关闭",
      },
    },
  },
});

export default {
  extends: Theme,
  Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    app.use(i18n);
  },
};
