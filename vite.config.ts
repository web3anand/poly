import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  base: '/',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://poly-zeta.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
