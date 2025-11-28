const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression (for self-hosted; Vercel handles this automatically)
  compress: true,

  // Next.js 16 Cache Components (enables 'use cache' directive)
  cacheComponents: true,

  // Transpile shared packages (works for both webpack and turbopack)
  transpilePackages: ['@neo/test-components'],

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // SWC compiler configuration - target modern browsers only
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports - tree-shake and reduce bundle size
    optimizePackageImports: ['@base-ui-components/react'],
    // Optimize CSS loading
    optimizeCss: true,
  },

  // Webpack configuration for production builds
  webpack: (config, { isServer }) => {
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

    // Optimize chunks for fewer HTTP requests
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // Bundle all Base UI into a single chunk
            baseui: {
              test: /[\\/]node_modules[\\/]@base-ui-components[\\/]/,
              name: 'baseui',
              chunks: 'all',
              priority: 30,
            },
            // Bundle common vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      }
    }

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
