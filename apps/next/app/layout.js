"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { storageGet } from 'app/lib/util'
import i18n from 'app/lib/i18n';
import Subscriber from 'app/ui/molecules/subscriber';
import AnimatedBackground from 'app/ui/atoms/animated-background';
import { appSetting } from 'app/lib/util';
import React, { useContext } from 'react';
import { LanguageProvider, LanguageContext } from 'app/context/LanguageProvider';

export default function RootLayout({ children }) {
    const queryClient = React.useMemo(() => new QueryClient(), []);
    const lang = useContext(LanguageContext) || 'en';

    return (
        <html lang={lang}>
            <body className={appSetting('layout', 'body')}>
                <LanguageProvider>
                    <QueryClientProvider client={queryClient}>
                        <AnimatedBackground />
                        {typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app') ? <Analytics /> : null}
                        {!!process.env['VERCEL'] ? <SpeedInsights /> : null}
                        {children}
                        <Subscriber/>
                    </QueryClientProvider>
                </LanguageProvider>
            </body>
        </html>
    )
}