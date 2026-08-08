import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { decodeAssetUrlForLocalServer } from './src/utils/assetUrl.js'

const encodedPlusAssetCompatibility = () => ({
  name: 'encoded-plus-asset-compatibility',
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (request.url) request.url = decodeAssetUrlForLocalServer(request.url)
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (request.url) request.url = decodeAssetUrlForLocalServer(request.url)
      next()
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [encodedPlusAssetCompatibility(), vue()],
  build: {
    // Support Safari 14+ (iOS 14.5+/15.x on iPhone 7 Plus and similar devices).
    target: ['es2020', 'safari14'],
  },
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
