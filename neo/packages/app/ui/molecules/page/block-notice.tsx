import { Text } from 'app/design/typography'
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabPageHref } from 'app/lib/navigation/tab-history'
import { isExternalUrl, openExternalLink, stripTags } from 'app/lib/util'
import type { BlockNoticeProps } from './block-notice.types'

type Part = { text: string; href?: string }

/** Text and `<a href>` links of the notice, in order; any other markup is dropped. */
function noticeParts(html: string): Part[] {
    const parts: Part[] = []
    const link = /<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let last = 0
    for (let m = link.exec(html); m; m = link.exec(html)) {
        if (m.index > last) parts.push({ text: stripTags(html.slice(last, m.index)) })
        parts.push({ text: stripTags(m[2] ?? ''), href: m[1] })
        last = m.index + m[0].length
    }
    if (last < html.length) parts.push({ text: stripTags(html.slice(last)) })
    return parts.filter((part) => part.text !== '')
}

/**
 * A block footer's notice: small, muted, centred. Native draws it as text with links (the rich
 * text renderer has no size this small); web renders UNA's markup (block-notice.web.tsx).
 */
export default function BlockNotice({ html }: Readonly<BlockNoticeProps>) {
    const router = useRouter()
    const tabPath = useCurrentTabPath()

    const open = (href: string) => {
        if (isExternalUrl(href)) {
            openExternalLink(href)
            return
        }
        router.push(nativeTabPageHref(href.replace(/^https?:\/\/[^/]+/, '') || href, tabPath))
    }

    return (
        <Text className="w-full text-center text-xs leading-[18px] text-muted-foreground">
            {noticeParts(html).map((part, i) => {
                const { href } = part
                return href ? (
                    <Text
                        key={i}
                        className="text-xs leading-[18px] text-muted-foreground underline"
                        accessibilityRole="link"
                        onPress={() => open(href)}
                    >
                        {part.text}
                    </Text>
                ) : part.text
            })}
        </Text>
    )
}
