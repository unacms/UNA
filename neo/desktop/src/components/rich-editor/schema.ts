/**
 * The rich editor's document: Tiptap extensions per mode, and stored HTML read into the
 * document (the HTML written from it is lib/rich-html.ts `docToHtml`). Every way the site, NEO
 * and seeded content write a mention, a hashtag, an embed and an inline image is read here.
 */
import { Extension, generateJSON, type JSONContent, Node, type Extensions } from '@tiptap/core';
import { Link } from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';

import { docToHtml, type EditorMode, isAllowedHref, isAllowedImageSrc, readAlign, readHashtag, readMention } from '../../lib/rich-html';

/** Takes a node rule before the Link mark's `a[href]` (marks' rules come first at equal priority). */
const BEFORE_LINKS = 1100;

/** Attributes the node's own parse rule fills in (Tiptap would read `id` from the element's id). */
const fromRule = (fallback: unknown = null) => ({ default: fallback, parseHTML: () => null, rendered: false });

/**
 * A mention of a profile, an atom: deleted and moved as a whole. The editor draws it as a span
 * (a link inside an editable text would open on a click); stored, it is the site's link.
 */
export const Mention = Node.create({
    name: 'mention',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes() {
        return { id: fromRule(), label: fromRule(''), href: fromRule() };
    },
    parseHTML() {
        return [
            { tag: 'a', priority: BEFORE_LINKS, getAttrs: (el) => readMention(el as Element) ?? false },
            // the editor's own copy, pasted back
            {
                tag: 'span.rich-mention',
                priority: BEFORE_LINKS,
                getAttrs: (el) => {
                    const e = el as HTMLElement;
                    const label = (e.textContent ?? '').trim().replace(/^@/, '');
                    if (!label) return false;
                    const href = e.getAttribute('data-href');
                    return { id: e.getAttribute('data-profile-id'), label, href: isAllowedHref(href) ? href : null };
                },
            },
        ];
    },
    renderHTML({ node }) {
        const attrs: Record<string, string> = { class: 'rich-mention' };
        if (node.attrs.id) attrs['data-profile-id'] = String(node.attrs.id);
        if (node.attrs.href) attrs['data-href'] = String(node.attrs.href);
        return ['span', attrs, `@${String(node.attrs.label)}`];
    },
    renderText({ node }) {
        return `@${String(node.attrs.label)}`;
    },
});

