const { withExpo } = require('@expo/next-adapter')
const withPlugins = require('next-compose-plugins')
const withImages = require('next-images')
const withTM = require('next-transpile-modules')([
  'solito',
  'zeego',
  'dripsy',
  '@dripsy/core',
  "@shopify/flash-list",
  "recyclerlistview",
  'moti',
  'nativewind',
  'app',
])

const merge = require('deepmerge');
const nextConfigCustom = require('./next.config.custom.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reanimated (and thus, Moti) doesn't work with strict mode currently...
  // https://github.com/nandorojo/moti/issues/224
  // https://github.com/necolas/react-native-web/pull/2330
  // https://github.com/nandorojo/moti/issues/224
  // once that gets fixed, set this back to true
  reactStrictMode: false,
  webpack5: true,
  experimental: {
    forceSwcTransforms: true,
    // scrollRestoration: true,
    swcPlugins: [[require.resolve('./plugins/swc_plugin_reanimated.wasm')]],
  },
  images: {
    domains: ['ci.una.io', 'app.una.io', 'www.una0.ru', 'una0.ru', 'anton.una.io', 'trident.me', 'us-east-1.linodeobjects.com', 'hihi.com', 'una.so'],
    disableStaticImages: true
  }
}
console.log(merge(nextConfig, nextConfigCustom));
module.exports = withPlugins([withTM, withExpo, withImages], merge(nextConfig, nextConfigCustom))
