const path = require('path'); // path import
const webpack = require('webpack');
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const { ImageRemotePatterns } = require('app/settings/images_allowlist');
// Import and run resource copying
const fs = require('fs');
// Resource copy helper
function copyCustomizationResources() {
    const customizationRoot = path.resolve(__dirname, '../../packages/app/customization');
    const resourcesSource = path.resolve(customizationRoot, 'resources/web');
    const staticDest = path.resolve(__dirname, 'public/static');

    // Create static folder
    if (!fs.existsSync(staticDest)) {
        fs.mkdirSync(staticDest, { recursive: true });
    }

    if (fs.existsSync(resourcesSource)) {
        const files = fs.readdirSync(resourcesSource);
        let copiedCount = 0;

        files.forEach(file => {
            if (file.endsWith('.bak')) return;

            const sourcePath = path.join(resourcesSource, file);
            const stat = fs.statSync(sourcePath);

            if (stat.isFile()) {
                // Copy ONLY into static/
                fs.copyFileSync(sourcePath, path.join(staticDest, file));
                copiedCount++;
            }
        });

    }

    // Client projects reference /static/* in metadata; copy repo defaults when
    // customization/resources/web does not supply overrides.
    const staticDefaults = [
        { src: path.resolve(__dirname, 'public/manifest.json'), dest: 'manifest.json' },
        { src: path.resolve(__dirname, 'public/favicon.svg'), dest: 'favicon.svg' },
    ];
    staticDefaults.forEach(({ src, dest }) => {
        const destPath = path.join(staticDest, dest);
        if (!fs.existsSync(destPath) && fs.existsSync(src)) {
            fs.copyFileSync(src, destPath);
        }
    });
}

// Run copy BEFORE loading config
copyCustomizationResources();

const nextConfigCustom = require('app/customization/config/next.config');


/** @type {import('next').NextConfig} */
// Monorepo path — check local node_modules first, then root
const workspaceRoot = path.resolve(__dirname, '../..');
const tenPlayWebviewLocalPath = path.resolve(__dirname, 'node_modules/@10play/react-native-web-webview');
const tenPlayWebviewRootPath = path.resolve(workspaceRoot, 'node_modules/@10play/react-native-web-webview');
const tenPlayWebviewPath = require('fs').existsSync(tenPlayWebviewLocalPath)
    ? path.resolve(tenPlayWebviewLocalPath, 'lib/module/index.js')
    : path.resolve(tenPlayWebviewRootPath, 'lib/module/index.js');
const tenPlayWebviewShimPath = require('fs').existsSync(tenPlayWebviewLocalPath)
    ? path.resolve(tenPlayWebviewLocalPath, 'lib/module/shim.js')
    : path.resolve(tenPlayWebviewRootPath, 'lib/module/shim.js');

const reanimatedPath = path.resolve(__dirname, 'node_modules/react-native-reanimated');

const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // Disable source maps in production
    productionBrowserSourceMaps: false,
    /*experimental: {
      ppr: true,
    },*/
    experimental: {
        staleTimes: {
            dynamic: 0,
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
    allowedDevOrigins: ['yasko.local', 'neo.localhost', 'bs-local.com'],
    /*experimental: {
      forceSwcTransforms: true,
      // scrollRestoration: true,
      swcPlugins: [[require.resolve('./plugins/swc_plugin_reanimated.wasm')]],
    },*/
    transpilePackages: [

        'react-native',
        'react-native-web',
        'solito',
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
        'jotai',
        '@react-native-picker/picker',
        '@10play/tentap-editor',
        '@10play/react-native-web-webview',
        '@appandflow/react-native-google-autocomplete',
        'semver',
        'react-native-webview',
        'expo',
        'expo-audio',
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
        'lucide-react-native',
        'web-haptics',
    ],
    webpack: (config, { isServer }) => {
        // Add aliases
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-native': 'react-native-web',
            'react-native-webview': tenPlayWebviewPath,
            'react-native-webview$': tenPlayWebviewPath,
            'jotai': path.resolve(workspaceRoot, 'node_modules/jotai'),
            'crypto': 'expo-crypto',
            'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
            'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
            'react-native/Libraries/Utilities/codegenNativeComponent$': tenPlayWebviewShimPath,
            'react-native-reanimated': reanimatedPath,  // <-- Pin version 3.10.1
            'react-native-localize': path.resolve(__dirname, 'stubs/react-native-localize.js'),
        };

        // Add fallback for codegenNativeComponent
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
        };

        // Put local node_modules FIRST in resolve.modules
        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),  // <-- FIRST: local 3.10.1
            ...(config.resolve.modules || []).filter(m =>
                m !== path.resolve(__dirname, 'node_modules') &&
                m !== path.resolve(workspaceRoot, 'node_modules')
            ),
            path.resolve(workspaceRoot, 'node_modules'),  // <-- Then root (may contain 4.1.3)
        ];

        // Force module replacement via NormalModuleReplacementPlugin
        config.plugins = config.plugins || [];
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.EXPO_OS': JSON.stringify('web'),
            }),
            new webpack.NormalModuleReplacementPlugin(
                /^react-native-webview$/,
                (resource) => {
                    // Replace with web build for all imports (especially from @10play/tentap-editor)
                    resource.request = tenPlayWebviewPath;
                }
            ),
            // Force react-native-reanimated to version 3.10.1
            new webpack.NormalModuleReplacementPlugin(
                /^react-native-reanimated$/,
                (resource) => {
                    resource.request = reanimatedPath;
                }
            )
        );

        config.module.rules.push({
            test: /\.(mp3|wav)$/,
            type: 'asset/resource',
        });

        return config;
    },
    images: {
        remotePatterns: ImageRemotePatterns,
        disableStaticImages: false,
        // Keep optimized variants warm so browse grids don't re-hit the optimizer on every visit.
        minimumCacheTTL: 60 * 60 * 24,
        // Card thumbnails never need 3840w; dropping the top sizes avoids expensive optimizer failures.
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
    merge(nextConfig, nextConfigCustom)
))
