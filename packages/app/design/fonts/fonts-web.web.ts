import { Inter } from 'next/font/google'
import { FONT_ROLES, fontChoice } from 'app/design/fonts/font-choice'

// Optimized Google Font loading for web (next/font)
// - Latin subset, display swap, no preload (avoids unused preload warnings; fonts still load)
// next/font needs one literal call per role (its `variable` differs). The
// browser only downloads a family that <html> actually applies, so a family
// left unselected in customization/config/fonts.js costs nothing at runtime.

export const mainFont = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-main',
    display: 'swap',
    preload: false,
})

export const titleFont = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-title',
    display: 'swap',
    preload: false,
})

type WebFont = { variable: string }

/** next/font instance per family key (font-families.js) and role. */
export const webFontFamilies: Record<string, Record<string, WebFont>> = {
    inter: { main: mainFont, title: titleFont },
}

/**
 * <html> classes that set --font-main / --font-title for web in
 * customization/config/fonts.js: the family's next/font variable class, or
 * `neo-font-<role>-system` (the OS UI font stack, global.web.css).
 */
export function webFontClassName(): string {
    return (FONT_ROLES as string[])
        .map((role) => {
            const key = fontChoice(role, 'web') as string
            return webFontFamilies[key]?.[role]?.variable ?? `neo-font-${role}-system`
        })
        .join(' ')
}
