import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabPageHref } from 'app/lib/navigation/tab-history'
import { appSetting, isExternalUrl, openExternalLink, stripTags } from 'app/lib/util'
import { decodeEntities } from 'app/lib/splash/splash-html'

const blockTheme = appSetting('theme', 'blocks')
const isWeb = Platform.OS === 'web'

type Part = { text: string; href?: string }

const plain = (html: string) => decodeEntities(stripTags(html))

/** Text and `<a href>` links of the notice, in order; any other markup is dropped. */
export function noticeParts(html: string): Part[] {
    const parts: Part[] = []
    const link = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi
    let last = 0
    for (let m = link.exec(html); m; m = link.exec(html)) {
        if (m.index > last) parts.push({ text: plain(html.slice(last, m.index)) })
        // Only links to a page: http(s) or a path of the site. Anything else (javascript:, data:) stays text.
        const href = decodeEntities(m[1] ?? m[2] ?? m[3] ?? '').trim()
        parts.push({ text: plain(m[4] ?? ''), href: /^(https?:\/\/|\/(?!\/))/i.test(href) ? href : undefined })
        last = m.index + m[0].length
    }
    if (last < html.length) parts.push({ text: plain(html.slice(last)) })
    return parts.filter((part) => part.text !== '')
}

/**
 * A block footer's notice (UNA's `footer`: plain text with links, the terms a form's visitor
 * agrees to): small, muted, centred, wrapped lines balanced on web. Drawn as text with links,
 * styled by `theme.blocks` (`u-block-notice`, `u-block-notice-link`).
 */
export default function BlockNotice({ html }: Readonly<{ html: string }>) {
    const router = useRouter()
    const tabPath = useCurrentTabPath()

    const open = (href: string) => {
        if (isExternalUrl(href)) {
            void openExternalLink(href)
            return
        }
        router.push(nativeTabPageHref(href.replace(/^https?:\/\/[^/]+/, '') || href, tabPath))
    }

    return (
        <Text className={blockTheme['u-block-notice']}>
            {noticeParts(html).map((part, i) => {
                const { href } = part
                if (!href) return part.text
                // Web: a real link. Native: the app's router.
                const linkProps = isWeb ? { href } : { onPress: () => open(href) }
                return (
                    <Text key={i} className={blockTheme['u-block-notice-link']} accessibilityRole="link" {...linkProps}>
                        {part.text}
                    </Text>
                )
            })}
        </Text>
    )
}
