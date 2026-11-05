// UNA's guest splash code (Studio > Designer > Splash), as the page API sends it in `data.splash.code`:
// HTML with `<neo-slot name="...">` placeholders where the site has its forms, logo and illustration
// (UNA's BxDolSplash). The web and native renderers (ui/molecules/sections/una-splash*) parse it into a
// small tree, draw the placeholders with NEO components and the HTML between them as HTML.
//
// The parser is a tokenizer for the HTML UNA's DOM serializer writes: tags, attributes, comments, raw
// text elements and void elements. It keeps every node's source range, so a run of HTML without a
// placeholder is passed on as it is written.

/** What UNA asks the apps to draw (BxDolSplash::SLOTS). */
export const SPLASH_SLOTS = ['login_form', 'social_login', 'join_link', 'logo', 'site_title', 'illustration'] as const;
export type SplashSlotName = (typeof SPLASH_SLOTS)[number];

export type SplashText = { type: 'text'; start: number; end: number };
/** `children`: what the placeholder holds (`site_title` holds UNA's site name). */
export type SplashSlot = { type: 'slot'; name: SplashSlotName; children: SplashNode[]; start: number; end: number };
export type SplashElement = {
    type: 'element';
    tag: string;
    attrs: Record<string, string>;
    children: SplashNode[];
    start: number;
    end: number;
    /** A placeholder somewhere inside: the renderers draw this element themselves. */
    hasSlot: boolean;
};
export type SplashNode = SplashText | SplashSlot | SplashElement;

export type SplashTree = { html: string; nodes: SplashNode[] };

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title']);

const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:.-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©' };

/** Character references in an attribute value or text (named ones UNA's serializer writes, and numeric). */
export function decodeEntities(s: string): string {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ref: string) => {
        if (ref.startsWith('#')) {
            const code = ref[1] === 'x' || ref[1] === 'X' ? Number.parseInt(ref.slice(2), 16) : Number.parseInt(ref.slice(1), 10);
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        return ENTITIES[ref.toLowerCase()] ?? match;
    });
}

