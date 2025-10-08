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
    },
    jp: {
      slogan: "使いやすく、ダウンロードも速い",
      articles: "記事",
      help: "ヘルプ",
      search: "スマート検索",
      privacy: "プライバシーポリシー",
      links: "友情リンク",
      "jiexi.im": "スマートビデオ解析",
    },
    zh: {
      slogan: "简单易用，快速下载",
      articles: "文章",
      help: "帮助",
      search: "智能搜索",
      privacy: "隐私政策",
      links: "友情链接",
      "jiexi.im": "智能视频解析",
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
