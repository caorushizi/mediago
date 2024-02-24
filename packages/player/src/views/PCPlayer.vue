<script setup lang="ts">
import { ref } from 'vue'
import 'xgplayer/dist/index.min.css'
import { useVideo, type VideoData } from '@/hooks'

const { player, list, videoRef, changeVideo } = useVideo()
const drawer = ref(false)

function closeDrawer() {
  drawer.value = false
}

function openDrawer() {
  drawer.value = true
}

function itemClick(item: VideoData) {
  if (!player.value) return

  changeVideo(item.url)
}
</script>

<template>
  <div class="video-wrapper">
    <el-button class="video-list" @click="openDrawer">播放列表</el-button>
    <div v-show="list.length" ref="videoRef" class="video-inner"></div>
  </div>
  <el-drawer v-model="drawer" title="播放列表" :before-close="closeDrawer">
    <div v-for="item in list" :key="item.id" @click="itemClick(item)">{{ item.name }}</div>
  </el-drawer>
</template>

<style scoped lang="scss">
.video-wrapper {
  background-color: #000;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  .video-list {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
  }
  .video-inner {
    max-height: 100%;
  }
}
</style>
