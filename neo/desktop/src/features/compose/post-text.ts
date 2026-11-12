/**
 * Whether a post's stored HTML can be edited in the app without losing anything: the rich
 * editor (components/rich-editor) reads and writes paragraphs, line breaks, links, mentions and
 * hashtags in mini mode, and formatting, lists, quotes, code, pictures and embeds in full mode
 * too. HTML with anything else (a table, a heading the site's editor made at another level, an
 * iframe) is edited on the site.
 */
import type { EditorMode } from '../../lib/rich-html';

const KEPT: Record<EditorMode, ReadonlySet<string>> = {
    mini: new Set(['p', 'br', 'a', 'span']),
    full: new Set(['p', 'br', 'a', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'code', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'img', 'div']),
};

/** True when every tag of the HTML is one the mode keeps (a div only as the site's embed). */
export function isEditableHtml(html: string, mode: EditorMode): boolean {
    for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
        const tag = m[2]!.toLowerCase();
        if (!KEPT[mode].has(tag)) return false;
        if (tag === 'div' && !m[1] && !/\bclass="[^"]*\bbx-embed-link\b/i.test(m[3] ?? '')) return false;
    }
    return true;
}
