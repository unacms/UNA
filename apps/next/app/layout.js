"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/customization/translation';
import { useEffect, useMemo } from 'react'
import Subscriber from 'app/ui/molecules/subscriber';
import { useLayoutSettings } from 'app/context/layout-settings';
import { fontVars } from 'app/customization/design/fonts/fonts-web';
import { mainFont } from 'app/design/fonts/fonts-web';
import { appSetting } from 'app/lib/util';
import 'app/design/styles/global.css'
import 'app/customization/design/styles/global.css'
import 'app/design/styles/global.web.css'
import 'app/customization/design/styles/global.web.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 3 * 60 * 1000, // Reduce to 3 minutes
            refetchOnWindowFocus: false,
        },
    },
});

// Sync init so SSR splash/login copy matches hydration (useEffect-only init leaves t() as raw keys on the server).
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources: resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });
}

export default function RootLayout({ children }) {
    const { langCode } = useLayoutSettings();

    useEffect(() => {
        if (i18n.isInitialized && langCode && i18n.language !== langCode) {
            i18n.changeLanguage(langCode);
        }
    }, [langCode]);

    return (
        <html lang={langCode} className={`${fontVars} ${mainFont.className}`}>
            <body className={appSetting('layout', 'body')}>
                <JotaiProvider>
                    <QueryClientProvider client={queryClient}>
                        <Analytics />
                        <SpeedInsights />
                        {children}
                        <Subscriber />
                    </QueryClientProvider>
                </JotaiProvider>
            </body>
        </html>
    )
}
