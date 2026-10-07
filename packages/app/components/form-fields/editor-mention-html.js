// Convert between <mention> (react-native-enriched-html) and
// UNA's <a class="bx-mention-link" data-profile-id href> format.

const MENTION_TAG_RE = /<mention\b([^>]*)>([\s\S]*?)<\/mention>/gi
// UNA links with class bx-mention-link or bx-tag
const UNA_LINK_RE = /<a\b([^>]*?\bclass="[^"]*\b(?:bx-mention-link|bx-tag)\b[^"]*"[^>]*?)>([\s\S]*?)<\/a>/gi

function attr(attrs, name) {
    const m = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'))
    return m ? m[1] : ''
}

// On save: <mention> -> <a class="bx-mention-link">
export function mentionsToUnaLinks(html) {
    if (!html) return html
    return html.replace(MENTION_TAG_RE, (_full, attrs, inner) => {
        const indicator = attr(attrs, 'indicator') || '@'
        const profileId = attr(attrs, 'data-profile-id')
        const href = attr(attrs, 'href')
        const cls = indicator === '#' ? 'bx-tag' : 'bx-mention-link'
        // Store the name without the leading indicator; renderers add it back.
        let text = inner.trim()
        if (text.startsWith(indicator)) text = text.slice(indicator.length)
        const idAttr = profileId ? ` data-profile-id="${profileId}"` : ''
        const hrefAttr = href ? ` href="${href}"` : ''
        return `<a class="${cls}"${idAttr}${hrefAttr}>${text}</a>`
    })
}

// On load: <a class="bx-mention-link"> -> <mention> (so mentions in existing
// content become editable mention nodes again)
export function unaLinksToMentions(html) {
    if (!html) return html
    return html.replace(UNA_LINK_RE, (_full, attrs, inner) => {
        const cls = attr(attrs, 'class')
        const indicator = /\bbx-tag\b/.test(cls) ? '#' : '@'
        const profileId = attr(attrs, 'data-profile-id')
        const href = attr(attrs, 'href')
        let name = inner.trim()
        if (name.startsWith(indicator)) name = name.slice(indicator.length)
        // Display the indicator (e.g. "@Name") in both the text attr and the inner
        // content so the editor and the EnrichedText renderer show it consistently.
        const display = `${indicator}${name}`
        const idAttr = profileId ? ` data-profile-id="${profileId}"` : ''
        const hrefAttr = href ? ` href="${href}"` : ''
        // double quotes are required for correct parsing (issue #404)
        return `<mention indicator="${indicator}" text="${display}"${idAttr}${hrefAttr}>${display}</mention>`
    })
}

// ---- Auto-linking plain URLs ----
//
// The native enriched editor auto-detects URLs as you type, but the web (Tiptap)
// build ships the link extension with `autolink`/`linkOnPaste` disabled, so plain
// URLs never become links there. To keep behaviour consistent across platforms —
// and to make existing/plain-text content clickable in the renderer — we linkify
// plain URLs/emails in JS at save and render time. Text already inside an anchor,
// mention, or code span is left untouched.

// Common TLDs for bare-domain detection (e.g. "example.com"). File-extension-like
// TLDs (js, ts, sh, so, ...) are intentionally excluded to avoid turning code
// snippets / filenames into links.
const COMMON_TLDS = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'dev', 'app',
    'ai', 'me', 'info', 'biz', 'tv', 'xyz', 'online', 'site', 'tech', 'store',
    'blog', 'news', 'live', 'cloud', 'design', 'space', 'world', 'life', 'email',
    'link', 'page', 'fm', 'gg', 'to', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'es',
    'it', 'nl', 'ru', 'jp', 'cn', 'in', 'br', 'mx', 'pl', 'se', 'no', 'fi', 'dk',
    'ch', 'at', 'be', 'pt', 'gr', 'cz', 'ie', 'nz', 'za', 'kr', 'sg', 'hk', 'tr',
    'ua', 'ro', 'hu',
].join('|')

// email | explicit url (http(s):// or www.) | bare domain with a known TLD
const URL_TOKEN_RE = new RegExp(
    '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,24})' +
    '|((?:https?:\\/\\/|www\\.)[^\\s<>"\']+)' +
    '|(\\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+(?:' + COMMON_TLDS + ')\\b(?:\\/[^\\s<>"\']*)?)',
    'gi'
)

// Tags whose text content must never be linkified.
const LINKIFY_SKIP_TAGS = new Set(['a', 'mention', 'code', 'pre', 'codeblock', 'script', 'style'])
const LINKIFY_VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr'])
const LINKIFY_TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g
const TRAILING_PUNCT_RE = /[).,;:!?'"\]}]+$/

function linkifyText(text) {
    if (!text || (text.indexOf('@') === -1 && text.indexOf('.') === -1)) return text
    return text.replace(URL_TOKEN_RE, (match, email) => {
        if (email) {
            return `<a href="mailto:${email}">${email}</a>`
        }
        let token = match
        let trailing = ''
        const tm = token.match(TRAILING_PUNCT_RE)
        if (tm) {
            trailing = tm[0]
            token = token.slice(0, token.length - trailing.length)
            // Keep a trailing ")" that closes a "(" inside the URL, e.g.
            // wikipedia.org/wiki/Foo_(bar)
            while (trailing[0] === ')' && (token.split('(').length > token.split(')').length)) {
                token += ')'
                trailing = trailing.slice(1)
            }
        }
        if (!token) return match
        const href = /^https?:\/\//i.test(token) ? token : 'https://' + token
        return `<a href="${href}">${token}</a>${trailing}`
    })
}

export function linkifyHtml(html) {
    if (!html || typeof html !== 'string') return html
    if (html.indexOf('@') === -1 && html.indexOf('.') === -1) return html

    let out = ''
    let last = 0
    let skipDepth = 0
    let m
    LINKIFY_TAG_RE.lastIndex = 0
    while ((m = LINKIFY_TAG_RE.exec(html)) !== null) {
        const between = html.slice(last, m.index)
        out += skipDepth > 0 ? between : linkifyText(between)
        last = LINKIFY_TAG_RE.lastIndex

        const full = m[0]
        const isClose = m[1] === '/'
        const tag = m[2].toLowerCase()
        const selfClose = m[3] === '/' || LINKIFY_VOID_TAGS.has(tag)
        out += full

        if (LINKIFY_SKIP_TAGS.has(tag) && !selfClose) {
            if (isClose) skipDepth = Math.max(0, skipDepth - 1)
            else skipDepth += 1
        }
    }
    const tail = html.slice(last)
    out += skipDepth > 0 ? tail : linkifyText(tail)
    return out
}

// Ensure an href is navigable: bare domains / www. links get an https:// scheme
// so they open in the browser instead of being treated as in-app routes. The
// native auto-linker stores bare hrefs (e.g. "example.com"), so renderers call
// this before navigating.
export function normalizeLinkHref(href) {
    if (!href) return href
    // iOS EnrichedText uses greedy href=".+" and can append leftover tag
    // attributes (class/rel/target) onto the URL. Cut at the first raw
    // quote or space so only the real href is opened.
    if (/^https?:\/\//i.test(href) && /[\s"']/.test(href)) {
        href = href.replace(/^(https?:\/\/[^\s"']+).*/i, '$1')
    }
    if (/^(https?:|mailto:|tel:|\/|#|data:|blob:)/i.test(href)) return href
    // Bare domain or www. host (e.g. "example.com", "www.example.com/x") → add scheme.
    if (/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}(?:[/?#]|$)/.test(href)) {
        return 'https://' + href
    }
    return href
}
