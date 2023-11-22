"use client"
import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';
import { storageGet } from 'app/lib/util'
import * as RNLocalize from "react-native-localize";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useColorScheme } from 'react-native';
import en from 'app/locales/en/translation.json';
import ru from 'app/locales/ru/translation.json';
//import { Inter } from 'next/font/google'

export default function RootLayout({ children }) {

    const languageDetector = {
        type: 'languageDetector',
        async: true,
        detect: async (callback) => {
            const locale = await RNLocalize.getLocales();
            callback(locale[0].languageCode);
        },
        init: () => {},
        cacheUserLanguage: () => {},
    };
    
    i18n
        .use(initReactI18next)
        .use(languageDetector)
        .init({
            compatibilityJSON: 'v3',
            resources: {
                en: {
                    translation: en
                },
                ru: {
                    translation: ru
                }
            },
            lng: 'en', // default language
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false
            }
        });  

    const queryClient = new QueryClient()
    let theme = '';
    if (typeof window !== 'undefined'){
        theme = storageGet('layout:theme', '', true);
        let lang = storageGet('layout:lang', '', true);
        if (lang)
            i18n.changeLanguage(lang);   
    }
    const scheme = useColorScheme();
    if (theme == ''){
        theme = scheme;
    }

    if (typeof window !== 'undefined'){
        const root = window.document.documentElement;
        //root.setAttribute('theme', scheme);
    }
/**/
    return (
        <html lang="en" >
            <body className='bg-bgrbody dark:bg-bgrbody-d'>
                <Provider>
                        <QueryClientProvider client={queryClient}>
                            <CurrentUserProvider>
                                {!!process.env['VERCEL'] ? <Analytics /> : null}
                                {children}
                            </CurrentUserProvider>
                        </QueryClientProvider>
                    </Provider>
                </body>
        </html>
    )
}