import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/seleksi': {
        target: 'https://sleman.spmb.id',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://api.spmb.id',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    allowedHosts: ['seleksi-spmb.produkmastah.com'],
  },
})
