import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local dev, proxy API calls to the Express server so the
// front-end and back-end can run together with one command.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
})
