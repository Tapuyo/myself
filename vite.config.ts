import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev only: forwards /api/* to `vercel dev` (run separately on :3000),
    // since `vercel dev`'s own frontend proxy currently mishandles index.html.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
