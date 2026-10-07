import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Mismo criterio que PORT en apps/api/src/server.ts: configurable por env
// (API_PORT=...) en vez de un puerto fijo, porque ya pasó que 4000 estaba
// ocupado en otro dispositivo — acá también default a 5000.
const apiPort = process.env.API_PORT ?? '5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
})
