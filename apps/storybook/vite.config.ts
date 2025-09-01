import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'app': path.resolve(__dirname, '../../packages/app'),
    },
  },
  optimizeDeps: {
    include: ['app'],
  },
});
