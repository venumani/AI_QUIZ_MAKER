import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/quiz': 'http://127.0.0.1:8000',
      '/pdf': 'http://127.0.0.1:8000',
      '/student': 'http://127.0.0.1:8000',
      '/teacher': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/leaderboard': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000'
    }
  }
})
