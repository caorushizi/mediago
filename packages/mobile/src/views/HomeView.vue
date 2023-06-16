<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import axios from 'axios'
import { List } from 'vant'

interface VideoData {
  id: number
  name: string
  url: string
}

const videoRef = ref(null)
const player = ref<Player | null>(null)
const list = ref<VideoData[]>([])

onMounted(async () => {
  if (videoRef.value) {
    const res = await axios.get('http://localhost:3000/api/video-list')
    list.value = res.data

    player.value = new Player({
      el: videoRef.value,
      url: list.value[0].url,
      fluid: true,
      videoInit: true
    })
  }
})

function itemClick(item: VideoData) {
  console.log('item: ', item.url)
  if (!player.value) return

  player.value.src = item.url
}
</script>

<template>
  <main>
    <div ref="videoRef"></div>

    <van-list finished-text="没有更多了">
      <van-cell v-for="item in list" :key="item.id" :title="item.name" @click="itemClick(item)" />
    </van-list>
  </main>
</template>
