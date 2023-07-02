<script setup lang="ts">
import { onMounted } from "vue";
import { init } from "@waline/client";
import "@waline/client/waline.css";

onMounted(() => {
  init({
    el: "#waline",
    serverURL: "https://comments.ziying.site",
    dark: "auto",
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
