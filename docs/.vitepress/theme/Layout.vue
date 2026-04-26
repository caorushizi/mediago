<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useData, inBrowser, useRoute } from "vitepress";
import { computed, watchEffect } from "vue";
import Comments from "./components/Comments.vue";
import Footer from "./components/Footer.vue";
import QrCode from "./components/QrCode.vue";
import TopBanner from "./components/TopBanner.vue";
import { useI18n } from "vue-i18n";
import AdBanner from "./components/AdBanner.vue";

const { lang } = useData();
const route = useRoute();
const { locale } = useI18n();

const translatedBlogPaths = new Set([
  "/blog/video-downloader-review/",
  "/en/blog/video-downloader-review/",
]);

const translatedBlogLinks: Record<
  string,
  { href: string; label: string; note: string }
> = {
  "/blog/video-downloader-review/": {
    href: "/en/blog/video-downloader-review/",
    label: "English",
    note: "这篇文章已有英文版",
  },
  "/en/blog/video-downloader-review/": {
    href: "/blog/video-downloader-review/",
    label: "简体中文",
    note: "This article is also available in Chinese",
  },
};

function normalizeRoutePath(path: string) {
  return path.replace(/index\.html$/, "").replace(/\.html$/, "/");
}

const normalizedPath = computed(() => normalizeRoutePath(route.path));
const blogTranslationLink = computed(
  () => translatedBlogLinks[normalizedPath.value],
);

watchEffect(() => {
  locale.value = lang.value;

  if (inBrowser) {
    const isBlogPage =
      normalizedPath.value.startsWith("/blog/") ||
      normalizedPath.value.startsWith("/en/blog/") ||
      normalizedPath.value.startsWith("/jp/blog/") ||
      normalizedPath.value.startsWith("/it/blog/");

    document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2030 00:00:00 UTC; path=/`;
    document.documentElement.classList.toggle("is-blog-page", isBlogPage);
    document.documentElement.classList.toggle(
      "has-blog-translation",
      translatedBlogPaths.has(normalizedPath.value),
    );
  }
});

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-top>
      <TopBanner />
    </template>
    <!-- <template #sidebar-nav-before>
      <AdBanner />
    </template> -->
    <template #doc-before>
      <div
        v-if="blogTranslationLink"
        class="blog-language-switch"
        aria-label="Article language switch"
      >
        <span>{{ blogTranslationLink.note }}</span>
        <a :href="blogTranslationLink.href">{{ blogTranslationLink.label }}</a>
      </div>
    </template>
    <template #doc-footer-before>
      <QrCode />
    </template>
    <template #doc-after>
      <Comments />
    </template>
    <template #layout-bottom>
      <Footer />
    </template>
  </Layout>
</template>
