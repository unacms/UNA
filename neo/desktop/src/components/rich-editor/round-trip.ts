/**
 * Whether stored HTML comes back from the editor with nothing lost: the HTML and what the editor
 * writes for it (schema.ts `normalizeHtml`) are each read into one canonical form, and the two
 * must be the same. The form keeps every tag, attribute, class and style, so whatever the editor
 * drops or rewrites (a class of indentation or direction, a colour, a heading at another level,
 * a table, a picture it can't show) is a difference, without a list of what it could be.
 *
 * Not a difference, since nothing a reader sees is lost:
 * - how the same formatting is written: `<b>` and `<strong>` (`<i>`, `<strike>`, `<del>`), the
 *   order and the joints of nested formatting, alignment as a class or a `text-align` style, an
 *   item or a quote with or without its `<p>`, `<br />`, the order of attributes;
 * - white space HTML collapses, an empty paragraph with or without its `<br>`, empty paragraphs
 *   at the start and the end;
 * - what the editor writes its own way: `target` and `rel` of a link, a URL as plain text or as
 *   the link to it (linkifyText), a mention or a hashtag in any of the ways readMention and
 *   readHashtag take, the words inside an embed, `ql-syntax` and highlighting inside a `<pre>`,
 *   code as `<pre>` or as `<pre><code>`;
 * - what the site puts on every link it stores, and puts there again (clear_xss): the class `bx-link`.
 */
import { byCodeUnit } from '../../lib/compare';
import { type EditorMode, escapeAttr, escapeText, linkifyText, readAlign, readHashtag, readMention } from '../../lib/rich-html';
import { normalizeHtml } from './schema';

/** Formatting around text, by the name it is compared under; anything else is a block or a leaf. */
const MARKS: Record<string, string> = { a: 'a', strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'u', s: 's', strike: 's', del: 's', code: 'code', span: 'span' };

const ALIGN_CLASS = /^(ql-align-|text-)(center|right|justify)$/;
const ALIGN_STYLE = /(^|;)\s*text-align\s*:\s*(center|right|justify)\s*(;|$)/i;
/** What a mention or a hashtag link is read from (readMention, readHashtag) and written as again. */
const ATOM_ATTRS = ['href', 'title', 'dchar', 'data-profile-id', 'target', 'rel'];
const ATOM_CLASS = /^bx-(mention|tag)(-link)?$|^bx-link$/;
/** The class the site puts on every link of a member's text when it stores it (BX_DOL_LINK_CLASS). */
const LINK_CLASS = /^bx-link$/;

/** A style without the white space and the semicolons around it (one pass, whatever its length). */
function trimStyle(style: string): string {
    const around = (c: string | undefined) => c === ';' || (c !== undefined && /\s/.test(c));
    let from = 0;
    let to = style.length;
    while (from < to && around(style[from])) from++;
    while (to > from && around(style[to - 1])) to--;
    return style.slice(from, to);
}

/** An element's classes, sorted: all of them but alignment and the ones `skip` takes. */
function classesOf(value: string, skip?: RegExp): string {
    return value
        .split(/\s+/)
        .filter((c) => c && !ALIGN_CLASS.test(c) && !skip?.test(c))
        .sort(byCodeUnit)
        .join(' ');
}

/**
 * An element's attributes, sorted: all of them but `skip` and the classes `skipClass` takes.
 * Alignment is one entry however it is written (a name no attribute has, so `<p align>` is not it).
 */
function attrsOf(el: Element, skip: readonly string[] = [], skipClass?: RegExp): string {
    const align = readAlign(el);
    const out: string[] = align ? [` :align="${escapeAttr(align.replace(/ql-align-|text-/g, ''))}"`] : [];
    for (const { name, value } of Array.from(el.attributes)) {
        if (skip.includes(name)) continue;
        let kept = value;
        if (name === 'class') kept = classesOf(value, skipClass);
        else if (name === 'style') kept = trimStyle(align ? value.replace(ALIGN_STYLE, '$1') : value);
        if ((name === 'class' || name === 'style') && !kept) continue;
        out.push(` ${name}="${escapeAttr(kept)}"`);
    }
    out.sort(byCodeUnit);
    return out.join('');
}