/** A hashtag picked from suggestions, with its link; a typed `#word` is text. */
export const Hashtag = Node.create({
    name: 'hashtag',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes() {
        return { tag: fromRule(''), href: fromRule() };
    },
    parseHTML() {
        return [
            { tag: 'a', priority: BEFORE_LINKS + 1, getAttrs: (el) => readHashtag(el as Element) ?? false },
            {
                tag: 'span.rich-hashtag',
                priority: BEFORE_LINKS,
                getAttrs: (el) => {
                    const e = el as HTMLElement;
                    const tag = (e.textContent ?? '').trim().replace(/^#/, '');
                    const href = e.getAttribute('data-href');
                    return tag ? { tag, href: isAllowedHref(href) ? href : null } : false;
                },
            },
        ];
    },
    renderHTML({ node }) {
        const attrs: Record<string, string> = { class: 'rich-hashtag' };
        if (node.attrs.href) attrs['data-href'] = String(node.attrs.href);
        return ['span', attrs, `#${String(node.attrs.tag)}`];
    },
    renderText({ node }) {
        return `#${String(node.attrs.tag)}`;
    },
});

export type ImageOptions = {
    /** The `src` the editor shows for a stored one (a local site's pictures go through the app's scheme). */
    displaySrc: (src: string) => string | null;
};

/**
 * An image in the text, inline as the site's editor puts it (in a paragraph): the site's editor
 * uploads, NEO's embed preview (`#neo-embed=` in its src) and pictures from elsewhere.
 */
export const InlineImage = Node.create<ImageOptions>({
    name: 'image',
    group: 'inline',
    inline: true,
    atom: true,
    draggable: true,
    addOptions() {
        return { displaySrc: (src: string) => src };
    },
    addAttributes() {
        return { src: fromRule(), alt: fromRule(), width: fromRule(), height: fromRule() };
    },
    parseHTML() {
        return [
            {
                tag: 'img',
                getAttrs: (el) => {
                    const e = el as HTMLElement;
                    // the editor's copy carries the stored src beside the shown one
                    const src = e.getAttribute('data-src') ?? e.getAttribute('src');
                    if (!isAllowedImageSrc(src)) return false;
                    const size = (name: string) => {
                        const n = Number(e.getAttribute(name));
                        return n > 0 ? Math.round(n) : null;
                    };
                    return { src: src.trim(), alt: e.getAttribute('alt') || null, width: size('width'), height: size('height') };
                },
            },
        ];
    },
    renderHTML({ node }) {
        const src = String(node.attrs.src ?? '');
        const attrs: Record<string, string> = { src: this.options.displaySrc(src) ?? '', 'data-src': src, alt: String(node.attrs.alt ?? '') };
        if (node.attrs.width) attrs.width = String(node.attrs.width);
        if (node.attrs.height) attrs.height = String(node.attrs.height);
        return ['img', attrs];
    },
});

/** UNA's embed (`<div class="bx-embed-link" source="URL">`): the site shows the page's card. */
export const Embed = Node.create({
    name: 'embed',
    group: 'block',
    atom: true,
    draggable: true,
    addAttributes() {
        return { url: fromRule('') };
    },
    parseHTML() {
        return [
            {
                tag: 'div.bx-embed-link',
                getAttrs: (el) => {
                    const url = (el as Element).getAttribute('source')?.trim() ?? '';
                    return isAllowedHref(url) && !/^mailto:/i.test(url) ? { url } : false;
                },
            },
        ];
    },
    renderHTML({ node }) {
        // `source` too, so the editor's own copy pastes back as the embed
        return ['div', { class: 'bx-embed-link rich-embed', source: String(node.attrs.url), contenteditable: 'false' }, String(node.attrs.url)];
    },
    renderText({ node }) {
        return String(node.attrs.url);
    },
});

/** Paragraph and heading alignment written by the site's editor or NEO, kept as their class. */
const Alignment = Extension.create({
    name: 'alignment',
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    align: {
                        default: null,
                        parseHTML: (el) => readAlign(el),
                        renderHTML: (attrs) => (attrs.align ? { class: String(attrs.align) } : {}),
                    },
                },
            },
        ];
    },
});

/**
 * Links that end where they end: typing after one is not more of it (Tiptap makes links
 * inclusive when it links URLs as they are typed, which its own rule does without that).
 */
const TextLink = Link.extend({ inclusive: () => false });

const linkOptions = {
    autolink: true,
    linkOnPaste: true,
    openOnClick: false,
    defaultProtocol: 'https',
    protocols: ['mailto'],
    isAllowedUri: (url: string) => isAllowedHref(url),
    // the editor's copy: no target or rel (the stored link is written by docToHtml)
    HTMLAttributes: { target: null, rel: null, class: null },
};

/** The extensions of a mode's document (no editor behaviour: what reading and writing need). */
export function schemaExtensions(mode: EditorMode, image?: Partial<ImageOptions>): Extensions {
    const mini = mode === 'mini';
    const kit = StarterKit.configure({
        heading: mini ? false : { levels: [2, 3] },
        bold: mini ? false : {},
        italic: mini ? false : {},
        underline: mini ? false : {},
        strike: mini ? false : {},
        code: mini ? false : {},
        codeBlock: mini ? false : {},
        blockquote: mini ? false : {},
        bulletList: mini ? false : {},
        orderedList: mini ? false : {},
        listItem: mini ? false : {},
        listKeymap: mini ? false : {},
        horizontalRule: false,
        trailingNode: false,
        dropcursor: mini ? false : {},
        gapcursor: mini ? false : undefined,
        // its own, below
        link: false,
    });
    return [kit, TextLink.configure(linkOptions), Alignment, Mention, Hashtag, ...(mini ? [] : [InlineImage.configure(image ?? {}), Embed])];
}

/** Stored HTML as the editor writes it back: what an untouched text is, to tell an edit from none. */
export function normalizeHtml(html: string, mode: EditorMode): string {
    return docToHtml(htmlToDoc(html, mode), mode);
}

/** Stored HTML (any of the formats above) as a mode's document. */
export function htmlToDoc(html: string, mode: EditorMode): JSONContent {
    if (!html.trim()) return { type: 'doc', content: [{ type: 'paragraph' }] };
    return generateJSON(html, schemaExtensions(mode)) as JSONContent;
}
