import { useCallback, useMemo } from 'react'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { Platform } from 'react-native'
import { View } from 'app/design/view'
import { useTheme, useThemeName } from 'app/design/theme'
import { isExternalUrl, openExternalLink, sanitazeUrl } from 'app/lib/util'
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'

const headingScale = {
    regular: {
        h1: { fontSize: 36, fontWeight: '700', lineHeight: 40, marginTop: 8, marginBottom: 24 },
        h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, marginTop: 24, marginBottom: 16 },
        h3: { fontSize: 20, fontWeight: '700', lineHeight: 28, marginTop: 16, marginBottom: 8 },
        h4: { fontSize: 18, fontWeight: '600', lineHeight: 28, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
    },
    small: {
        h1: { fontSize: 30, fontWeight: '700', lineHeight: 36, marginTop: 8, marginBottom: 20 },
        h2: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginTop: 20, marginBottom: 12 },
        h3: { fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: 14, marginBottom: 6 },
        h4: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 8, marginBottom: 4 },
        h5: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8, marginBottom: 4 },
        h6: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 8, marginBottom: 4 },
    },
}

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
        const headingStyle = {
            color: Platform.OS === 'web' ? 'var(--color-popover-foreground)' : colors.default,
            fontFamily: Platform.OS === 'web' ? 'var(--font-title)' : 'font-title',
        }
        const headings = headingScale[isSmall ? 'small' : 'regular']
        return {
            paragraph: { color: colors.default, fontSize, lineHeight, marginTop: 8, marginBottom: 8 },
            h1: { ...headingStyle, ...headings.h1 },
            h2: { ...headingStyle, ...headings.h2 },
            h3: { ...headingStyle, ...headings.h3 },
            h4: { ...headingStyle, ...headings.h4 },
            h5: { ...headingStyle, ...headings.h5 },
            h6: { ...headingStyle, ...headings.h6 },
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
    }, [colors.default, colors.primary, isDark, isSmall, fontSize, lineHeight])

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
