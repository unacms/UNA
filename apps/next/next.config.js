const path = require('path'); // path import
const webpack = require('webpack');
const { withExpo } = require('@expo/next-adapter')
const merge = require('deepmerge');
const { ImageRemotePatterns } = require('app/settings/images-allowlist');
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

// Static web icons: public/lucide/<strokeWidth>/<Name>.svg (see lib/generate-lucide-icons.js).
require('./lib/generate-lucide-icons').generateLucideIcons();

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

const workspaceResolvePaths = [
    __dirname,
    workspaceRoot,
    path.resolve(__dirname, '../expo'),
];

// Yarn may hoist these to root, apps/next, apps/expo, or nest them under the
// parent package. Vercel clean installs do not match a local Windows layout.
function resolveFromPackage(pkg, subpath) {
    const pkgRoots = workspaceResolvePaths.map((base) =>
        path.resolve(base, 'node_modules', pkg)
    );
    for (const root of pkgRoots) {
        const full = path.join(root, subpath);
        if (fs.existsSync(full)) return full;
    }
    try {
        const pkgJson = require.resolve(`${pkg}/package.json`, {
            paths: workspaceResolvePaths,
        });
        const full = path.join(path.dirname(pkgJson), subpath);
        if (fs.existsSync(full)) return full;
    } catch {
        // fall through
    }
    return path.join(pkgRoots[1], subpath);
}

function replaceEnrichedHtmlHook(fileStem, shimFile) {
    return new webpack.NormalModuleReplacementPlugin(
        new RegExp(`${fileStem}(?:\\.(?:js|ts))?$`),
        (resource) => {
            const ctx = resource.context || '';
            const req = String(resource.request || '');
            if (!ctx.includes('react-native-enriched-html')) return;
            if (ctx.includes(`${path.sep}shims`) || ctx.includes('/shims/')) return;
            if (req.includes('-real') || req.includes('enriched-use-')) return;
            resource.request = path.resolve(__dirname, 'shims', shimFile);
        }
    );
}

// Реальный @tiptap/react (используется веб-сборкой react-native-enriched-html).
// Подключается отдельным alias, чтобы шим '@tiptap/react' не вызывал сам себя.
const tiptapReactRealPath = resolveFromPackage('@tiptap/react', 'dist/index.js');
const enrichedUseOnEditorChangeRealPath = resolveFromPackage(
    'react-native-enriched-html',
    'lib/module/web/useOnEditorChange.js'
);
const enrichedUseMentionEventsRealPath = resolveFromPackage(
    'react-native-enriched-html',
    'lib/module/web/pmPlugins/MentionPlugin/useMentionEvents.js'
);

const md4cEmscriptenLocalPath = path.resolve(
    __dirname,
    'node_modules/react-native-enriched-markdown/lib/module/web/wasm/md4c.js'
);
const md4cEmscriptenRootPath = path.resolve(
    workspaceRoot,
    'node_modules/react-native-enriched-markdown/lib/module/web/wasm/md4c.js'
);
const md4cEmscriptenSourcePath = fs.existsSync(md4cEmscriptenLocalPath)
    ? md4cEmscriptenLocalPath
    : md4cEmscriptenRootPath;

// md4c.js — UMD/CJS Emscripten-бандл, но lib/module/package.json пакета содержит
// {"type":"module"}, из-за чего webpack парсит его как ESM и теряет module.exports.
// Копируем в .cjs вне scope пакета — webpack всегда собирает .cjs как CommonJS.
const md4cEmscriptenRealPath = path.resolve(__dirname, 'shims/md4c-emscripten.cjs');
if (fs.existsSync(md4cEmscriptenSourcePath)) {
    const srcStat = fs.statSync(md4cEmscriptenSourcePath);
    const needCopy =
        !fs.existsSync(md4cEmscriptenRealPath) ||
        fs.statSync(md4cEmscriptenRealPath).size !== srcStat.size;
    if (needCopy) {
        fs.copyFileSync(md4cEmscriptenSourcePath, md4cEmscriptenRealPath);
    }
}

const allowLocalImageIPs = ['1', 'true'].includes(process.env.NEO_IMAGES_ALLOW_LOCAL_IP);
if (allowLocalImageIPs) {
    console.warn('NEO_IMAGES_ALLOW_LOCAL_IP is on: next/image fetches from private IPs (SSRF risk). Local development only.');
}

