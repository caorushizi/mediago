<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useData, inBrowser } from "vitepress";
import { watchEffect } from "vue";
import Comments from "./components/Comments.vue";
import Footer from "./components/Footer.vue";
import QrCode from "./components/QrCode.vue";
import { useI18n } from "vue-i18n";
import AdBanner from "./components/AdBanner.vue";

const { lang } = useData();
const { locale } = useI18n();

watchEffect(() => {
  if (inBrowser) {
    locale.value = lang.value;
    document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2030 00:00:00 UTC; path=/`;
  }
});

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <!-- <template #sidebar-nav-before>
      <AdBanner />
    </template> -->
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
