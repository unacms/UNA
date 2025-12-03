const path = require('path'); // Импорт path
const webpack = require('webpack');
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const nextConfigCustom = require('./next.config.custom.js');


/** @type {import('next').NextConfig} */
// Путь в монорепо - проверяем сначала локальный node_modules, потом корневой
const workspaceRoot = path.resolve(__dirname, '../..');
const tenPlayWebviewLocalPath = path.resolve(__dirname, 'node_modules/@10play/react-native-web-webview');
const tenPlayWebviewRootPath = path.resolve(workspaceRoot, 'node_modules/@10play/react-native-web-webview');
const tenPlayWebviewPath = require('fs').existsSync(tenPlayWebviewLocalPath) 
  ? path.resolve(tenPlayWebviewLocalPath, 'lib/module/index.js')
  : path.resolve(tenPlayWebviewRootPath, 'lib/module/index.js');
const tenPlayWebviewShimPath = require('fs').existsSync(tenPlayWebviewLocalPath)
  ? path.resolve(tenPlayWebviewLocalPath, 'lib/module/shim.js')
  : path.resolve(tenPlayWebviewRootPath, 'lib/module/shim.js');

// Reanimated is no longer used on web - all components have .web.js versions
// We stub it out to prevent any accidental imports from crashing
const reanimatedStubPath = path.resolve(__dirname, 'stubs/react-native-reanimated.js');

// Bottom sheet is also not used on web - components use Modal instead
const bottomSheetStubPath = path.resolve(__dirname, 'stubs/gorhom-bottom-sheet.js');

const nextConfig = {
  env: {
    EXPO_OS: 'web',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
    //reactCompiler: true,
     reactCompiler: true,
  // TODO: Can potentially enable strict mode now that reanimated is removed from web
  // Previously disabled due to reanimated/Moti issues
  reactStrictMode: false,
  poweredByHeader: false,
  // Enable source maps for production to help with debugging and Lighthouse insights
  productionBrowserSourceMaps: true,
  transpilePackages: [
    
    'react-native',
    'react-native-web',
    'solito',
    'nativewind',
    "react-native-css-interop",
    '@expo/html-elements',
    'react-native-gesture-handler',
    '@react-native-clipboard/clipboard',
    '@babel/core',
    '@react-navigation/native',
    'react-native-calendars',
    'react-native-image-pan-zoom',
    'react-native-swipe-gestures',
    'react-native-toast-message',
    'expo-haptics',
    'expo-modules-core',
    'recyclerlistview',
    'expo-crypto',
    '@react-native-picker/picker',
    '@10play/tentap-editor',
    '@10play/react-native-web-webview',
    '@appandflow/react-native-google-autocomplete',
    'semver',
    'react-native-webview',
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
    '@openspacelabs/react-native-zoomable-view',
    'lucide-react-native'
  ],
  webpack: (config, { isServer }) => {
    // Добавляем алиасы
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': 'react-native-web',
      'react-native-webview': tenPlayWebviewPath,
      'react-native-webview$': tenPlayWebviewPath,
      'crypto': 'expo-crypto',
      'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
      'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
      'react-native/Libraries/Utilities/codegenNativeComponent$': tenPlayWebviewShimPath,
      'react-native-reanimated': reanimatedStubPath,  // Stub - reanimated not used on web
      '@gorhom/bottom-sheet': bottomSheetStubPath,  // Stub - bottom sheet not used on web
    };

    // Добавляем fallback для codegenNativeComponent
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
    };

    // ИЗМЕНИТЕ порядок resolve.modules - локальный node_modules должен быть ПЕРВЫМ
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),  // <-- ПЕРВЫМ! Локальная версия 3.10.1
      ...(config.resolve.modules || []).filter(m => 
        m !== path.resolve(__dirname, 'node_modules') && 
        m !== path.resolve(workspaceRoot, 'node_modules')
      ),
      path.resolve(workspaceRoot, 'node_modules'),  // <-- Потом корневой (может содержать 4.1.3)
    ];

    // Используем NormalModuleReplacementPlugin для принудительной замены
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^react-native-webview$/,
        (resource) => {
          // Заменяем на веб-версию для всех импортов (особенно из @10play/tentap-editor)
          resource.request = tenPlayWebviewPath;
        }
      ),
      // Stub out react-native-reanimated - not used on web
      new webpack.NormalModuleReplacementPlugin(
        /^react-native-reanimated$/,
        (resource) => {
          resource.request = reanimatedStubPath;
        }
      ),
      // Stub out @gorhom/bottom-sheet - not used on web
      new webpack.NormalModuleReplacementPlugin(
        /^@gorhom\/bottom-sheet$/,
        (resource) => {
          resource.request = bottomSheetStubPath;
        }
      )
    );

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
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
  merge(nextConfig, nextConfigCustom)
))
