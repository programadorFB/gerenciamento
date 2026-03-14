import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/user': 'http://localhost:5000',
      '/transactions': 'http://localhost:5000',
      '/balance': 'http://localhost:5000',
      '/betting-profiles': 'http://localhost:5000',
      '/objectives': 'http://localhost:5000',
      '/analytics': 'http://localhost:5000',
      '/stats': 'http://localhost:5000',
      '/betting-sessions': 'http://localhost:5000',
      '/dashboard': 'http://localhost:5000',
      '/categories': 'http://localhost:5000',
      '/game-types': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    }
  }
})
