// Shared HTML preprocessing for the `Html` atom (native + web).
//
// `preprocessHtml` normalizes raw UNA content into a clean HTML string (decode
// entities, linkify plain URLs, wrap loose text in <p>). Both platforms consume
// the same output so native and web stay in sync. `sanitizeHtml` is web-only
// defense (script/handler stripping) used before `dangerouslySetInnerHTML`.
import { decodeText } from 'app/lib/util'
import { linkifyHtml, normalizeLinkHref } from 'app/components/form-fields/editor-mention-html'

// UNA messenger auto-linker (`bx-link`) stores bare hrefs: emails without
// `mailto:` and domains without `https://`. `linkifyHtml` skips existing <a>
// tags, so renderers must rewrite those hrefs or the browser treats them as
// in-app relative paths (`/garysicard@hotmail.com`, `/molosserdogs.com/cpanel`).
const BARE_EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}$/
const ANCHOR_OPEN_RE = /<a\b([^>]*?)>/gi
const HREF_ATTR_RE = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i

export function normalizeRenderedHref(href: string) {
    if (!href || typeof href !== 'string') return href
    const trimmed = href.trim()
    if (!trimmed) return href
    if (BARE_EMAIL_RE.test(trimmed)) return `mailto:${trimmed}`
    return normalizeLinkHref(trimmed)
}

export function normalizeAnchorHrefs(html: string) {
    if (!html || typeof html !== 'string') return html
    ANCHOR_OPEN_RE.lastIndex = 0
    return html.replace(ANCHOR_OPEN_RE, (full, attrs) => {
        const m = attrs.match(HREF_ATTR_RE)
        if (!m) return full
        const raw = m[2] ?? m[3] ?? m[4] ?? ''
        const next = normalizeRenderedHref(raw)
        if (!next || next === raw) return full
        const quote = m[1][0] === '"' || m[1][0] === "'" ? m[1][0] : '"'
        return `<a${attrs.replace(m[0], `href=${quote}${next}${quote}`)}>`
    })
}

const LINK_TEXT_MAX = 30

const decodeAmp = (s: string) => s.replace(/&amp;/g, '&')
const stripScheme = (s: string) => s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')

