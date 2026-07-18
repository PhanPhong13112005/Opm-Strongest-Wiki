import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    watch: {
      // .NET creates and locks temporary build files on Windows. They are not
      // frontend dependencies, so Vite must not try to watch them.
      ignored: [
        '**/backend/**/bin/**',
        '**/backend/**/obj/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
