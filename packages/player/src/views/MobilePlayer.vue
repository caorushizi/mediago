<script setup lang="ts">
import 'xgplayer/dist/index.min.css'
import { type VideoData, useVideo } from '@/hooks'

const { player, list, videoRef, changeVideo } = useVideo()
function itemClick(item: VideoData) {
  if (!player.value) return
  changeVideo(item.url)
}
</script>

<template>
  <main>
    <van-nav-bar title="视频播放" />
    <div v-show="list.length" ref="videoRef" class="video-inner"></div>
    <div v-if="list.length">
      <van-list finished-text="没有更多了">
        <van-cell v-for="item in list" :key="item.id" :title="item.name" @click="itemClick(item)" />
      </van-list>
    </div>
    <van-empty v-else description="暂无视频" />
  </main>
</template>

<style scoped lang="scss">
.video-inner {
  width: 100% !important;
  height: 0 !important;
  padding-bottom: 56.25% !important;
}
</style>
