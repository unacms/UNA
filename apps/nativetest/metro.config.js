const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch shared packages in monorepo
config.watchFolders = [monorepoRoot]

// Resolve modules from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Resolve @neo/test-components from packages
config.resolver.extraNodeModules = {
  '@neo/test-components': path.resolve(monorepoRoot, 'packages/test-components'),
}

// Apply Uniwind configuration
module.exports = withUniwindConfig(config, {
  // Path to global CSS file
  cssEntryFile: './src/global.css',
  // Path to auto-generated TypeScript definitions
  dtsFile: './src/uniwind-types.d.ts',
})






