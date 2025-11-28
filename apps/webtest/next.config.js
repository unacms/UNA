/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 Cache Components (Partial Prerendering)
  cacheComponents: true,
  
  // React Compiler (moved from experimental in Next.js 16)
  reactCompiler: true,

  // Transpile shared packages
  transpilePackages: ['@neo/test-components'],

  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Alias for shared test components
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

  // TypeScript paths
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
