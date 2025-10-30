<script setup lang="ts">
import { onMounted, watch, ref, watchEffect } from "vue";
import { init, WalineInstance } from "@waline/client";
import "@waline/client/waline.css";
import { useData, useRoute } from "vitepress";

const route = useRoute();
const { isDark } = useData();

const commentsRef = ref<WalineInstance | null>(null);

watchEffect(() => {
  commentsRef.value?.update({
    dark: isDark.value,
  });
});

watch(
  () => route.path,
  () => {
    commentsRef.value?.destroy();
    initWaline();
  }
);

function initWaline() {
  commentsRef.value = init({
    el: "#waline",
    serverURL: "https://comments.ziying.site",
    dark: isDark.value,
    lang: "zh-CN",
    pageview: true,
  });
}

onMounted(() => {
  initWaline();
});
</script>

<template>
  <div id="waline">hello world</div>
</template>

<style scoped>
#waline {
  margin-top: 20px;
}
</style>