type Run = { marks: string; text: string; atom: boolean };

/**
 * A run's text as HTML shows it after what came before it (`spaced`: nothing, a line break, or a
 * space, so white space at its start is none), and the same for what comes after it.
 */
function collapsed(run: Run, spaced: boolean): { text: string; spaced: boolean } {
    if (run.atom) return { text: run.text, spaced: run.text === '<br>' };
    let text = run.text.replace(/[ \t\r\n\f]+/g, ' ');
    if (spaced && text.startsWith(' ')) text = text.slice(1);
    // nothing of it is left: what came before it still stands
    return text ? { text: escapeText(text), spaced: text.endsWith(' ') } : { text: '', spaced };
}

/** The white space the content ends with is none: off the last text, which goes when it was all of it. */
function dropEndSpace(merged: Run[]): void {
    for (let last = merged.at(-1); last && !last.atom && last.text.endsWith(' '); last = merged.at(-1)) {
        last.text = last.text.slice(0, -1);
        if (last.text) break;
        merged.pop();
    }
}

/** Inline content: white space as HTML collapses it, neighbours with the same formatting as one. */
function inlineOf(runs: readonly Run[]): string {
    const merged: Run[] = [];
    let spaced = true;
    for (const run of runs) {
        const shown = collapsed(run, spaced);
        spaced = shown.spaced;
        if (!shown.text) continue;
        const last = merged.at(-1);
        if (last?.marks === run.marks && !last.atom && !run.atom) last.text += shown.text;
        else merged.push({ ...run, text: shown.text });
    }
    dropEndSpace(merged);
    return merged.map((r) => (r.marks ? `<m${r.marks}>${r.text}</m>` : r.text)).join('');
}

/** A link the editor makes of its own text anyway (linkifyText): the same as the text without it. */
function isAutoLink(a: Element): boolean {
    const only = a.childNodes.length === 1 ? a.firstChild : null;
    if (only?.nodeType !== Node.TEXT_NODE || a.closest('code, pre') || attrsOf(a, ['href', 'target', 'rel'], LINK_CLASS)) return false;
    const text = only.textContent ?? '';
    return linkifyText(text) === `<a href="${escapeAttr((a.getAttribute('href') ?? '').trim())}">${escapeText(text)}</a>`;
}

/** A link in the text: a hashtag, a mention, or formatting (none for a link the editor makes anyway). */
function linkOf(a: Element, marks: readonly string[]): Run | string | null {
    const rest = attrsOf(a, ATOM_ATTRS, ATOM_CLASS);
    const tag = readHashtag(a);
    // a hashtag without a link is written as its text
    if (tag) return tag.href ? { marks: marks.join(''), text: `<hashtag ${escapeAttr(JSON.stringify(tag))}${rest}>`, atom: true } : { marks: marks.join(''), text: `#${tag.tag}`, atom: false };
    const mention = readMention(a);
    if (mention) return { marks: marks.join(''), text: `<mention ${escapeAttr(JSON.stringify(mention))}${rest}>`, atom: true };
    return isAutoLink(a) ? null : `[a${attrsOf(a, ['target', 'rel'], LINK_CLASS)}]`;
}

/** The formatting with one more around it (none, or one it has, adds nothing), sorted. */
function within(marks: readonly string[], mark: string | null): readonly string[] {
    return mark && !marks.includes(mark) ? [...marks, mark].sort(byCodeUnit) : marks;
}

/**
 * What an element is inside a text: a piece of it (a line break, a picture, a hashtag, a mention),
 * formatting around its content (none for a bare span and a link the editor makes anyway), or
 * null for a block.
 */
