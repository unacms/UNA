import { useCallback } from 'react'
import { EnrichedText } from 'react-native-enriched-html'
import { View } from 'app/design/view'
import { appSetting, isExternalUrl, openExternalLink } from 'app/lib/util'
import { useThemeName } from 'app/design/theme'
import { useRouter, useGlobalSearchParams } from 'app/lib/hooks/router'
import { unaLinksToMentions, normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'
import { preprocessHtml } from 'app/lib/html-helper'

// This file is native-only (web content is rendered by html.web.js), so the
// Tiptap-based web build is never loaded here — a static import is safe.

// Native renderer using the enriched-html library's display component. Renders the
// HTML output of the editor 1:1 (formatting, links, native mention pills).
export default function ElementHtml({ customClassName, data, innerRef }) {
    const themeName = useThemeName() || 'light'
    const router = useRouter()
    const glob = useGlobalSearchParams()

    const isDark = themeName === 'dark'
    const themeKey = isDark ? 'dark' : 'light'
    const mentionCfg = appSetting('editor', 'mention') || {}
    const mentionColor =
        mentionCfg.editor_color?.[themeKey] || (isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)')
    const mentionBackground = mentionCfg.editor_background?.[themeKey] || 'transparent'
    const textColor = isDark ? 'rgba(225, 230, 240, 1)' : 'rgba(30, 40, 55, 1)'
    const isSmall = customClassName === 'u-vanilla-html-small'

    const navigate = useCallback((rawUrl) => {
        if (!rawUrl) return
        // Native auto-links store bare hrefs (e.g. "example.com"); add a scheme so
        // they open in the browser instead of being treated as an in-app route.
        const url = normalizeLinkHref(rawUrl)
        if (isExternalUrl(url)) {
            openExternalLink(url)
            return
        }
        const relative = url.replace(/^https?:\/\/[^/]+/, '') || url
        router.push({ pathname: '/' + (glob?.name || ''), params: { url: relative } })
    }, [router, glob?.name])

    if (!data) return null
    const source = `<html>${unaLinksToMentions(preprocessHtml(data))}</html>`
    // The library resolves mention styles by indicator ('@'/'#') or 'all'; a flat
    // object gets stored under an internal '_default' key that native never matches,
    // so it falls back to blue-on-yellow. Key it per indicator to apply our colors.
    const mentionStyle = { color: mentionColor, backgroundColor: mentionBackground, textDecorationLine: 'none' }
    const htmlStyle = {
        a: { color: mentionColor, textDecorationLine: 'none' },
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
