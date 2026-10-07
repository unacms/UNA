import { useCallback } from 'react'
import type { HtmlProps } from './html.types'
import { EnrichedText } from 'react-native-enriched-html'
import { Linking } from 'react-native'
import { View } from 'app/design/view'
import { appSetting, isExternalUrl, openExternalLink } from 'app/lib/util'
import { useThemeValue } from 'app/design/theme'
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabPageHref } from 'app/lib/navigation/tab-history'
import { preprocessHtml, normalizeRenderedHref } from 'app/lib/html-helpers'

// This file is native-only (web content is rendered by html.web.js), so the
// Tiptap-based web build is never loaded here — a static import is safe.

// Native renderer using the enriched-html library's display component. Renders the
// HTML output of the editor 1:1 (formatting, links, native mention pills).
export default function ElementHtml({ customClassName, data, innerRef }: HtmlProps) {
    const themeKey = useThemeValue('light', 'dark')
    const mentionColorFallback = useThemeValue('rgba(37, 99, 235, 1)', 'rgba(59, 130, 246, 1)')
    const textColor = useThemeValue('rgba(30, 40, 55, 1)', 'rgba(225, 230, 240, 1)')
    const router = useRouter()
    const tabPath = useCurrentTabPath()

    const mentionCfg = appSetting('editor', 'mention') || {}
    const mentionColor = mentionCfg.editor_color?.[themeKey] || mentionColorFallback
    const mentionBackground = mentionCfg.editor_background?.[themeKey] || 'transparent'
    const isSmall = customClassName === 'u-vanilla-html-small'

    const navigate = useCallback((rawUrl?: string) => {
        if (!rawUrl) return
        // Native / UNA auto-links store bare hrefs (e.g. "example.com",
        // "user@host.com"); add a scheme so they open externally.
        const url = normalizeRenderedHref(rawUrl)
        if (/^(mailto:|tel:)/i.test(url)) {
            Linking.openURL(url).catch(() => {})
            return
        }
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = url.replace(/^https?:\/\/[^/]+/, '') || url
        router.push(nativeTabPageHref(relative, tabPath))
    }, [router, tabPath])

    if (!data) return null
    const source = `<html>${(preprocessHtml(data))}</html>`
    // The library resolves mention styles by indicator ('@'/'#') or 'all'; a flat
    // object gets stored under an internal '_default' key that native never matches,
    // so it falls back to blue-on-yellow. Key it per indicator to apply our colors.
    const mentionStyle = { color: mentionColor, backgroundColor: mentionBackground, textDecorationLine: 'none' as const }
    const htmlStyle = {
        a: { color: mentionColor, textDecorationLine: 'none' as const },
        mention: { '@': mentionStyle, '#': mentionStyle },
    }

    return (
        <View className={`max-w-full ${customClassName || ''}`} ref={innerRef}>
            <EnrichedText
                selectable
                style={{ color: textColor, fontSize: isSmall ? 14 : 16, lineHeight: isSmall ? 18 : 22 }}
                htmlStyle={htmlStyle}
                onLinkPress={(e) => navigate(e?.url)}
                onMentionPress={(e) => navigate(e?.attributes?.href)}
            >
                {source}
            </EnrichedText>
        </View>
    )
}
