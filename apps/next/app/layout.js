"use client"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { storageGet } from 'app/lib/util'
import * as RNLocalize from "react-native-localize";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/translation';
import Subscriber from 'app/ui/molecules/subscriber';
import AnimatedBackground from 'app/ui/atoms/animated-background';

export default function RootLayout({ children }) {

    const languageDetector = {
        type: 'languageDetector',
        async: true,
        detect: async (callback) => {
            const locale = await RNLocalize.getLocales();
            callback(locale[0].languageCode);
        },
        init: () => { },
        cacheUserLanguage: () => { },
    };

    i18n
        .use(initReactI18next)
        .use(languageDetector)
        .init({
            compatibilityJSON: 'v3',
            resources: resources,
            lng: 'en', // default language
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false
            }
        });

    const queryClient = new QueryClient()
    if (typeof window !== 'undefined') {
        let lang = storageGet('layout:lang', '', true);
        if (lang)
            i18n.changeLanguage(lang);
    }

    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        //root.setAttribute('theme', scheme);
    }
    

    return (
        <html lang="en" >
            <body className='bg-bgrbody dark:bg-bgrbody-d'>
                <QueryClientProvider client={queryClient}>
                        <AnimatedBackground />
                        {!!process.env['VERCEL'] ? <Analytics /> : null}
                        {!!process.env['VERCEL'] ? <SpeedInsights /> : null}
                        {children}
                    <Subscriber/>
                </QueryClientProvider>
            </body>
        </html>
    )
}