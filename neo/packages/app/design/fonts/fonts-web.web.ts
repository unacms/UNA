import { FONT_ROLES, fontChoice } from 'app/design/fonts/font-choice'

/**
 * next/font instances that customization/config/fonts.js can select for web,
 * per family key (font-families.js) and role. Core loads none: out of the box
 * every role uses the system font, so the browser downloads no font and the
 * build fetches nothing from Google Fonts.
 *
 * A project that selects a family for web creates the instances in
 * customization/design/fonts/fonts-web.js and passes them to
 * webFontClassName(). next/font needs one literal call per role (its
 * `variable` differs), for example Inter from the files shipped in
 * design/fonts:
 *
 *   import localFont from 'next/font/local'
 *
 *   const interMain = localFont({
 *       src: '../../../design/fonts/Inter-VariableFont.ttf',
 *       weight: '100 900',
 *       variable: '--font-main',
 *       display: 'swap',
 *       preload: false,
 *   })
 *   // ...and interTitle with variable: '--font-title'
 *
 *   export const fontVars = webFontClassName({ inter: { main: interMain, title: interTitle } })
 *
 * `preload: false` keeps the browser from fetching a family that <html>
 * doesn't apply.
 */
export type WebFont = { variable: string }
export type WebFontFamilies = Record<string, Partial<Record<string, WebFont>>>

/**
 * <html> classes that set --font-main / --font-title for web in
 * customization/config/fonts.js: the family's next/font variable class, or
 * `neo-font-<role>-system` (the OS UI font stack, global.web.css).
 */
export function webFontClassName(families: WebFontFamilies = {}): string {
    return (FONT_ROLES as string[])
        .map((role) => {
            const key = fontChoice(role, 'web') as string
            const font = families[key]?.[role]
            if (font) return font.variable
            if (key !== 'system') {
                console.warn(`Font '${key}' (${role}, web) has no next/font instance in customization/design/fonts/fonts-web.js; using the system font.`)
            }
            return `neo-font-${role}-system`
        })
        .join(' ')
}
