const path = require('path'); // Импорт path
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const nextConfigCustom = require('./next.config.custom.js');
const webpackLib = require('webpack');
//const MillionCompiler = require('@million/lint');


/** @type {import('next').NextConfig} */
const tenPlayWebviewPath = path.resolve(__dirname, 'node_modules/@10play/react-native-web-webview/lib/module/index.js');
const tenPlayWebviewShimPath = path.resolve(__dirname, 'node_modules/@10play/react-native-web-webview/lib/module/shim.js');
const reanimatedWebPath = path.resolve(__dirname, 'node_modules/react-native-reanimated');

const nextConfig = {
  assetPrefix: '',
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
      optimizeCss: false, // Reduce CSS preload warnings without disabling splitting
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
    'app',
    'react-native',
    'react-native-web',
    'solito',
    'react-native-reanimated',
    'nativewind',
    "react-native-css-interop",
    '@expo/html-elements',
    'react-native-gesture-handler',
    '@react-native-clipboard/clipboard',
    '@babel/core',
    '@react-navigation/native',
    '@tailwindcss/container-queries',
    'react-native-calendars',
    'react-native-image-pan-zoom',
    'react-native-swipe-gestures',
    'expo-haptics',
    'expo-linear-gradient',
    'expo-modules-core',
    'recyclerlistview',
    'expo-crypto',
    '@react-native-picker/picker',
    '@10play/tentap-editor',
    '@10play/react-native-web-webview',
    'expo',
    'expo-image-picker',
    'expo-location',
    'expo-camera',
    'country-codes-flags-phone-codes',
    '@appandflow/react-native-google-autocomplete',
    'react-native-country-flag',
    'expo-document-picker',
    'expo-constants',
    "react-native-svg",
    '@expo/metro-runtime',
    'i18next',
    'react-i18next',
    'react-native-localize',
    'victory-native',
    'react-native-star-rating-widget',
    '@openspacelabs/react-native-zoomable-view',
    '@rn-primitives/tabs',
    '@rn-primitives/switch',
    '@rn-primitives/checkbox',
    '@rn-primitives/radio-group',
  ],
  webpack: (config, { isServer }) => {
    // Add optimization
    config.optimization = {
      ...config.optimization,
      concatenateModules: true,
      minimize: true,
    };

    // Existing webpack config
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': 'react-native-web',
      'react-native-webview': tenPlayWebviewPath,
      'react-native-webview$': tenPlayWebviewPath,
      'react-native-reanimated': reanimatedWebPath,
      'react-native-reanimated$': reanimatedWebPath,
      'crypto': 'expo-crypto',
      'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
      'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
      'react-native/Libraries/Utilities/codegenNativeComponent$': tenPlayWebviewShimPath,
    };

    // Добавляем fallback для codegenNativeComponent
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
    };

    // Define EXPO_OS to silence expo-modules-core warning
    config.plugins.push(new webpackLib.DefinePlugin({
        'process.env.EXPO_OS': JSON.stringify('web'),
    }));

    // Ignore incorrect re-exports warnings from expo-image-manipulator
    config.module.parser = {
        ...config.module.parser,
        javascript: { exportsPresence: 'warn' },
    };

    // Exclude expo-image-manipulator from being processed on web
    config.externals = config.externals || [];
    config.externals.push({
      'expo-image-manipulator': 'commonjs expo-image-manipulator',
    });

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
      },
       {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**',
      },
       {
        protocol: 'https',
        hostname: 'linguria.una.io',
        pathname: '**',
      }
    ],
    disableStaticImages: false
  },
  compress: true,
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
  merge(nextConfig, nextConfigCustom)
))
