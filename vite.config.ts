import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/gcc-portfolio-footprint-modeller/").
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173, open: false },
})
