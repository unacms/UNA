'use client'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from 'app/lib/platform/query-client'
import { Provider as JotaiProvider } from 'jotai'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import Subscriber from 'app/ui/molecules/system/subscriber'
import { useLayoutSettings } from 'app/context/layout-settings'
import { addI18nResources, changeI18nLanguage } from 'app/lib/i18n-resources'

// The Google OAuth popup returns to a page of this app: close it and hand the
// result to the opener. Here, not in the lazily loaded Google button, so it
// runs whatever page the popup lands on.
if (typeof window !== 'undefined') {
    WebBrowser.maybeCompleteAuthSession()
}

const i18nOptions = (lang, resources) => ({
    compatibilityJSON: 'v3',
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})

/**
 * `initialResources` holds only this page's language + `en` (see layout.js);
 * other languages are loaded by changeI18nLanguage when needed.
 */
function ensureI18n(lang, initialResources) {
    if (!i18n.isInitialized) {
        i18n.use(initReactI18next).init(i18nOptions(lang, initialResources))
        return
    }
    // The server's i18n singleton serves every request: add languages it has not seen yet.
    addI18nResources(initialResources)
    /**
     * The i18n singleton outlives a request on the server: without this,
     * SSR sticks to the language of the first request the process served,
     * while each client initializes with its own `initialLang` — a hydration
     * mismatch (e.g. server "Contact" vs client "Контакты"). The bundle is
     * in memory, so changeLanguage resolves synchronously. Server-only: on the
     * client the user's stored preference (applied post-hydration) must win.
     * Concurrent requests still overwrite each other here, so components get
     * a per-request instance (see Providers); this keeps direct `i18n.t`
     * callers close.
     */
    if (typeof window === 'undefined' && lang && i18n.language !== lang) {
        i18n.changeLanguage(lang)
    }
}

export function Providers({ children, initialLang = 'en', initialResources }) {
    // Must match server-rendered copy before the first child paints (menu aria-labels, etc.).
    ensureI18n(initialLang, initialResources)

    /**
     * On the server, `useTranslation` must not read the shared singleton: the
     * page renders inside Suspense once its data arrives, and by then another
     * request may have switched the singleton's language (server "Welcome to"
     * vs client "Bienvenido a"). Resources are inline, so init is synchronous.
     */
    const [i18nInstance] = useState(() => {
        if (typeof window !== 'undefined') return i18n
        const instance = i18n.createInstance()
        instance.init(i18nOptions(initialLang, initialResources))
        return instance
    })

    const { langCode, hydrated } = useLayoutSettings()

    // Until the stored settings load, `langCode` is the default language, not
    // the user's: switching to it would re-render the page in the wrong language
    // while lazy blocks are still hydrating (React #418).
    useEffect(() => {
        if (hydrated && i18n.isInitialized && langCode && i18n.language !== langCode) {
            changeI18nLanguage(langCode)
        }
    }, [hydrated, langCode])

    useEffect(() => {
        if (hydrated && typeof document !== 'undefined') {
            document.documentElement.lang = langCode || initialLang || 'en'
        }
    }, [hydrated, langCode, initialLang])

    return (
        <I18nextProvider i18n={i18nInstance}>
            <JotaiProvider>
                <QueryClientProvider client={queryClient}>
                    <Analytics />
                    <SpeedInsights />
                    {children}
                    <Subscriber />
                </QueryClientProvider>
            </JotaiProvider>
        </I18nextProvider>
    )
}
