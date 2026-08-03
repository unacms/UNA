import { Providers } from './providers'
import { resolveServerLangCode } from '../lib/resolve-lang'
import { fontVars } from 'app/customization/design/fonts/fonts-web'
import { appSetting } from 'app/config'
import 'app/design/styles/global.css'
import 'app/customization/design/styles/global.css'
import 'app/design/styles/global.web.css'
import 'app/customization/design/styles/global.web.css'

export default async function RootLayout({ children }) {
    const langCode = await resolveServerLangCode()

    return (
        <html lang={langCode} className={fontVars} suppressHydrationWarning>
            <body className={appSetting('layout', 'body')}>
                <Providers initialLang={langCode}>{children}</Providers>
            </body>
        </html>
    )
}
