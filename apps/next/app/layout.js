import { Providers } from './providers'
import { resolveServerLangCode } from '../lib/resolve-lang'
import { fontVars } from 'app/customization/design/fonts/fonts-web'
import { getCornerSmoothingHtmlProps } from 'app/design/corner-smoothing'
import { appSetting } from 'app/config'
import 'app/design/styles/global.css'
import 'app/customization/design/styles/global.css'
import 'app/design/styles/global.web.css'
import 'app/customization/design/styles/global.web.css'

export default async function RootLayout({ children }) {
    const langCode = await resolveServerLangCode()
    const cornerSmooth = getCornerSmoothingHtmlProps()
    const htmlClassName = [fontVars, cornerSmooth.className].filter(Boolean).join(' ')

    return (
        <html
            lang={langCode}
            className={htmlClassName}
            style={cornerSmooth.style}
            suppressHydrationWarning
        >
            <body className={appSetting('layout', 'body')}>
                <Providers initialLang={langCode}>{children}</Providers>
            </body>
        </html>
    )
}
