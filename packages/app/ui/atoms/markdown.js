import { useCallback, useMemo } from 'react'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { View } from 'app/design/view'
import { useTheme, useThemeName } from 'app/design/theme'
import { isExternalUrl, openExternalLink, sanitazeUrl } from 'app/lib/util'
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'

// Cross-platform Markdown renderer built on `react-native-enriched-markdown`
// (native text on iOS/Android, md4c/WASM on web — no WebView). Content is
// expected to arrive as Markdown; link presses route internally via the app
// router and fall back to the system browser for external URLs.
export default function ElementMarkdown({ data, customClassName, className = '', innerRef }) {
    const { colors } = useTheme()
    const isDark = useThemeName() === 'dark'
    const router = useRouter()
    const glob = useGlobalSearchParams()

    const isSmall = customClassName === 'u-vanilla-html-small'
    const fontSize = isSmall ? 14 : 16
    const lineHeight = isSmall ? 18 : 22

    const navigate = useCallback((rawUrl) => {
        if (!rawUrl) return
        const url = normalizeLinkHref(rawUrl)
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = sanitazeUrl(url.replace(/^https?:\/\/[^/]+/, '') || url)
        if (!relative) return
        router.push({ pathname: '/' + (glob?.name || ''), params: { url: relative } })
    }, [router, glob?.name])

    const markdownStyle = useMemo(() => {
        const mutedBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(3,7,18,0.05)'
        const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(3,7,18,0.12)'
        return {
            paragraph: { color: colors.default, fontSize, lineHeight, marginTop: 8, marginBottom: 8 },
            h1: { color: colors.default },
            h2: { color: colors.default },
            h3: { color: colors.default },
            h4: { color: colors.default },
            h5: { color: colors.default },
            h6: { color: colors.default },
            list: { color: colors.default, fontSize, lineHeight },
            blockquote: { color: colors.default, borderColor, backgroundColor: mutedBg },
            link: { color: colors.primary, underline: false },
            strong: { color: colors.default },
            em: { color: colors.default },
            code: { color: colors.default, backgroundColor: mutedBg, borderColor },
            codeBlock: { color: colors.default, backgroundColor: mutedBg, borderColor, borderRadius: 8, padding: 12 },
            table: { color: colors.default, borderColor },
            thematicBreak: { color: borderColor },
        }
    }, [colors.default, colors.primary, isDark, fontSize, lineHeight])

    if (!data) return null

    return (
        <View className={`max-w-full u-vanilla-html ${customClassName || ''} ${className}`.trim()} ref={innerRef}>
            <EnrichedMarkdownText
                selectable
                selectionColor={colors.outline || colors.primary}
                flavor="github"
                markdown={data}
                markdownStyle={markdownStyle}
                onLinkPress={(e) => navigate(e?.url)}
            />
        </View>
    )
}
