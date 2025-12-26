"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/translation';
import { useEffect, useMemo } from 'react'
import Subscriber from 'app/ui/molecules/subscriber';
import { useLayoutSettings } from 'app/context/layout-settings';
import { fontVars } from 'app/design/fonts/fonts-web';
import { mainFont } from 'app/design/fonts/fonts-web-default';
import { appSetting } from 'app/lib/util';
import 'app/styles/global.default.css'
import 'app/styles/global.css'

// Suppress shadow* deprecation warnings from third-party libraries (react-native-toast-message)
// until they update to use boxShadow
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const message = args[0]?.toString() || '';
        if (message.includes('"shadow*" style props are deprecated. Use "boxShadow".')) {
            return; // Suppress this specific warning
        }
        originalWarn(...args);
    };
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 3 * 60 * 1000, // ✅ Уменьшить до 3 минут
            refetchOnWindowFocus: false,
        },
    },
});

export default function RootLayout({ children }) {
    const { langCode } = useLayoutSettings();

    // Initialize i18n in useEffect to avoid setState during render
    useEffect(() => {
        if (!i18n.isInitialized) {
            i18n
                .use(initReactI18next)
                .init({
                    compatibilityJSON: 'v3',
                    resources: resources,
                    lng: langCode, // default language
                    fallbackLng: 'en',
                    interpolation: {
                        escapeValue: false
                    }
                });
        }
    }, [langCode]);

    return (
        <html lang={langCode} className={`${fontVars} ${mainFont.className}`}>
            <body className={appSetting('layout', 'body')}>
                <QueryClientProvider client={queryClient}>
                    <Analytics />
                    <SpeedInsights />
                        {children}
                    <Subscriber />
                </QueryClientProvider>
            </body>
        </html>
    )
}
