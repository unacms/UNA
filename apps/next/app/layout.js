"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/translation';
import { useEffect, useMemo, useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { StyleSheet } from 'react-native'
import Subscriber from 'app/ui/molecules/subscriber';
import { useLayoutSettings } from 'app/context/layout-settings';
import { fontVars } from 'app/design/fonts/fonts-web';
import { mainFont } from 'app/design/fonts/fonts-web-default';
import { appSetting } from 'app/lib/util';
import 'app/styles/global.default.css'
import 'app/styles/global.css'

// Initialize i18n synchronously before first render so useTranslation works reliably.
// (Match the native app pattern; language is updated in an effect.)
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });
}

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

export default function RootLayout({ children }) {
    const { langCode } = useLayoutSettings();
    const rnStyleSheetStateRef = useRef({ length: 0, index: 0 });

    // Prevent "unstyled SSR → styled after hydration" flashes on web by
    // injecting the React Native Web / NativeWind generated stylesheet into
    // the initial HTML during SSR.
    useServerInsertedHTML(() => {
        if (typeof StyleSheet?.getSheet !== 'function') return null;
        const sheet = StyleSheet.getSheet();
        const cssText = sheet?.textContent || '';
        if (!cssText) return null;

        // Next.js App Router may call this hook multiple times during streaming SSR.
        // Only insert the *new* CSS since the last call to avoid duplicate style tags.
        const prevLen = rnStyleSheetStateRef.current.length || 0;
        const delta = cssText.slice(prevLen);
        if (!delta) return null;

        rnStyleSheetStateRef.current.length = cssText.length;
        rnStyleSheetStateRef.current.index += 1;
        const idSuffix = rnStyleSheetStateRef.current.index;
        const styleId = idSuffix === 1 ? sheet.id : `${sheet.id}-${idSuffix}`;

        return (
            <style
                id={styleId}
                dangerouslySetInnerHTML={{ __html: delta }}
            />
        );
    });

    useEffect(() => {
        if (i18n.isInitialized && langCode) {
            i18n.changeLanguage(langCode);
        }
    }, [langCode]);

    const queryClient = useMemo(() => new QueryClient(), []);
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
