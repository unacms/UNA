"use client"
import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { storageGet } from 'app/lib/util'
import * as RNLocalize from "react-native-localize";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { resources } from 'app/translation';
import Subscriber from 'app/ui/molecules/subscriber';
import { useEffect } from 'react';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default function RootLayout({ children }) {

    const queryClient = new QueryClient()
    let theme = '';
    if (typeof window !== 'undefined') {
        theme = storageGet('layout:theme', '', true);
        let lang = storageGet('layout:lang', '', true);
        if (lang)
            i18n.changeLanguage(lang);
    }
    const scheme = useColorScheme();
    if (theme == '') {
        theme = scheme;
    }

    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        //root.setAttribute('theme', scheme);
    }

    useEffect(() => {
        const detectLanguage = async () => {
            const locale = await RNLocalize.getLocales();
            i18n.changeLanguage(locale[0].languageCode);
        };
        
        if (typeof window !== 'undefined') {
            const lang = storageGet('layout:lang', '', true);
            if (lang) {
                i18n.changeLanguage(lang);
            } else {
                detectLanguage();
            }
        }
    }, []);

    return (
        <html lang="en" >
            <body className='bg-bgrbody dark:bg-bgrbody-d' style={{ overflowY: 'initial' }}>
                <QueryClientProvider client={queryClient}>
                        {!!process.env['VERCEL'] ? <Analytics /> : null}
                        {children}
                    <Subscriber/>
                </QueryClientProvider>
            </body>
        </html>
    )
}