// Display text for a bare URL: no scheme/www, domain always kept whole, rest cut with "…"
export function shortenUrlText(url: string) {
    const s = stripScheme(url)
    if (s.length <= LINK_TEXT_MAX) return s
    const hostLength = (s.split(/[/?#]/)[0] ?? s).length
    return s.slice(0, Math.max(LINK_TEXT_MAX - 1, hostLength)) + '…'
}

// Auto-linked URLs (anchor text == href, or href already cut upstream with "..."/"…")
// get short display text; href stays full. Anchors with custom text (mentions,
// [text](url)) are left as is.
export function shortenLinkTexts(html: string) {
    if (!html || typeof html !== 'string') return html
    return html.replace(/<a\b([^>]*?)\bhref=(["'])(.*?)\2([^>]*)>([^<]*)<\/a>/gi, (match, before: string, quote: string, href: string, after: string, text: string) => {
        const textUrl = decodeAmp(text.trim())
        const fullUrl = decodeAmp(href)
        if (!/^(https?:\/\/|www\.)/i.test(textUrl))
            return match
        const cut = textUrl.match(/^(.*?)(\.\.\.|…)$/)
        const isAutoLink = cut
            ? stripScheme(fullUrl).startsWith(stripScheme(cut[1] ?? ''))
            : stripScheme(textUrl) === stripScheme(fullUrl)
        if (!isAutoLink || fullUrl.length <= LINK_TEXT_MAX)
            return match
        const short = shortenUrlText(fullUrl)
        const escaped = short.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const title = /\btitle=/i.test(before + after) ? '' : ` title=${quote}${href}${quote}`
        return `<a${before}href=${quote}${href}${quote}${after}${title}>${escaped}</a>`
    })
}

export const hasBlockHtml = (html: string) => (
    /<(p|div|ul|ol|li|h[1-6]|pre|blockquote|table|thead|tbody|tr)\b/i.test(html)
)

// Normalize raw content into a clean HTML string. Shared by native and web so the
// two renderers receive identical input.
export function preprocessHtml(data: any) {
    if (!data) return ''

    let html = decodeText(data).replace(/&nbsp;/g, ' ')
    html = html.replace(/\n|\r/g, '')
    // Make plain-text URLs/emails clickable (covers legacy content and platforms
    // where the editor didn't auto-link). Skips text already inside anchors/mentions/code.
    html = linkifyHtml(html)
    html = normalizeAnchorHrefs(html)
    html = shortenLinkTexts(html)
    if (html.trim() !== '' && !hasBlockHtml(html)) html = `<p>${html}</p>`

    return html
}

// UNA CMS can emit nested <a> tags (e.g. channel mention wrapping a keyword link).
// HTML forbids anchor descendants; unwrap the innermost anchors, keeping content.
export function flattenNestedAnchors(html: string) {
    if (!html || typeof html !== 'string') return html
    const nestedRe = /<a [^>]*>[^<]*<a [^>]*>(.*?)<\/a>/gi
    let out = html
    let guard = 0
    while (nestedRe.test(out) && guard < 20) {
        out = out.replace(nestedRe, (match) => match.replace(/<a [^>]*>(.*?)<\/a>/i, '$1'))
        guard += 1
    }
    return out
}

// Block tags that carry paragraph alignment.
const ALIGN_BLOCK = /<(p|h[1-6]|li|blockquote|div)\b([^>]*)>/gi
const ALIGN_CLASS = /(^|\s)text-(left|center|right)(?=\s|$)/

const attrValue = (attrs: string, name: string) =>
    attrs.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
const withoutAttr = (attrs: string, name: string) =>
    attrs.replace(new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, 'gi'), '')

/** Paragraph alignment of an opening tag's attributes: its `text-*` class, else its `text-align` style. */
export function alignFromAttrs(attrs: string | undefined): 'left' | 'center' | 'right' | undefined {
    if (!attrs) return undefined
    const cls = attrValue(attrs, 'class')
    const fromClass = (cls?.[2] ?? cls?.[3] ?? '').match(ALIGN_CLASS)?.[2]
    const style = attrValue(attrs, 'style')
    const fromStyle = (style?.[2] ?? style?.[3] ?? '').match(/text-align\s*:\s*(left|center|right)/i)?.[1]
    return (fromClass || fromStyle?.toLowerCase()) as 'left' | 'center' | 'right' | undefined
}

/**
 * Editor → stored HTML: `style="text-align: …"` on a block becomes a Tailwind class
 * (`text-center` / `text-right`; left is the default and is dropped). Inline styles are
 * stripped on save (stripInlinePresentation), a class survives it and UNA's purifier.
 */
export function alignStylesToClasses(html: string) {
    if (!html || typeof html !== 'string') return html || ''
    return html.replace(ALIGN_BLOCK, (tag, name: string, attrs: string) => {
        const style = attrValue(attrs, 'style')
        const align = (style?.[2] ?? style?.[3] ?? '').match(/text-align\s*:\s*(left|center|right)/i)?.[1]?.toLowerCase()
        if (!align) return tag
        const cls = attrValue(attrs, 'class')
        const classes = (cls?.[2] ?? cls?.[3] ?? '').split(/\s+/).filter((c) => c && !ALIGN_CLASS.test(` ${c}`))
        if (align !== 'left') classes.push(`text-${align}`)
        const rest = withoutAttr(attrs, 'class')
        return `<${name}${rest}${classes.length ? ` class="${classes.join(' ')}"` : ''}>`
    })
}

/**
 * Stored HTML → enriched editor / native renderer: they read alignment from
 * `text-align` only, so a `text-*` class becomes that style again.
 */
export function alignClassesToStyles(html: string) {
    if (!html || typeof html !== 'string') return html || ''
    return html.replace(ALIGN_BLOCK, (tag, name: string, attrs: string) => {
        const cls = attrValue(attrs, 'class')
        const align = (cls?.[2] ?? cls?.[3] ?? '').match(ALIGN_CLASS)?.[2]
        if (!align || /text-align\s*:/i.test(attrValue(attrs, 'style')?.[0] ?? '')) return tag
        const style = attrValue(attrs, 'style')
        const css = [(style?.[2] ?? style?.[3] ?? '').trim().replace(/;$/, ''), `text-align: ${align}`].filter(Boolean).join('; ')
        return `<${name}${withoutAttr(attrs, 'style')} style="${css}">`
    })
}

/**
 * Strip paste/docs presentation junk that fights design tokens (Word/Notion/docs
 * often wrap text in `<span style="color: …">` / `<font color=…>`).
 * Use on editor paste/save only — do not strip on render (legacy content stays as stored).
 * Safe for UNA content: mentions are `<a>`, not styled spans.
 */
export function stripInlinePresentation(html: string) {
    if (!html || typeof html !== 'string') return html || ''

    return html
        // Inline CSS (quoted or bare).
        .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // Legacy presentational attributes.
        .replace(/\s(?:color|bgcolor|background|face|size)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // Unwrap <font>…</font> (keep children).
        .replace(/<\/?font\b[^>]*>/gi, '')
        // Unwrap <span>…</span> left over after style strip (Word/TipTap Color).
        .replace(/<\/?span\b[^>]*>/gi, '')
}

// Lightweight web sanitizer used before `dangerouslySetInnerHTML`. Strips script/
// style blocks, inline event handlers, and `javascript:` URLs. This is not a full
// XSS suite — UNA content is server-owned — but it removes the obvious injection
// vectors that raw innerHTML would otherwise execute.
export function sanitizeHtml(html: string) {
    if (!html || typeof html !== 'string') return ''

    return html
        // Drop <script>/<style> blocks including their contents.
        .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
        // Drop dangling/self-closing script/style/meta/base tags.
        .replace(/<\/?(script|style|meta|base)\b[^>]*>/gi, '')
        // Remove inline event handlers: on*="..." / on*='...' / on*=unquoted.
        .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
        .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
        // Neutralize javascript:/vbscript: in href/src attributes.
        .replace(/\b(href|src)\s*=\s*("|')\s*(javascript|vbscript):[^"']*\2/gi, '$1=$2#$2')
}
