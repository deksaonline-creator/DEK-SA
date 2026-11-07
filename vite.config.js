import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/omi-ws': {
        target: 'ws://localhost:5100',
        ws: true,
        changeOrigin: true
      },
      '/api/news': {
        target: 'http://web.sa.ac.th',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/index.php/prachasamphanth/news')
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
