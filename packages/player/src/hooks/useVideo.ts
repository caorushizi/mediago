import { http } from '@/utils'
import { onMounted, ref } from 'vue'
import Player, { type IPlayerOptions } from 'xgplayer'

export interface VideoData {
  id: number
  name: string
  url: string
}

export function useVideo(): any {
  const videoRef = ref(null)
  const player = ref<Player | null>(null)
  const list = ref<VideoData[]>([])

  onMounted(async () => {
    const res = await http.get(`/api/video-list`)
    if (!videoRef.value) {
      console.error('videoRef is not ready')
      return
    }

    const options: IPlayerOptions = {
      el: videoRef.value,
      fluid: true,
      videoInit: true
    }
    if (!Array.isArray(res) || res.length === 0) {
      console.error('video list is empty')
      return
    }

    list.value = res
    player.value = new Player(options)

    setTimeout(() => {
      if (!player.value) {
        console.error('player is not ready')
        return
      }
      player.value.src = list.value[0].url
    })
  })

  function changeVideo(url: string) {
    if (!player.value) {
      console.error('player is not ready')
      return
    }
    player.value.src = url
  }

  return {
    videoRef,
    list,
    changeVideo,
    player
  }
}
