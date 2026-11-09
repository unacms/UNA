import { Providers } from './providers'
import { resolveServerLangCode } from '../lib/resolve-lang'
import { loadUnaSharedData } from '../lib/una-shared-data'
import { fontVars } from 'app/customization/design/fonts/fonts-web'
import { getCornerSmoothingHtmlProps } from 'app/design/corner-smoothing'
import { appSetting } from 'app/config'
import { resources } from 'app/customization/translation'
import 'app/design/styles/global.css'
import 'app/customization/design/styles/global.css'
import 'app/design/styles/global.web.css'
import 'app/customization/design/styles/global.web.css'

export default async function RootLayout({ children }) {
    const langCode = await resolveServerLangCode()
    const cornerSmooth = getCornerSmoothingHtmlProps()
    const htmlClassName = [fontVars, cornerSmooth.className].filter(Boolean).join(' ')
    // Only this page's language (+ the `en` fallback) goes to the client; the
    // rest load on demand (app/lib/i18n-resources). Server component, so the
    // full `resources` never reach the client bundle from here.
    const initialResources = { en: resources.en, [langCode]: resources[langCode] }
    // Guests' menus and the analytics settings, so the first page doesn't ask UNA for them.
    const { menus: initialMenus, trackerConfig } = await loadUnaSharedData(langCode)

    return (
        <html
            lang={langCode}
            className={htmlClassName}
            style={cornerSmooth.style}
            suppressHydrationWarning
        >
            <body className={appSetting('layout', 'body')}>
                <Providers initialLang={langCode} initialResources={initialResources} initialMenus={initialMenus} trackerConfig={trackerConfig} onVercel={!!process.env.VERCEL}>{children}</Providers>
            </body>
        </html>
    )
}
