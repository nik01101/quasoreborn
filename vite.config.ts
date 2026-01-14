import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.browser': true,
    global: 'globalThis',
  },
  resolve: {
    alias: [
      { find: /^node:.*$/, replacement: 'path-browserify' },
      { find: 'fs', replacement: 'path-browserify' },
      { find: 'path', replacement: 'path-browserify' },
      { find: 'os', replacement: 'path-browserify' },
      { find: 'crypto', replacement: 'path-browserify' },
      { find: 'stream', replacement: 'path-browserify' },
      { find: 'vm', replacement: 'path-browserify' },
      { find: 'url', replacement: 'path-browserify' },
      { find: 'buffer', replacement: 'buffer' },
    ]
  },
  optimizeDeps: {
    exclude: ['@aws-amplify/backend'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
