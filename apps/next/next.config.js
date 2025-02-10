const path = require('path'); // Импорт path
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const nextConfigCustom = require('./next.config.custom.js');
//const MillionCompiler = require('@million/lint');


/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
    /*experimental: {
      ppr: true,
    },*/
    experimental: {
      staleTimes: {
        dynamic: 0,/* default 30, set to 0 to disable serverside case */
        static: 180,
      },
    },
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
    'react-native-reanimated',
    'nativewind',
    "react-native-css-interop",
    '@expo/html-elements',
    'react-native-gesture-handler',
    '@react-native-clipboard/clipboard',
    'react-native-reactions',
    '@babel/core',
    '@react-navigation/native',
    'react-native-calendars',
    'react-native-image-pan-zoom',
    'react-native-swipe-gestures',
    'expo-haptics',
    'expo-modules-core',
    'recyclerlistview',
    'expo-crypto',
    '@react-native-picker/picker',
    'expo',
    'expo-image-picker',
    'expo-location',
    'expo-camera',
    'expo-document-picker',
    'expo-image-manipulator',
    'expo-constants',
    "react-native-svg",
    '@expo/metro-runtime',
    'i18next',
    'react-i18next',
    'react-native-localize',
    'victory-native',
    '@stripe/stripe-react-native',
    'react-native-star-rating-widget',
    '@openspacelabs/react-native-zoomable-view'
  ],
  webpack: (config) => {
    config.resolve.alias['react-native-svg'] = path.resolve(__dirname, 'node_modules/react-native-svg');
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.neo.so',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ci.una.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'app.una.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'anton.una.io',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'us-east-1.linodeobjects.com',
        pathname: '**',
      }
    ],
    disableStaticImages: false
  },
  /*modularizeImports: {
    "@phosphor-icons/react": {
      transform: "@phosphor-icons/react/{{member}}",
    },
  } */ 
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
  merge(nextConfig, nextConfigCustom)
))
