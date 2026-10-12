import { useMemo } from 'react'
import type { HtmlStyle } from 'react-native-enriched-html'
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
 * One `htmlStyle` for the enriched editor and the native `Html` atom, so a post
 * looks the same while it is written and once it is published.
 */
export function useEnrichedHtmlStyle({ small = false }: { small?: boolean } = {}): HtmlStyle {
    const themeKey = useThemeValue('light', 'dark')
    const mentionColorFallback = useThemeValue('rgba(37, 99, 235, 1)', 'rgba(59, 130, 246, 1)')

    return useMemo(() => {
        const mentionCfg = appSetting('editor', 'mention') || {}
        const color = mentionCfg.editor_color?.[themeKey] || mentionColorFallback
        const backgroundColor = mentionCfg.editor_background?.[themeKey] || 'transparent'
        // Keyed per indicator: a flat object lands under an internal '_default' key
        // that native never matches, so it falls back to blue-on-yellow.
        const mention = { color, backgroundColor, textDecorationLine: 'none' as const }
        const [h1, h2, h3, h4, h5, h6] = small ? HEADINGS.small : HEADINGS.base
        return {
            // No underline on links/mentions/tags — color alone marks them.
            a: { color, textDecorationLine: 'none' },
            mention: { '@': mention, '#': mention },
            h1: { fontSize: h1, bold: true },
            h2: { fontSize: h2, bold: true },
            h3: { fontSize: h3, bold: true },
            h4: { fontSize: h4, bold: true },
            h5: { fontSize: h5, bold: true },
            h6: { fontSize: h6, bold: true },
        }
    }, [themeKey, mentionColorFallback, small])
}
