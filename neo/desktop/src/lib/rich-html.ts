/**
 * The HTML the site keeps for a text, written from the rich editor's document and read back
 * into it (components/rich-editor). One format for the UNA site (Quill), NEO (enriched HTML on
 * iOS and Android, Tiptap on the web) and this app, so a text written in one reads the same in
 * the others.
 *
 * Written:
 * - a mention as UNA's Quill writes it:
 *   `<a href="PROFILE_URL" title="Name" dchar="@" data-profile-id="ID" class="bx-mention-link">@Name</a>`
 *   (the site indexes mentions from `data-profile-id`);
 * - a hashtag typed as text stays text (`#word`: the site indexes hashtags from plain text and
 *   drops every other link's text); one picked from suggestions with a link is
 *   `<a class="bx-tag-link" dchar="#" href="URL">#word</a>`;
 * - links as `<a href>` (http, https and mailto only); plain URLs and emails become links when
 *   the text is saved (`linkify`, NEO's rules);
 * - paragraphs `<p>`, an empty one `<p><br></p>`, line breaks `<br>`;
 * - full mode only: `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`, `<h2>`, `<h3>`, `<ul>`/`<ol>` with
 *   `<li>` (Quill's `<li>text</li>` when an item is one paragraph), `<blockquote>` (likewise),
 *   `<pre>`, `<img src width height alt>`, UNA's embed `<div class="bx-embed-link" source="URL">URL</div>`.
 *
 * Mini mode (feed posts, comments, messages: the site's html=3 fields) writes only a, p, br
 * and span.
 *
 * Read, besides the above: NEO's mention `<a class="bx-mention-link" data-profile-id href>Name</a>`
 * (no @), the `<a class="bx-mention bx-link">@Name</a>` of seeded content, NEO's `bx-tag` hashtag,
 * NEO's embed image `<img src="…#neo-embed=URL">` (kept as the image it is) and inline images
 * of the site's editor storage (`storage.php?o=sys_images_editor…`).
 */
import type { JSONContent } from '@tiptap/core';

export type EditorMode = 'mini' | 'full';

/**
 * Comments and discussions are sent as HTML (`body_html`): comments in mini mode with mentions,
 * discussions in full mode. False sends their plain text (`body`) from mini editors without
 * mentions, for a site whose API takes no `body_html` for them.
 */
export const BODY_HTML_FOR_COMMENTS_AND_DISCUSSIONS = true;

/** The tags each mode writes. */
export const MODE_TAGS: Record<EditorMode, readonly string[]> = {
    mini: ['a', 'p', 'br', 'span'],
    full: ['a', 'p', 'br', 'span', 'strong', 'em', 'u', 's', 'code', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'img', 'div'],
};

// ---- escaping ----

