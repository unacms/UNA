const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip compression
  compress: true,

  // Next.js 16 Cache Components
  cacheComponents: true,

  // Transpile shared packages
  transpilePackages: ['@neo/test-components'],

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // SWC compiler configuration
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental optimizations
  experimental: {
    // Optimize HeroUI imports - tree-shake unused components
    optimizePackageImports: ['@heroui/react'],
    // Inline CSS
    inlineCss: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Resolve shared packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@neo/test-components': path.resolve(__dirname, '../../packages/test-components/src'),
    }

    // Web-specific file extensions
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

  // Turbopack configuration
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
