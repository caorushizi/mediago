import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({ 
  root: __dirname,
  server: {
    port: 8555,
    strictPort: true
  },
  resolve: {
    alias: [
      { find: /^types/, replacement: resolve(__dirname, '../src/types') },
      { find: /^~/, replacement: '' }
    ]
  },
  envDir: '../../',
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  }
})
