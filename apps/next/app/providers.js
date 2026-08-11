'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from 'app/lib/query-client'
import { Provider as JotaiProvider } from 'jotai'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from 'app/customization/translation'
import { useEffect } from 'react'
import Subscriber from 'app/ui/molecules/system/subscriber'
import { useLayoutSettings } from 'app/context/layout-settings'

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
        return
    }
    /**
     * The i18n singleton outlives a request on the server: without this,
     * SSR sticks to the language of the first request the process served,
     * while each client initializes with its own `initialLang` — a hydration
     * mismatch (e.g. server "Contact" vs client "Контакты"). Resources are
     * bundled, so changeLanguage resolves synchronously. Server-only: on the
     * client the user's stored preference (applied post-hydration) must win.
     */
    if (typeof window === 'undefined' && lang && i18n.language !== lang) {
        i18n.changeLanguage(lang)
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
