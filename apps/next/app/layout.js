"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/translation';
import { useEffect, useMemo } from 'react'
import Subscriber from 'app/ui/molecules/subscriber';
import AnimatedBackground from 'app/ui/atoms/animated-background';
import { appSetting } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';
import { getWebFontsForLayout } from 'app/design/fonts/web';

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

    // Memoize QueryClient to prevent unnecessary recreations
    const queryClient = useMemo(() => new QueryClient(), []);

    const { className: fontClassName, variable: fontVariable } = getWebFontsForLayout();

    const bodyClassName = [fontClassName, appSetting('layout', 'body')].filter(Boolean).join(' ').trim();

    return (
        <html lang={langCode} className={fontVariable}>
            <body className={bodyClassName}>
                <QueryClientProvider client={queryClient}>
                    <AnimatedBackground />
                    {typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app') ? <Analytics /> : null}
                    {!!process.env['VERCEL'] ? <SpeedInsights /> : null}
                    {children}
                    <Subscriber />
                </QueryClientProvider>
            </body>
        </html>
    )
}
