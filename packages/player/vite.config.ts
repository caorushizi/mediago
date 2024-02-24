import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VantResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver(), ElementPlusResolver()]
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  envDir: '../..',
  server: {
    host: true,
    port: 8556,
    proxy: {
      '/api': {
        target: 'http://localhost:8433',
        changeOrigin: true
      },
      '/video': {
        target: 'http://localhost:8433',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../main/app/mobile'),
    emptyOutDir: true
  }
})
