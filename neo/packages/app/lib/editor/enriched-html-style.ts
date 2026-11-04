import { useMemo } from 'react'
import { Platform } from 'react-native'
import type { HtmlStyle } from 'react-native-enriched-html'
import { useCSSVariable } from 'uniwind'
import { appSetting } from 'app/lib/util'
import { useThemeValue } from 'app/design/theme'

/**
 * Heading sizes of `.u-vanilla-html` / `.u-vanilla-html-small` (design/styles/utilities.css).
 * Native has no CSS cascade, so the enriched editor and the `Html` atom read them from here.
 */
const HEADINGS = {
    base: [36, 24, 20, 18, 16, 14],
    small: [30, 22, 18, 16, 14, 12],
}

/**
 * List indents that start the text 24px in, as on web (`pl-6`), with a 6px bullet
 * ending 6px before the text. The renderer lays lists out differently per platform:
 * iOS puts the text at margin + gap and the marker's right edge at the margin;
 * Android puts it at margin + bullet + gap (numbers at margin + gap, centred on the margin).
 */
const LIST_INDENT = Platform.OS === 'android'
    ? { ul: { marginLeft: 12, gapWidth: 6 }, ol: { marginLeft: 12, gapWidth: 12 } }
    : { ul: { marginLeft: 18, gapWidth: 6 }, ol: { marginLeft: 18, gapWidth: 6 } }

/**
 * Colours of `.u-vanilla-html` from the theme tokens, with the stock palette's values
 * as fallbacks: body text (`--secondary-foreground`), links (`--accent-foreground`),
 * rules such as the quote bar (`--border`) and the fill behind code (`--color-code`).
 * Tailwind declares an `@theme inline` token only where a scanned file names it, so
 * these names stay written out in full.
 */
export function useRichTextColors() {
    const [text, link, border, code] = useCSSVariable([
        '--color-secondary-foreground',
        '--color-accent-foreground',
        '--color-border',
        '--color-code',
    ])
    const fallback = useThemeValue(
        { text: 'rgb(82, 82, 91)', link: 'rgb(29, 78, 216)', border: 'rgb(212, 212, 216)', code: 'rgba(10, 10, 12, 0.07)' },
        { text: 'rgb(161, 161, 170)', link: 'rgb(96, 165, 250)', border: 'rgb(63, 63, 70)', code: 'rgba(250, 250, 252, 0.07)' },
    )
    return {
        text: (text as string) || fallback.text,
        link: (link as string) || fallback.link,
        border: (border as string) || fallback.border,
        code: (code as string) || fallback.code,
    }
}

/**
 * One `htmlStyle` for the enriched editor and the native `Html` atom, so a post
 * looks the same while it is written and once it is published.
 */
export function useEnrichedHtmlStyle({ small = false }: { small?: boolean } = {}): HtmlStyle {
    const themeKey = useThemeValue('light', 'dark')
    const colors = useRichTextColors()

    return useMemo(() => {
        const mentionCfg = appSetting('editor', 'mention') || {}
        const color = mentionCfg.editor_color?.[themeKey] || colors.link
        const backgroundColor = mentionCfg.editor_background?.[themeKey] || 'transparent'
        // Keyed per indicator: a flat object lands under an internal '_default' key
        // that native never matches, so it falls back to blue-on-yellow.
        const mention = { color, backgroundColor, textDecorationLine: 'none' as const }
        const [h1, h2, h3, h4, h5, h6] = small ? HEADINGS.small : HEADINGS.base
        return {
            // Links are underlined, as on web: the accent is as light as the body text,
            // so colour alone doesn't mark them (WCAG 1.4.1). Mentions and tags aren't.
            a: { color, textDecorationLine: 'underline' },
            mention: { '@': mention, '#': mention },
            ul: { bulletColor: colors.text, bulletSize: 6, ...LIST_INDENT.ul },
            ol: { markerColor: colors.text, ...LIST_INDENT.ol },
            blockquote: { borderColor: colors.border, borderWidth: 4, gapWidth: 16, color: colors.text },
            code: { color: colors.text, backgroundColor: colors.code },
            codeblock: { color: colors.text, backgroundColor: colors.code, borderRadius: 8 },
            h1: { fontSize: h1, bold: true },
            h2: { fontSize: h2, bold: true },
            h3: { fontSize: h3, bold: true },
            h4: { fontSize: h4, bold: true },
            h5: { fontSize: h5, bold: true },
            h6: { fontSize: h6, bold: true },
        }
    }, [themeKey, colors.link, colors.text, colors.border, colors.code, small])
}
