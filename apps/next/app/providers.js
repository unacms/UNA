'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from 'app/customization/translation'
import { useEffect } from 'react'
import Subscriber from 'app/ui/molecules/subscriber'
import { useLayoutSettings } from 'app/context/layout-settings'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 3 * 60 * 1000,
            refetchOnWindowFocus: false,
        },
    },
})

function ensureI18n(lang) {
    if (!i18n.isInitialized) {
        i18n.use(initReactI18next).init({
            compatibilityJSON: 'v3',
            resources,
            lng: lang,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
        })
    }
}

export function Providers({ children, initialLang = 'en' }) {
    // Must match server-rendered copy before the first child paints (menu aria-labels, etc.).
    ensureI18n(initialLang)

    const { langCode } = useLayoutSettings()

    useEffect(() => {
        if (i18n.isInitialized && langCode && i18n.language !== langCode) {
            i18n.changeLanguage(langCode)
        }
    }, [langCode])

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = langCode || initialLang || 'en'
        }
    }, [langCode, initialLang])

    return (
        <JotaiProvider>
            <QueryClientProvider client={queryClient}>
                <Analytics />
                <SpeedInsights />
                {children}
                <Subscriber />
            </QueryClientProvider>
        </JotaiProvider>
    )
}
