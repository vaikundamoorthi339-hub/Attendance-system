import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // Ithu dev server start aagum pothu default browser ah open pannidum
  }
})