function inlineElement(el: Element, marks: readonly string[]): { run: Run } | { mark: string | null } | null {
    const tag = el.localName;
    if (tag === 'br') return { run: { marks: marks.join(''), text: '<br>', atom: true } };
    if (tag === 'img') return { run: { marks: marks.join(''), text: `<img${attrsOf(el, el.getAttribute('alt') ? [] : ['alt'])}>`, atom: true } };
    if (tag === 'a') {
        const link = linkOf(el, marks);
        return link && typeof link !== 'string' ? { run: link } : { mark: link };
    }
    if (!MARKS[tag]) return null;
    const attrs = attrsOf(el);
    // a span with nothing on it is no formatting
    return { mark: tag === 'span' && !attrs ? null : `[${MARKS[tag]}${attrs}]` };
}

/** An element's content, piece by piece: its blocks, and the inline content between them (a `<p>` where it is loose). */
function pieces(parent: Element, loose: boolean): string[] {
    const out: string[] = [];
    let runs: Run[] = [];
    const flush = () => {
        const inline = inlineOf(runs);
        runs = [];
        if (inline) out.push(loose ? `<p>${inline}</p>` : inline);
    };
    const place = (el: Element, marks: readonly string[]) => {
        const inline = inlineElement(el, marks);
        if (!inline) {
            flush();
            // formatting around a block is not the editor's to keep: it stays in the form, as a difference
            out.push(marks.length ? `<m${marks.join('')}>${blockOf(el)}</m>` : blockOf(el));
        } else if ('run' in inline) runs.push(inline.run);
        else walk(el, within(marks, inline.mark));
    };
    const walk = (node: Node, marks: readonly string[]) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) runs.push({ marks: marks.join(''), text: child.textContent ?? '', atom: false });
            else if (child.nodeType === Node.ELEMENT_NODE) place(child as Element, marks);
        }
    };
    walk(parent, []);
    flush();
    return out;
}

function blockOf(el: Element): string {
    const tag = el.localName;
    // the site shows an embed's card from its `source`, whatever the element holds
    if (tag === 'div' && el.classList.contains('bx-embed-link')) return `<embed${attrsOf(el, [], /^bx-embed-link$/)}>`;
    // code is its text: the site's editor marks and highlights it again
    // (and as `<pre><code>` with nothing on the `<code>` it is the same text)
    const only = el.children.length === 1 ? el.firstElementChild : null;
    const code = only?.localName === 'code' && !only.attributes.length && only.textContent === el.textContent ? only : el;
    if (tag === 'pre' && Array.from(code.querySelectorAll('*')).every((e) => e.localName === 'span')) return `<pre${attrsOf(el, ['spellcheck'], /^ql-syntax$/)}>${escapeText(el.textContent ?? '')}</pre>`;
    const inner = pieces(el, tag === 'li' || tag === 'blockquote').join('');
    const skip = tag === 'ol' && Number(el.getAttribute('start')) === 1 ? ['start'] : [];
    return `<${tag}${attrsOf(el, skip)}>${inner || (tag === 'p' ? '<br>' : '')}</${tag}>`;
}

/** A paragraph with nothing to read in it: line breaks and spaces, the ones that do not break too. */
const EMPTY_PARAGRAPH = /^<p[^>]*>(?:<br>|[\s\u00a0])*<\/p>$/;

/** HTML in the form two texts are compared in (see the top of the file). */
export function canonicalHtml(html: string): string {
    const blocks = pieces(new DOMParser().parseFromString(html, 'text/html').body, true);
    while (blocks.length && EMPTY_PARAGRAPH.test(blocks[0]!)) blocks.shift();
    while (blocks.length && EMPTY_PARAGRAPH.test(blocks.at(-1)!)) blocks.pop();
    return blocks.join('');
}

/** True when the mode's editor writes this HTML back whole: a text it can be given to edit. */
export function survivesEditor(html: string, mode: EditorMode): boolean {
    return canonicalHtml(html) === canonicalHtml(normalizeHtml(html, mode));
}
