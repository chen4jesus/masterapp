import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/local': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Spring Boot API for BookStack sync
      '/api/sync': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/books': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/debug': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      }
    }
  }
})
