
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración de Vite para React y Spring Boot.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
