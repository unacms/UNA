/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

// Settings from https://v2.tauri.app/start/frontend/vite/
const host = process.env.TAURI_DEV_HOST;

// xymbols' dist folder, wherever the install put the version this app asks for (NEO's packages
// pin another): components/animated-icon.tsx loads its icons from there one by one
const xymbolsDist = dirname(createRequire(import.meta.url).resolve('xymbols'));

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { 'xymbols-dist': xymbolsDist } },
    // Settings > About
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    clearScreen: false, // keep Rust errors on screen
    server: {
        port: 1420,
        strictPort: true, // tauri.conf.json devUrl names this port
        host: host || false,
        hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
        watch: { ignored: ['**/src-tauri/**'] },
    },
    envPrefix: ['VITE_', 'TAURI_ENV_*'],
    build: {
        // WebView2 on Windows, WebKit elsewhere
        target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
        minify: !process.env.TAURI_ENV_DEBUG,
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        setupFiles: ['src/test-setup.ts'],
        restoreMocks: true,
        testTimeout: 20000, // see src/test-setup.ts
    },
});
