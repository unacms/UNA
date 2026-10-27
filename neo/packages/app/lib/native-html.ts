// HTML steps for the native `Html` atom (ui/atoms/html.tsx), whose renderer
// (react-native-enriched-html) reads a smaller set of tags than a browser.

// The renderer's inline tags are b, i, u and s; UNA content uses the semantic ones.
const INLINE_TAGS: Record<string, string> = { strong: 'b', em: 'i', ins: 'u', del: 's', strike: 's' }
const INLINE_TAG = /<(\/?)(strong|em|ins|del|strike)\b[^>]*>/gi

const HEADING = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi

/**
 * `<strong>` → `<b>`, `<em>` → `<i>`, `<ins>` → `<u>`, `<del>` / `<strike>` → `<s>`, which the
 * renderer otherwise drops. Headings are bold already, and the renderer treats bold inside
 * a bold heading as a style conflict and shows the whole text as raw HTML, so `<b>` is
 * dropped there.
 */
export function toNativeInlineTags(html: string) {
    if (!html || typeof html !== 'string') return html || ''
    return html
        .replace(INLINE_TAG, (_tag: string, close: string, name: string) => `<${close}${INLINE_TAGS[name.toLowerCase()]}>`)
        .replace(HEADING, (_tag: string, name: string, attrs: string, inner: string) => `<${name}${attrs}>${inner.replace(/<\/?b>/gi, '')}</${name}>`)
}

// Paragraph gaps. On web `.u-vanilla-html` puts a 16px margin around paragraphs
// (design/styles/utilities.css). The native renderer has no block spacing: each
// paragraph starts on the next line, so a page of copy reads as one wall of text.
// A blank line (`<br>`, the renderer's empty paragraph) between top-level blocks
// stands in for those margins.

const BLOCKS = 'p|h[1-6]|ul|ol|blockquote|pre|codeblock'
const BLOCK_BOUNDARY = new RegExp(`(</(?:${BLOCKS})>)\\s*(?=<(?:${BLOCKS})\\b)`, 'gi')
const EMPTY_P = '<p\\b[^>]*>(?:\\s|&nbsp;|<br\\s*/?>)*</p>'
const ENDS_WITH_EMPTY_P = new RegExp(`${EMPTY_P}$`, 'i')
const STARTS_WITH_EMPTY_P = new RegExp(`^${EMPTY_P}`, 'i')

const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0

/** Whether `offset` sits inside a list, where items keep their own line spacing. */
function inList(html: string, offset: number) {
    const before = html.slice(0, offset)
    return count(before, /<(?:ul|ol)\b/gi) > count(before, /<\/(?:ul|ol)>/gi)
}

/**
 * A blank line between adjacent blocks (paragraphs, headings, lists, quotes, code).
 * An empty paragraph is a blank line already, so none is added next to one, and
 * blocks inside list items are left as they are.
 */
export function addParagraphGaps(html: string) {
    if (!html || typeof html !== 'string') return html || ''
    return html.replace(BLOCK_BOUNDARY, (match: string, close: string, offset: number) => {
        const end = offset + close.length
        if (ENDS_WITH_EMPTY_P.test(html.slice(0, end))) return match
        if (STARTS_WITH_EMPTY_P.test(html.slice(offset + match.length))) return match
        if (inList(html, end)) return match
        return `${close}<br>`
    })
}
