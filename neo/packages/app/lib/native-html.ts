// HTML steps for the native `Html` atom (ui/atoms/html.tsx), whose renderer
// (react-native-enriched-html) reads a smaller set of tags than a browser.

// The renderer's inline tags are b, i, u and s; UNA content uses the semantic ones.
const INLINE_TAGS: Record<string, string> = { strong: 'b', em: 'i', ins: 'u', del: 's', strike: 's' }
const INLINE_TAG = /<(\/?)(strong|em|ins|del|strike)\b[^>]*>/gi
const HEADING = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi
const BOLD_TAG = /<\/?b\b[^>]*>/gi

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
        .replace(HEADING, (_tag: string, name: string, attrs: string, inner: string) => `<${name}${attrs}>${inner.replace(BOLD_TAG, '')}</${name}>`)
}

// Paragraph gaps. On web `.u-vanilla-html` puts a 16px margin around paragraphs
// (design/styles/utilities.css). The native renderer has no block spacing: each
// paragraph starts on the next line, so a page of copy reads as one wall of text.
// A blank line (`<br>`, the renderer's empty paragraph) between top-level blocks
// stands in for those margins.

const BLOCKS = 'p|h[1-6]|ul|ol|blockquote|pre|codeblock'
// A block boundary (a closing block tag followed by an opening one), else a list tag.
const TOKEN = String.raw`(</(?:${BLOCKS})>)\s*(?=<(?:${BLOCKS})\b)|<(/?)(?:ul|ol)\b[^>]*>`
const EMPTY_P = String.raw`<p\b[^>]*>(?:\s|&nbsp;|<br\s*/?>)*</p>`
const WHOLE_EMPTY_P = new RegExp(`^${EMPTY_P}$`, 'i')
const LIST_CLOSE = /^<\/(?:ul|ol)>$/i

const BR_OPEN = /^<br\b/i
const P_OPEN = /^<p[\s>]/i

/**
 * Whether the block that closes at `end` is an empty paragraph. Steps back over the
 * paragraph's own tags only (an empty one holds nothing but `<br>`), so the cost is
 * the paragraph's length, not the document's.
 */
function endsWithEmptyParagraph(html: string, end: number) {
    if (html.slice(end - 4, end).toLowerCase() !== '</p>') return false
    let pos = end - 4
    for (;;) {
        const start = html.lastIndexOf('<', pos - 1)
        if (start < 0) return false
        const tag = html.slice(start, start + 4)
        if (BR_OPEN.test(tag)) {
            pos = start
            continue
        }
        return P_OPEN.test(tag) && WHOLE_EMPTY_P.test(html.slice(start, end))
    }
}

/**
 * A blank line between adjacent blocks (paragraphs, headings, lists, quotes, code).
 * An empty paragraph is a blank line already, so none is added next to one, and
 * blocks inside list items are left as they are. One pass over the HTML.
 */
export function addParagraphGaps(html: string) {
    if (!html || typeof html !== 'string') return html || ''
    const token = new RegExp(TOKEN, 'gi')
    const emptyParagraphAt = new RegExp(EMPTY_P, 'iy')
    let listDepth = 0
    let out = ''
    let copied = 0
    for (let m = token.exec(html); m; m = token.exec(html)) {
        const [match, close, listSlash] = m
        if (!close) {
            listDepth = Math.max(0, listDepth + (listSlash ? -1 : 1))
            continue
        }
        if (LIST_CLOSE.test(close)) listDepth = Math.max(0, listDepth - 1)
        const end = m.index + close.length
        const next = m.index + match.length
        emptyParagraphAt.lastIndex = next
        if (listDepth > 0 || endsWithEmptyParagraph(html, end) || emptyParagraphAt.test(html)) continue
        out += `${html.slice(copied, end)}<br>`
        copied = next
    }
    return out + html.slice(copied)
}
