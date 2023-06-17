<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Player, { type IPlayerOptions } from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import axios from 'axios'

interface VideoData {
  id: number
  name: string
  url: string
}

const videoRef = ref(null)
const player = ref<Player | null>(null)
const list = ref<VideoData[]>([])

onMounted(async () => {
  let baseUrl = location.href
  if (import.meta.env.MODE === 'development') {
    baseUrl = `http://${location.hostname}:8433`
  }
  const res = await axios.get(`${baseUrl}/api/video-list`)
  list.value = res.data

  if (videoRef.value) {
    const options: IPlayerOptions = {
      el: videoRef.value,
      fluid: true,
      videoInit: true
    }
    if (Array.isArray(list.value) && list.value.length > 0) {
      options.src = list.value[0].url
    }
    player.value = new Player(options)
  }
})

function itemClick(item: VideoData) {
  if (!player.value) return

  player.value.src = item.url
}
</script>

<template>
  <main>
    <div v-show="list.length" ref="videoRef"></div>
    <div v-if="list.length">
      <van-list finished-text="没有更多了">
        <van-cell v-for="item in list" :key="item.id" :title="item.name" @click="itemClick(item)" />
      </van-list>
    </div>
    <van-empty v-else description="暂无视频" />
  </main>
</template>
