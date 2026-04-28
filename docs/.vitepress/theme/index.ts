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
      blog: "Blog",
      privacy: "Privacy Policy",
    },
    jp: {
      slogan: "使いやすく、ダウンロードも速い",
      articles: "記事",
      help: "ヘルプ",
      blog: "ブログ",
      privacy: "プライバシーポリシー",
    },
    zh: {
      slogan: "简单易用，快速下载",
      articles: "文章",
      help: "帮助",
      blog: "博客",
      privacy: "隐私政策",
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
