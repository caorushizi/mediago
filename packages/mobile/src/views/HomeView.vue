<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'

const videoRef = ref(null)

onMounted(() => {
  const player = new Player({
    el: videoRef.value,
    url: 'http://h5player.bytedance.com/video/mp4/xgplayer-demo-360p.mp4',
    fluid: true
  })
})
</script>

<template>
  <main>
    <div ref="videoRef"></div>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <van-cell v-for="item in list" :key="item" :title="item" />
    </van-list>
  </main>
</template>
