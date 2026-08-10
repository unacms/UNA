// Shared HTML preprocessing for the `Html` atom (native + web).
//
// `preprocessHtml` normalizes raw UNA content into a clean HTML string (decode
// entities, linkify plain URLs, wrap loose text in <p>). Both platforms consume
// the same output so native and web stay in sync. `sanitizeHtml` is web-only
// defense (script/handler stripping) used before `dangerouslySetInnerHTML`.
import { decodeText } from 'app/lib/util'
import { linkifyHtml } from 'app/components/form-fields/editor-mention-html'

export const hasBlockHtml = (html) => (
    /<(p|div|ul|ol|li|h[1-6]|pre|blockquote|table|thead|tbody|tr)\b/i.test(html)
)

// Normalize raw content into a clean HTML string. Shared by native and web so the
// two renderers receive identical input.
export function preprocessHtml(data) {
    if (!data) return ''

    let html = decodeText(data).replace(/&nbsp;/g, ' ')
    html = html.replace(/\n|\r/g, '')
    // Make plain-text URLs/emails clickable (covers legacy content and platforms
    // where the editor didn't auto-link). Skips text already inside anchors/mentions/code.
    html = linkifyHtml(html)
    if (html.trim() !== '' && !hasBlockHtml(html)) html = `<p>${html}</p>`

    return html
}

// UNA CMS can emit nested <a> tags (e.g. channel mention wrapping a keyword link).
// HTML forbids anchor descendants; unwrap the innermost anchors, keeping content.
export function flattenNestedAnchors(html) {
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
export function stripInlinePresentation(html) {
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
export function sanitizeHtml(html) {
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
