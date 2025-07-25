import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env': JSON.stringify(process.env)
  },
  server: {
    port: 3000,
    proxy: {
      '/api/auth': {
        target: 'http://auth-service:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://api-gateway:28000',
        changeOrigin: true,
      },
    },
  },
}) 