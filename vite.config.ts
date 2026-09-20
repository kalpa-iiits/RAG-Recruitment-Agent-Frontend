import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // FastAPI backend — ./backend/run.sh serves it on 8501
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://127.0.0.1:8501',
        changeOrigin: true,
      },
    },
  },
})
