import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules\\three')) {
            return 'three'
          }
          if (id.includes('@react-three')) return 'react-three'
          if (id.includes('node_modules/motion') || id.includes('node_modules\\motion') || id.includes('framer-motion')) {
            return 'motion'
          }
        },
      },
    },
  },
})
