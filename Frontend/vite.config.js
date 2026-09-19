import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward all /api/* requests to the Express backend during dev
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/generated_reels': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