export function escapeHtml(s: string): string {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function parseAttrs(source: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    ATTR.lastIndex = 0;
    for (let m = ATTR.exec(source); m; m = ATTR.exec(source)) {
        const name = m[1]!.toLowerCase();
        if (!(name in attrs)) attrs[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
    }
    return attrs;
}

function isSlotName(name: string | undefined): name is SplashSlotName {
    return !!name && (SPLASH_SLOTS as readonly string[]).includes(name);
}

/**
 * What UNA already removes, again, in case the code reached the app another way: scripts, inline event
 * handlers and script links. Styles stay; the web app uses them.
 */
export function sanitizeSplashHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
        .replace(/<\/?(script|base|meta)\b[^>]*>/gi, '')
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\b(href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*(javascript|vbscript):[^"']*\2/gi, '$1=$2#$2');
}

/** Parses splash code; `<neo-slot>` elements with a known name become slots. */
export function parseSplashHtml(source: string): SplashTree {
    const html = sanitizeSplashHtml(source);
    const root: SplashElement = { type: 'element', tag: '#root', attrs: {}, children: [], start: 0, end: html.length, hasSlot: false };
    const stack: SplashElement[] = [root];
    const top = () => stack.at(-1)!;
    let pos = 0;

    const addText = (start: number, end: number) => {
        if (end > start) top().children.push({ type: 'text', start, end });
    };

    const close = (index: number, end: number) => {
        while (stack.length - 1 >= index) {
            const element = stack.pop()!;
            element.end = end;
            const parent = top();
            if (element.tag === 'neo-slot' && isSlotName(element.attrs.name)) {
                parent.children.push({ type: 'slot', name: element.attrs.name, children: element.children, start: element.start, end });
                parent.hasSlot = true;
            } else {
                parent.children.push(element);
                if (element.hasSlot) parent.hasSlot = true;
            }
            if (stack.length === 1 && index === 0) break;
        }
    };

    TAG.lastIndex = 0;
    for (let m = TAG.exec(html); m; m = TAG.exec(html)) {
        addText(pos, m.index);
        pos = TAG.lastIndex;
        if (!m[2]) continue; // a comment

        const tag = m[2].toLowerCase();
        if (m[1]) {
            // A closing tag closes the nearest open element of its name (and what is still open inside it).
            for (let i = stack.length - 1; i > 0; i--) {
                if (stack[i]!.tag === tag) {
                    close(i, pos);
                    break;
                }
            }
            continue;
        }

        const element: SplashElement = { type: 'element', tag, attrs: parseAttrs(m[3] ?? ''), children: [], start: m.index, end: pos, hasSlot: false };
        if (VOID_TAGS.has(tag) || m[4]) {
            top().children.push(element);
            continue;
        }
        if (RAW_TEXT_TAGS.has(tag)) {
            const closeAt = html.toLowerCase().indexOf(`</${tag}`, pos);
            const contentEnd = closeAt < 0 ? html.length : closeAt;
            if (contentEnd > pos) element.children.push({ type: 'text', start: pos, end: contentEnd });
            const closeEnd = closeAt < 0 ? html.length : html.indexOf('>', closeAt) + 1 || html.length;
            element.end = closeEnd;
            top().children.push(element);
            pos = closeEnd;
            TAG.lastIndex = closeEnd;
            continue;
        }
        stack.push(element);
    }
    addText(pos, html.length);
    if (stack.length > 1) close(1, html.length);

    return { html, nodes: root.children };
}

/** The source of a node as UNA wrote it. */
export function nodeSource(tree: SplashTree, node: SplashNode): string {
    return tree.html.slice(node.start, node.end);
}

/** The text of a node (a slot's fallback text, `site_title`'s site name), without its tags. */
export function nodeText(tree: SplashTree, node: SplashNode): string {
    if (node.type === 'text') return decodeEntities(nodeSource(tree, node));
    // The text nodes inside, from the tree: no regex over the markup.
    return node.children.map((child) => nodeText(tree, child)).join('');
}

/**
 * Siblings in runs: a placeholder or an element with one inside on its own, everything between them
 * as one run of plain HTML. Runs of whitespace only are dropped.
 */
export type SplashRun = { kind: 'html'; nodes: SplashNode[]; start: number; end: number } | { kind: 'node'; node: SplashSlot | SplashElement };

export function splitRuns(tree: SplashTree, nodes: SplashNode[]): SplashRun[] {
    const runs: SplashRun[] = [];
    let current: SplashNode[] = [];
    const flush = () => {
        if (!current.length) return;
        const start = current[0]!.start;
        const end = current.at(-1)!.end;
        if (tree.html.slice(start, end).trim()) runs.push({ kind: 'html', nodes: current, start, end });
        current = [];
    };
    for (const node of nodes) {
        // The site title is text: it stays in the run around it.
        if ((node.type === 'slot' && node.name !== 'site_title') || (node.type === 'element' && node.hasSlot && !isOnlySiteTitle(node))) {
            flush();
            runs.push({ kind: 'node', node });
        } else {
            current.push(node);
        }
    }
    flush();
    return runs;
}

/** An element whose only placeholders are `site_title` (text), so it renders as plain HTML. */
function isOnlySiteTitle(element: SplashElement): boolean {
    return element.children.every((child) => {
        if (child.type === 'slot') return child.name === 'site_title';
        if (child.type === 'element') return !child.hasSlot || isOnlySiteTitle(child);
        return true;
    });
}

/**
 * A run of HTML with `site_title` placeholders replaced by their text (the site name UNA put in), so
 * the plain HTML renderers never see `<neo-slot>`.
 */
export function runHtml(tree: SplashTree, start: number, end: number): string {
    return tree.html
        .slice(start, end)
        .replace(/<neo-slot\b[^>]*\bname\s*=\s*("site_title"|'site_title'|site_title)[^>]*>([\s\S]*?)<\/neo-slot\s*>/gi, '$2')
        .replace(/<\/?neo-slot\b[^>]*>/gi, '');
}

/** `text-align` from `style` or an unprefixed Tailwind alignment class: what the native renderer can align by. */
export function elementAlign(element: SplashElement): 'left' | 'center' | 'right' | null {
    const style = /(?:^|;)\s*text-align\s*:\s*(left|center|right|start|end)\b/i.exec(element.attrs.style ?? '');
    const value = style?.[1]?.toLowerCase() ?? /(?:^|\s)text-(left|center|right|start|end)(?=\s|$)/.exec(element.attrs.class ?? '')?.[1];
    if (!value) return null;
    if (value === 'start') return 'left';
    if (value === 'end') return 'right';
    return value as 'left' | 'center' | 'right';
}
