<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { init, WalineInstance } from "@waline/client";
import "@waline/client/waline.css";
import { useData } from "vitepress";

const commentsRef = ref<WalineInstance | null>(null);
const { isDark } = useData();

watch(isDark, (val: boolean) => {
  if (!commentsRef.value) return;
  commentsRef.value.update({
    dark: val,
  });
});

onMounted(() => {
  commentsRef.value = init({
    el: "#waline",
    serverURL: "https://comments.ziying.site",
    dark: isDark.value,
    lang: "zh-CN",
    reaction: true,
    pageview: true,
  });
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
