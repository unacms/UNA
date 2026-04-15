const path = require('path'); // Импорт path
const webpack = require('webpack');
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const { ImageRemotePatterns } = require('app/settings/images_allowlist');
// Импортируем и выполняем копирование ресурсов
const fs = require('fs');
// Функция копирования ресурсов
function copyCustomizationResources() {
    const customizationRoot = path.resolve(__dirname, '../../packages/app/customization');
    const resourcesSource = path.resolve(customizationRoot, 'resources/web');
    const staticDest = path.resolve(__dirname, 'public/static');

    // Создаем папку static
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
                // Копируем ТОЛЬКО в static/
                fs.copyFileSync(sourcePath, path.join(staticDest, file));
                copiedCount++;
            }
        });

        console.log(`✓ Customization: ${copiedCount} files copied to public/static/`);
    }
}

// Вызываем копирование ПЕРЕД импортом конфига
copyCustomizationResources();

const nextConfigCustom = require('app/customization/config/next.config');


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

const reanimatedPath = path.resolve(__dirname, 'node_modules/react-native-reanimated');

const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // Отключить source maps в production
    productionBrowserSourceMaps: false,
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
        // Добавляем алиасы
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
            'react-native-reanimated': reanimatedPath,  // <-- Явно указываем версию 3.10.1
            'react-native-localize': path.resolve(__dirname, 'stubs/react-native-localize.js'),
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
            // Принудительно заменяем react-native-reanimated на версию 3.10.1
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
        disableStaticImages: false
    },
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
    merge(nextConfig, nextConfigCustom)
))
