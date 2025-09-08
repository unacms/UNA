import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      // Alias for app packages so Storybook can import from 'app/*'
      'app': path.resolve(__dirname, '../../packages/app'),
    },
  },
})
