// Конвертация между <mention> (react-native-enriched-html) и
// UNA-форматом <a class="bx-mention-link" data-profile-id href>.

const MENTION_TAG_RE = /<mention\b([^>]*)>([\s\S]*?)<\/mention>/gi
// ссылки UNA с классом bx-mention-link или bx-tag
const UNA_LINK_RE = /<a\b([^>]*?\bclass="[^"]*\b(?:bx-mention-link|bx-tag)\b[^"]*"[^>]*?)>([\s\S]*?)<\/a>/gi

function attr(attrs, name) {
    const m = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'))
    return m ? m[1] : ''
}

// При сохранении: <mention> -> <a class="bx-mention-link">
export function mentionsToUnaLinks(html) {
    if (!html) return html
    return html.replace(MENTION_TAG_RE, (_full, attrs, inner) => {
        const indicator = attr(attrs, 'indicator') || '@'
        const profileId = attr(attrs, 'data-profile-id')
        const href = attr(attrs, 'href')
        const cls = indicator === '#' ? 'bx-tag' : 'bx-mention-link'
        const text = inner.trim()
        const idAttr = profileId ? ` data-profile-id="${profileId}"` : ''
        const hrefAttr = href ? ` href="${href}"` : ''
        return `<a class="${cls}"${idAttr}${hrefAttr}>${text}</a>`
    })
}

// При загрузке: <a class="bx-mention-link"> -> <mention> (чтобы упоминания
// в существующем контенте снова стали редактируемыми упоминаниями)
export function unaLinksToMentions(html) {
    if (!html) return html
    return html.replace(UNA_LINK_RE, (_full, attrs, inner) => {
        const cls = attr(attrs, 'class')
        const indicator = /\bbx-tag\b/.test(cls) ? '#' : '@'
        const profileId = attr(attrs, 'data-profile-id')
        const href = attr(attrs, 'href')
        const text = inner.trim()
        const idAttr = profileId ? ` data-profile-id="${profileId}"` : ''
        const hrefAttr = href ? ` href="${href}"` : ''
        // двойные кавычки обязательны для корректного парсинга (issue #404)
        return `<mention indicator="${indicator}" text="${indicator}${text}"${idAttr}${hrefAttr}>${text}</mention>`
    })
}