export function escapeText(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(s: string): string {
    return escapeText(s).replace(/"/g, '&quot;');
}

/** A link the site and the app open: http, https and mailto. */
export function isAllowedHref(href: string | null | undefined): href is string {
    return !!href && /^(https?:\/\/|mailto:)/i.test(href.trim());
}

/** An image the text may show: http or https (the display decides which hosts it loads). */
export function isAllowedImageSrc(src: string | null | undefined): src is string {
    return !!src && /^https?:\/\//i.test(src.trim());
}

// ---- linkify (NEO's editor-mention-html.js rules, so both apps link the same text) ----

const COMMON_TLDS = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'dev', 'app', 'ai', 'me', 'info', 'biz', 'tv', 'xyz', 'online', 'site', 'tech', 'store',
    'blog', 'news', 'live', 'cloud', 'design', 'space', 'world', 'life', 'email', 'link', 'page', 'fm', 'gg', 'to', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'es',
    'it', 'nl', 'ru', 'jp', 'cn', 'in', 'br', 'mx', 'pl', 'se', 'no', 'fi', 'dk', 'ch', 'at', 'be', 'pt', 'gr', 'cz', 'ie', 'nz', 'za', 'kr', 'sg', 'hk', 'tr',
    'ua', 'ro', 'hu',
].join('|');

const URL_TOKEN = new RegExp(
    '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,24})' +
        '|((?:https?:\\/\\/|www\\.)[^\\s<>"\']+)' +
        '|(\\b(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\\.)+(?:' +
        COMMON_TLDS +
        ')\\b(?:\\/[^\\s<>"\']*)?)',
    'gi',
);
const TRAILING_PUNCT = /[).,;:!?'"\]}]+$/;

/** Plain text with its URLs and emails as links, as HTML (the text escaped). */
export function linkifyText(text: string): string {
    if (text.indexOf('@') === -1 && text.indexOf('.') === -1) return escapeText(text);
    let out = '';
    let last = 0;
    for (const m of text.matchAll(URL_TOKEN)) {
        const index = m.index ?? 0;
        // a token glued to a word before it (`x@y.com` inside `ax@y.com` is the regex's
        // business; `#tag.com` or `@name.dev` is a hashtag or a mention typed as text)
        const before = text[index - 1];
        if (before === '#' || before === '@') continue;
        out += escapeText(text.slice(last, index));
        last = index + m[0].length;
        if (m[1]) {
            out += `<a href="mailto:${escapeAttr(m[1])}">${escapeText(m[1])}</a>`;
            continue;
        }
        let token = m[0];
        let trailing = '';
        const tm = token.match(TRAILING_PUNCT);
        if (tm) {
            trailing = tm[0];
            token = token.slice(0, token.length - trailing.length);
            // a ")" that closes a "(" inside the URL stays in it: wikipedia.org/wiki/Foo_(bar)
            while (trailing[0] === ')' && token.split('(').length > token.split(')').length) {
                token += ')';
                trailing = trailing.slice(1);
            }
        }
        if (!token) {
            out += escapeText(m[0]);
            continue;
        }
        const href = /^https?:\/\//i.test(token) ? token : `https://${token}`;
        out += `<a href="${escapeAttr(href)}">${escapeText(token)}</a>${escapeText(trailing)}`;
    }
    return out + escapeText(text.slice(last));
}

// ---- the document as storage HTML ----

type Mark = NonNullable<JSONContent['marks']>[number];

/** Marks outermost first; mini mode keeps links only. */
const MARK_ORDER = ['link', 'bold', 'italic', 'underline', 'strike', 'code'] as const;
const MARK_TAG: Record<string, string> = { bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code' };

function marksOf(node: JSONContent, mode: EditorMode): Mark[] {
    const atom = node.type === 'mention' || node.type === 'hashtag';
    return (node.marks ?? [])
        .filter((m) => MARK_ORDER.includes(m.type as (typeof MARK_ORDER)[number]))
        .filter((m) => (mode === 'mini' ? m.type === 'link' : true))
        // a mention or a hashtag is a link of its own
        .filter((m) => !(atom && m.type === 'link'))
        .filter((m) => m.type !== 'link' || isAllowedHref(m.attrs?.href as string | undefined))
        .sort((a, b) => MARK_ORDER.indexOf(a.type as (typeof MARK_ORDER)[number]) - MARK_ORDER.indexOf(b.type as (typeof MARK_ORDER)[number]));
}

const sameMark = (a: Mark, b: Mark) => a.type === b.type && (a.type !== 'link' || a.attrs?.href === b.attrs?.href);
const openTag = (m: Mark) => (m.type === 'link' ? `<a href="${escapeAttr(String(m.attrs?.href ?? '').trim())}">` : `<${MARK_TAG[m.type]}>`);
const closeTag = (m: Mark) => (m.type === 'link' ? '</a>' : `</${MARK_TAG[m.type]}>`);

function str(v: unknown): string {
    return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
}

/** One inline node, without its marks. */
function inlineNode(node: JSONContent, mode: EditorMode, linked: boolean, code: boolean): string {
    const a = node.attrs ?? {};
    switch (node.type) {
        case 'text':
            return linked || code ? escapeText(node.text ?? '') : linkifyText(node.text ?? '');
        case 'hardBreak':
            return '<br>';
        case 'mention': {
            const label = str(a.label).replace(/^@/, '');
            const href = str(a.href);
            const id = str(a.id);
            return (
                '<a' +
                (isAllowedHref(href) ? ` href="${escapeAttr(href)}"` : '') +
                ` title="${escapeAttr(label)}" dchar="@"` +
                (id ? ` data-profile-id="${escapeAttr(id)}"` : '') +
                ` class="bx-mention-link">@${escapeText(label)}</a>`
            );
        }
        case 'hashtag': {
            const tag = str(a.tag).replace(/^#/, '');
            const href = str(a.href);
            if (!isAllowedHref(href)) return `#${escapeText(tag)}`;
            return `<a class="bx-tag-link" dchar="#" href="${escapeAttr(href)}">#${escapeText(tag)}</a>`;
        }
        case 'image': {
            const src = str(a.src);
            if (mode === 'mini' || !isAllowedImageSrc(src)) return '';
            const width = Number(a.width);
            const height = Number(a.height);
            return (
                `<img src="${escapeAttr(src)}"` +
                (str(a.alt) ? ` alt="${escapeAttr(str(a.alt))}"` : '') +
                (width > 0 ? ` width="${Math.round(width)}"` : '') +
                (height > 0 ? ` height="${Math.round(height)}"` : '') +
                '>'
            );
        }
        default:
            return '';
    }
}

/** Inline content, with marks nested once each (adjacent nodes share their open tags). */
function inline(nodes: readonly JSONContent[] | undefined, mode: EditorMode): string {
    let out = '';
    const open: Mark[] = [];
    for (const node of nodes ?? []) {
        const marks = marksOf(node, mode);
        let keep = 0;
        while (keep < open.length && keep < marks.length && sameMark(open[keep]!, marks[keep]!)) keep++;
        while (open.length > keep) out += closeTag(open.pop()!);
        for (const m of marks.slice(keep)) {
            out += openTag(m);
            open.push(m);
        }
        out += inlineNode(node, mode, marks.some((m) => m.type === 'link'), marks.some((m) => m.type === 'code'));
    }
    while (open.length) out += closeTag(open.pop()!);
    return out;
}

/** No text: nothing, spaces, or the `<br>` Quill puts in an empty line. */
const isEmptyParagraph = (n: JSONContent) => n.type === 'paragraph' && !(n.content ?? []).some((c) => (c.type !== 'text' && c.type !== 'hardBreak') || (c.type === 'text' && (c.text ?? '').trim() !== ''));

/** A paragraph's class kept from the site's editors: paragraph alignment. */
function alignClass(node: JSONContent): string {
    const cls = str(node.attrs?.align);
    return cls ? ` class="${escapeAttr(cls)}"` : '';
}

function paragraph(node: JSONContent, mode: EditorMode): string {
    const inner = inline(node.content, mode);
    return `<p${alignClass(node)}>${inner || '<br>'}</p>`;
}

/** Blocks whose children are paragraphs: Quill's `<li>text</li>` for one paragraph. */
function container(tag: string, node: JSONContent, mode: EditorMode): string {
    const kids = node.content ?? [];
    const only = kids.length === 1 ? kids[0] : undefined;
    if (only?.type === 'paragraph') return `<${tag}>${inline(only.content, mode)}</${tag}>`;
    return `<${tag}>${blocks(kids, mode)}</${tag}>`;
}

function textOfCode(node: JSONContent): string {
    return (node.content ?? []).map((c) => (c.type === 'hardBreak' ? '\n' : (c.text ?? ''))).join('');
}

/** A block in mini mode: everything is paragraphs. */
function miniBlocks(node: JSONContent): JSONContent[] {
    switch (node.type) {
        case 'paragraph':
            return [node];
        case 'heading':
            return [{ type: 'paragraph', content: node.content }];
        case 'codeBlock':
            return [{ type: 'paragraph', content: textOfCode(node).split('\n').flatMap((line, i) => [...(i ? [{ type: 'hardBreak' }] : []), ...(line ? [{ type: 'text', text: line }] : [])]) }];
        case 'embed': {
            const url = str(node.attrs?.url);
            return isAllowedHref(url) ? [{ type: 'paragraph', content: [{ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }] }] : [];
        }
        default:
            return (node.content ?? []).flatMap(miniBlocks);
    }
}

function block(node: JSONContent, mode: EditorMode): string {
    if (mode === 'mini') return miniBlocks(node).map((p) => paragraph(p, mode)).join('');
    switch (node.type) {
        case 'paragraph':
            return paragraph(node, mode);
        case 'heading': {
            const level = node.attrs?.level === 3 ? 3 : 2;
            return `<h${level}${alignClass(node)}>${inline(node.content, mode)}</h${level}>`;
        }
        case 'bulletList':
            return `<ul>${(node.content ?? []).map((li) => container('li', li, mode)).join('')}</ul>`;
        case 'orderedList': {
            const start = Number(node.attrs?.start ?? 1);
            return `<ol${start > 1 ? ` start="${Math.round(start)}"` : ''}>${(node.content ?? []).map((li) => container('li', li, mode)).join('')}</ol>`;
        }
        case 'listItem':
            return container('li', node, mode);
        case 'blockquote':
            return container('blockquote', node, mode);
        case 'codeBlock':
            return `<pre>${escapeText(textOfCode(node))}</pre>`;
        case 'embed': {
            const url = str(node.attrs?.url);
            return isAllowedHref(url) ? `<div class="bx-embed-link" source="${escapeAttr(url)}">${escapeText(url)}</div>` : '';
        }
        default:
            return blocks(node.content ?? [], mode);
    }
}

function blocks(nodes: readonly JSONContent[], mode: EditorMode): string {
    return nodes.map((n) => block(n, mode)).join('');
}

/**
 * The document as the HTML the site keeps, '' when it has no text: empty paragraphs at its
 * start and end are left out, ones between kept as `<p><br></p>`.
 */
export function docToHtml(doc: JSONContent | null | undefined, mode: EditorMode): string {
    const nodes = [...(doc?.content ?? [])];
    while (nodes.length && isEmptyParagraph(nodes[0]!)) nodes.shift();
    while (nodes.length && isEmptyParagraph(nodes[nodes.length - 1]!)) nodes.pop();
    return blocks(nodes, mode);
}

/** The most links a new post attaches previews of (the API's `links`). */
export const LINKS_MAX = 5;

/**
 * The web links of HTML docToHtml wrote (`<a href="…">`, not mentions, hashtags or email
 * links), each once, in order, at most LINKS_MAX: what a new feed post attaches previews of,
 * as the site's post form does for the links in its text.
 */
export function linksIn(html: string): string[] {
    const found: string[] = [];
    for (const m of html.matchAll(/<a href="(https?:\/\/[^"]+)">/gi)) {
        const url = m[1]!.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        if (!found.includes(url)) found.push(url);
        if (found.length >= LINKS_MAX) break;
    }
    return found;
}

// ---- plain text ----

function inlineText(nodes: readonly JSONContent[] | undefined): string {
    return (nodes ?? [])
        .map((n) => {
            const a = n.attrs ?? {};
            if (n.type === 'text') return n.text ?? '';
            if (n.type === 'hardBreak') return '\n';
            if (n.type === 'mention') return `@${str(a.label).replace(/^@/, '')}`;
            if (n.type === 'hashtag') return `#${str(a.tag).replace(/^#/, '')}`;
            return '';
        })
        .join('');
}

function blockText(node: JSONContent): string[] {
    switch (node.type) {
        case 'paragraph':
        case 'heading':
            return [isEmptyParagraph(node) ? '' : inlineText(node.content)];
        case 'codeBlock':
            return [textOfCode(node)];
        case 'embed':
            return [str(node.attrs?.url)];
        case 'bulletList':
            return (node.content ?? []).map((li) => `- ${(li.content ?? []).flatMap(blockText).join('\n')}`);
        case 'orderedList': {
            const start = Number(node.attrs?.start ?? 1) || 1;
            return (node.content ?? []).map((li, i) => `${start + i}. ${(li.content ?? []).flatMap(blockText).join('\n')}`);
        }
        default:
            return (node.content ?? []).flatMap(blockText);
    }
}

/**
 * The document as the plain text the API takes for comments and discussions: one line per
 * paragraph or line break, a mention as `@Name`, a hashtag as `#tag`; trimmed.
 */
export function docToText(doc: JSONContent | null | undefined): string {
    return (doc?.content ?? []).flatMap(blockText).join('\n').trim();
}

/** Plain text as a document: a paragraph per line (what docToText writes, read back). */
export function textToDoc(text: string): JSONContent {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    return { type: 'doc', content: lines.map((line) => (line ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' })) };
}

/** Plain text as mini storage HTML (a paragraph per line; URLs linked). */
export function textToRichHtml(text: string): string {
    return docToHtml(textToDoc(text.trim()), 'mini');
}

// ---- reading stored HTML: what the parse rules (components/rich-editor/schema.ts) take ----

/** The profile id and name of a mention link, in any of the three ways it is written; null for another link. */
export function readMention(a: Element): { id: string | null; label: string; href: string | null } | null {
    const cls = ` ${a.getAttribute('class') ?? ''} `;
    const dchar = a.getAttribute('dchar');
    if (dchar === '#' || /\sbx-tag(-link)?\s/.test(cls)) return null;
    const id = a.getAttribute('data-profile-id');
    const mention = id !== null || dchar === '@' || /\sbx-mention(-link)?\s/.test(cls);
    if (!mention) return null;
    const text = (a.textContent ?? '').trim().replace(/^@/, '');
    const label = (a.getAttribute('title') ?? '').trim().replace(/^@/, '') || text;
    if (!label) return null;
    const href = a.getAttribute('href');
    return { id: id && /^\d+$/.test(id.trim()) ? id.trim() : null, label, href: isAllowedHref(href) ? href.trim() : null };
}

/** The tag of a hashtag link (Quill's and the site's `bx-tag-link`, NEO's `bx-tag`); null for another link. */
export function readHashtag(a: Element): { tag: string; href: string | null } | null {
    const cls = ` ${a.getAttribute('class') ?? ''} `;
    if (a.getAttribute('dchar') !== '#' && !/\sbx-tag(-link)?\s/.test(cls)) return null;
    const tag = (a.textContent ?? '').trim().replace(/^#/, '') || (a.getAttribute('title') ?? '').trim();
    if (!tag) return null;
    const href = a.getAttribute('href');
    return { tag, href: isAllowedHref(href) ? href.trim() : null };
}

/** A paragraph's alignment class, from Quill's `ql-align-*`, NEO's `text-*` or a `text-align` style. */
export function readAlign(el: Element): string | null {
    const cls = (el.getAttribute('class') ?? '').split(/\s+/).filter((c) => /^(ql-align-(center|right|justify)|text-(center|right|justify))$/.test(c));
    if (cls.length) return cls.join(' ');
    const style = (el.getAttribute('style') ?? '').match(/text-align\s*:\s*(center|right|justify)/i);
    return style ? `ql-align-${style[1]!.toLowerCase()}` : null;
}

// ---- what the editor takes from a paste: DOMPurify configurations ----

/** Tags a paste keeps before the editor's schema reads it. */
export const PASTE_TAGS: Record<EditorMode, string[]> = {
    mini: ['a', 'p', 'br', 'span', 'div'],
    full: ['a', 'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'img'],
};
export const PASTE_ATTRS = ['href', 'src', 'alt', 'width', 'height', 'title', 'class', 'dchar', 'data-profile-id', 'source', 'start'];
/**
 * DOMPurify's test for attribute values (it applies it to every attribute that is no plain
 * text, width and dchar too): a value with a scheme only when it is http, https or mailto;
 * one without (a size, a relative path) passes, and the schema or the display then keeps only
 * absolute http(s) links and pictures.
 */
export const SAFE_URI = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;
