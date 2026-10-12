import { useCallback } from 'react'
import type { HtmlProps } from './html.types'
import { EnrichedText } from 'react-native-enriched-html'
import { Linking } from 'react-native'
import { View } from 'app/design/view'
import { isExternalUrl, openExternalLink } from 'app/lib/util'
import { useThemeValue } from 'app/design/theme'
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabPageHref } from 'app/lib/navigation/tab-history'
import { preprocessHtml, normalizeRenderedHref, alignClassesToStyles } from 'app/lib/html-helpers'
import { useEnrichedHtmlStyle } from 'app/lib/editor/enriched-html-style'

// This file is native-only (web content is rendered by html.web.js), so the
// Tiptap-based web build is never loaded here — a static import is safe.

// Native renderer using the enriched-html library's display component. Renders the
// HTML output of the editor 1:1 (formatting, links, native mention pills).
export default function ElementHtml({ customClassName, data, innerRef, preprocess = true }: HtmlProps) {
    const textColor = useThemeValue('rgba(30, 40, 55, 1)', 'rgba(225, 230, 240, 1)')
    const router = useRouter()
    const tabPath = useCurrentTabPath()

    const isSmall = customClassName === 'u-vanilla-html-small'
    // Shared with the enriched editor, so a post looks the same while written.
    const htmlStyle = useEnrichedHtmlStyle({ small: isSmall })

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
    // The renderer reads alignment from `text-align` only (stored as a `text-*` class).
    const source = `<html>${alignClassesToStyles(preprocess ? preprocessHtml(data) : data)}</html>`

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
