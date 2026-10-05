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
