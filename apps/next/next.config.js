const { withExpo } = require('@expo/next-adapter')
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
  poweredByHeader: false,
  /*experimental: {
    forceSwcTransforms: true,
    // scrollRestoration: true,
    swcPlugins: [[require.resolve('./plugins/swc_plugin_reanimated.wasm')]],
  },*/
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'zeego',
    'dripsy',
    '@dripsy/core',
    'moti',
    'app',
    'react-native-reanimated',
    'nativewind',
    '@expo/html-elements',
    'react-native-gesture-handler',
    'react-native-reactions',
    '@babel/core',
    '@babel/plugin-proposal-export-namespace-from',
   // '@react-navigation/native',
    'react-native-calendars',
    'react-native-image-zoom-viewer',
    'react-native-image-pan-zoom',
    'react-native-swipe-gestures',
    'expo-haptics',
    'expo-modules-core',
    'recyclerlistview',
    'react-native-quick-md5',
    '@react-native-picker/picker',
    '@react-native-community/clipboard',
    'expo-image-picker',
    'expo-document-picker',
    'react-native-svg',
    'expo-image-manipulator',
    'react-native-svg-transformer',
    'expo-constants',
  ],
  images: {
    domains: ['ci.una.io', 'app.una.io', 'www.una0.ru', 'una0.ru', 'anton.una.io', 'trident.me', 'us-east-1.linodeobjects.com', 'hihi.com', 'una.so'],
    disableStaticImages: false
  },
  /*modularizeImports: {
    "@phosphor-icons/react": {
      transform: "@phosphor-icons/react/{{member}}",
    },
  } */ 
}

module.exports = withExpo(merge(nextConfig, nextConfigCustom))
