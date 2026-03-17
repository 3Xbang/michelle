import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/mira/',
  plugins: [vue()],
  server: {
    proxy: {
      '/mira/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mira/, '')
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
