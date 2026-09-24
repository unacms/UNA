/**
 * Shared mention helpers for tentap + enriched editors.
 * URL building, UNA HTML, trigger parsing, and TipTap insert live here so both
 * engines follow the same rules.
 */

export const MENTION_INDICATORS = ['@', '#']

export const MENTION_TYPE_LABELS: Record<string, string> = {
    bx_persons: 'People',
    bx_organizations: 'Organizations',
    other: 'Other',
}

function hasMentionContext(mentions: any) {
    if (!mentions || typeof mentions !== 'object') return false
    return !!(
        mentions.ct ||
        mentions.cm ||
        (mentions.ci != null && mentions.ci !== '') ||
        (mentions.cp != null && mentions.cp !== '')
    )
}

function appendMentionParam(url: string, key: string, value: any) {
    if (value == null || value === '') return url
    return url + '&' + key + '=' + encodeURIComponent(value)
}

/** Build the UNA get_mention search URL (same query for both engines). */
export function buildMentionSearchUrl({ fieldName, objectPrivacyView, objectId, mentions }: { fieldName?: string; objectPrivacyView?: number | string; objectId?: number | string; mentions?: any }) {
    let url = '/searchExtended.php?api=1&action=get_mention'

    if (hasMentionContext(mentions)) {
        url = appendMentionParam(url, 'ct', mentions.ct)
        url = appendMentionParam(url, 'cm', mentions.cm)
        url = appendMentionParam(url, 'ci', mentions.ci)
        url = appendMentionParam(url, 'cp', mentions.cp)
        return url
    }

    // Backward compatibility: older UNA forms without a mentions payload.
    const m = fieldName === 'cmt_text' ? 'sys_cmts' : 'bx_timeline'
    if (m) url += '&m=' + m
    if (objectPrivacyView) url += '&object_privacy_view=' + objectPrivacyView
    if (objectId) url += '&cid=' + objectId
    return url
}

/**
 * UNA mention / tag anchor HTML — tentap inserts this via string replace;
 * enriched converts its <mention> marks to this shape on save.
 */
export function buildUnaMentionHtml(user: any) {
    const label = escapeHtml((user?.label || '').trim())
    const id = user?.value
    const href = escapeHtml(user?.url || '')
    const extraClass = user?.classname || ''
    return (
        `<a class="bx-mention-link data-profile-id=${id} ${extraClass}"` +
        ` data-profile-id="${id}" href="${href}">${label}</a>`
    )
}

/** Attributes stored on enriched <mention> marks / setMention(). */
export function mentionAttributesForUser(user: any) {
    return {
        'data-profile-id': String(user.value),
        href: user.url || '',
        class: `bx-mention-link ${user.classname || ''}`.trim(),
    }
}

/**
 * Parse the active @/# trigger from text before the caret.
 * Same rule as the tentap iframe: last whitespace-delimited token.
 */
export function parseMentionTrigger(textBeforeCursor: string) {
    if (typeof textBeforeCursor !== 'string') return null
    const token = textBeforeCursor.split(/\s/).pop() || ''
    const indicator = token.charAt(0)
    if (indicator !== '@' && indicator !== '#') return null
    return {
        indicator,
        // Match tentap iframe: search term is lowercased; token keeps typed casing
        // so TipTap range math stays aligned with the document.
        term: token.slice(1).toLowerCase(),
        token,
    }
}

/**
 * Text in the current block before the caret (TipTap / ProseMirror).
 * Used on web for enriched so detection matches tentap.
 */
export function getTextBeforeCursorFromTiptap(editor: any) {
    if (!editor?.state) return ''
    try {
        const { $from } = editor.state.selection
        return $from.parent.textBetween(0, $from.parentOffset, '\n', '\n')
    } catch {
        return ''
    }
}

/**
 * Insert a finalized mention into TipTap (enriched web). Finds the active @/#
 * token with the same parse rule as tentap — does not depend on the library
 * MentionPlugin trigger / setMention(), which no-ops after blur.
 */
export function insertMentionInTiptap(editor: any, user: any, indicator = '@') {
    if (!editor?.state?.selection) return false
    const label = (user?.label || '').trim()
    if (!label) return false

    const { $from } = editor.state.selection
    if (!$from?.parent?.isTextblock) return false

    const blockStart = $from.start()
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '\n')
    const parsed = parseMentionTrigger(textBefore)
    const ind = parsed?.indicator || indicator

    let from = $from.pos
    let to = $from.pos
    if (parsed && parsed.indicator === ind) {
        from = blockStart + (textBefore.length - parsed.token.length)
        to = $from.pos
    }

    const attrs = mentionAttributesForUser(user)
    const html =
        `<mention indicator="${escapeAttr(ind)}" text="${escapeAttr(label)}"` +
        ` data-profile-id="${escapeAttr(attrs['data-profile-id'])}"` +
        ` href="${escapeAttr(attrs.href)}"` +
        ` class="${escapeAttr(attrs.class)}">` +
        `${escapeHtml(label)}</mention>&nbsp;`

    try {
        return editor.chain().focus().insertContentAt({ from, to }, html).run()
    } catch {
        return false
    }
}

function escapeHtml(s: string) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function escapeAttr(s: string) {
    return escapeHtml(s).replace(/'/g, '&#39;')
}
