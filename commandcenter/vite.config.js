import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['cc.faithconnect.us'],
    proxy: {
      '/api/local': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // MiroTalk service API
      '/api/mirotalk': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Spring Boot API for BookStack sync
      '/api/sync': {
        target: 'http://cc-bookstack-sync:8080',
        changeOrigin: true,
      },
      '/api/books': {
        target: 'http://cc-bookstack-sync:8080',
        changeOrigin: true,
      },
      '/api/debug': {
        target: 'http://cc-bookstack-sync:8080',
        changeOrigin: true,
      }
    }
  },
  preview: {
    allowedHosts: ['cc.faithconnect.us']
  }
})