const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // React Compiler (client bundle only). Components that violate the Rules of
    // React are skipped, not broken — `yarn lint` (react-hooks/*) lists them.
    // Opt a file/component out with the 'use no memo' directive. Forks can
    // disable it via customization/config/next.config.js (`reactCompiler: false`).
    reactCompiler: true,
    // Bridge non-public GOOGLE_WEB_CLIENT_ID into the client bundle so SSR and
    // hydration agree on whether Google auth (and the OR separator) render.
    // Prefer NEXT_PUBLIC_* when set; fall back to the server-only name used in .env.
    env: {
        NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID:
            process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
            process.env.GOOGLE_WEB_CLIENT_ID ||
            '',
        // Preview backends (see UNA_PREVIEW_DOMAIN in proxy.js); the browser needs it for
        // the image allowlist. Only the domain, never the key.
        NEXT_PUBLIC_UNA_PREVIEW_DOMAIN:
            process.env.NEXT_PUBLIC_UNA_PREVIEW_DOMAIN ||
            process.env.UNA_PREVIEW_DOMAIN ||
            '',
    },
    // Disable source maps in production
    productionBrowserSourceMaps: false,
    /*experimental: {
      ppr: true,
    },*/
    experimental: {
        // Short client RSC cache so pointer-down prefetch of dynamic pages
        // (profiles) is reused on click. 0 made every tap wait on UNA again.
        staleTimes: {
            dynamic: 20,
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
    async rewrites() {
        return {
            // Only when no public/lucide file matches: stroke widths that were not
            // generated, or Lucide names newer than the generated set. afterFiles,
            // not fallback: fallback runs after dynamic routes, and [...path] would
            // take the request first.
            afterFiles: [
                {
                    source: '/lucide/:strokeWidth(\\d+)/:icon([A-Z][A-Za-z0-9]*).svg',
                    destination: '/api/icon?icon=:icon&strokeWidth=:strokeWidth',
                },
            ],
        };
    },
    async headers() {
        return [
            {
                // File names are not versioned, so a Lucide upgrade must reach browsers.
                source: '/lucide/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
            },
        ];
    },
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
        'expo-router',
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
        'react-native-webview',
        'expo',
        'expo-audio',
        'expo-image-picker',
        'expo-location',
        'expo-camera',
        'expo-document-picker',
        'expo-image-manipulator',
        'react-native-enriched-markdown',
        '@mdxeditor/editor',
        'expo-constants',
        "react-native-svg",
        '@expo/metro-runtime',
        'i18next',
        'react-i18next',
        'react-native-enriched-html',
        'react-native-localize',
        'victory-native',
        '@stripe/stripe-react-native',
        'react-native-star-rating-widget',
        '@openspacelabs/react-native-zoomable-view',
        'lucide-react-native',
        'web-haptics',
        '@tanstack/ai-react',
        '@tanstack/ai-client',
        '@tanstack/ai',
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
            'react-native-localize': path.resolve(__dirname, 'stubs/react-native-localize.js'),
            // Native-only. NeoButton web uses neo-button-expoui.web.ts; this is a
            // backstop if webpack ever follows .ios.js / .android.js.
            '@expo/ui': path.resolve(__dirname, 'stubs/expo-ui.js'),
            '@expo/ui/swift-ui': path.resolve(__dirname, 'stubs/expo-ui.js'),
            '@expo/ui/swift-ui/modifiers': path.resolve(__dirname, 'stubs/expo-ui.js'),
            '@expo/ui/jetpack-compose': path.resolve(__dirname, 'stubs/expo-ui.js'),
            '@expo/ui/jetpack-compose/modifiers': path.resolve(__dirname, 'stubs/expo-ui.js'),
            // Shim forces immediatelyRender: false (see shims/tiptap-react.js).
            // '$' — точное совпадение, поэтому '@tiptap/react/menus' и пр. не трогаем.
            '@tiptap/react$': path.resolve(__dirname, 'shims/tiptap-react.js'),
            '@tiptap-react-real$': tiptapReactRealPath,
            '@enriched-use-on-editor-change-real$': enrichedUseOnEditorChangeRealPath,
            '@enriched-use-mention-events-real$': enrichedUseMentionEventsRealPath,
            'md4c-emscripten-real$': md4cEmscriptenRealPath,
        };

        // Add fallback for codegenNativeComponent
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'react-native/Libraries/Utilities/codegenNativeComponent': tenPlayWebviewShimPath,
        };

        // Local node_modules first so packages installed under apps/next
        // (e.g. react-native-svg) win over root-hoisted copies.
        config.resolve.modules = [
            path.resolve(__dirname, 'node_modules'),
            ...(config.resolve.modules || []).filter(m =>
                m !== path.resolve(__dirname, 'node_modules') &&
                m !== path.resolve(workspaceRoot, 'node_modules')
            ),
            path.resolve(workspaceRoot, 'node_modules'),
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
            // Fix Emscripten CJS default export for react-native-enriched-markdown WASM parser.
            // parseMarkdown uses dynamic import('./wasm/md4c') — request is relative, not full path.
            new webpack.NormalModuleReplacementPlugin(
                /^\.\/wasm\/md4c$/,
                path.resolve(__dirname, 'shims/md4c.js')
            ),
            new webpack.NormalModuleReplacementPlugin(
                /^@expo\/ui(\/.*)?$/,
                path.resolve(__dirname, 'stubs/expo-ui.js')
            ),
            // Null-guard TipTap hooks (editor is null on the first Next.js frame).
            // In-repo shims so a clean Vercel install does not need patch-package.
            replaceEnrichedHtmlHook('useOnEditorChange', 'enriched-use-on-editor-change.js'),
            replaceEnrichedHtmlHook('useMentionEvents', 'enriched-use-mention-events.js')
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
        // Local development against a UNA on localhost or a LAN address. Next 16 refuses
        // upstream images that resolve to a private IP (SSRF protection); never set in production.
        dangerouslyAllowLocalIP: allowLocalImageIPs,
    },
}
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})

module.exports = withExpo(withBundleAnalyzer(
    merge(nextConfig, nextConfigCustom)
))
