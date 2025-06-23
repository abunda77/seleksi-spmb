import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/seleksi': {
        target: 'https://bantulkab.spmb.id',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ['seleksi-spmb.produkmastah.com'],
  },
})
