const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile shared packages (works for both webpack and turbopack)
  transpilePackages: ['@neo/test-components'],

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Webpack configuration for production builds
  webpack: (config) => {
    // Resolve @neo/test-components from monorepo packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@neo/test-components': path.resolve(__dirname, '../../packages/test-components/src'),
    }

    // Resolve extensions for web-specific files
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts', 
      '.web.js',
      '.tsx',
      '.ts',
      '.js',
      ...config.resolve.extensions,
    ]

    return config
  },

  // Turbopack configuration (dev mode with Next.js 15+)
  turbopack: {
    resolveAlias: {
      '@neo/test-components': '../../packages/test-components/src',
    },
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.tsx',
      '.ts',
      '.js',
    ],
  },
}

module.exports = nextConfig
