import DOMPurify from 'dompurify';
import { useContext, useEffect, useMemo, useRef } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../lib/api';
import { AppContext } from '../lib/context';
import { mediaSrc } from '../lib/media';
import { useOptionalNavigation } from '../lib/navigation';
import { useClick } from '../lib/use-click';
import { isAllowedHref, readAlign, readHashtag, readMention, SAFE_URI } from '../lib/rich-html';
import './rich-text.css';

/**
 * The site filters HTML on save; this filters it again on display, as the API asks: no styles,
 * no event handlers, links only to http, https and mailto, pictures only from where the app
 * loads pictures (lib/media.ts). It shows what the editor writes (components/rich-editor) and
 * what the site and NEO write: mentions (opening the profile here), hashtags (searching for
 * them here), embeds (a link card), inline pictures and the site's formatting.
 */
const config = {
    ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h2', 'h3', 'h4', 'span', 'img', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'title', 'class', 'dchar', 'data-profile-id', 'source', 'start'],
    ALLOWED_URI_REGEXP: SAFE_URI,
    FORBID_TAGS: ['style', 'script'],
    // DOMPurify lets every data-* and aria-* attribute through unless told not to. The app steers
    // by its own (data-pane, data-own-keys, data-tauri-drag-region) and names its controls with
    // aria-*: a post must not bring any. data-profile-id is the one listed above.
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
};

const EMBED_MARK = '#neo-embed=';

function httpUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    try {
        const u = new URL(raw.trim());
        return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
    } catch {
        return null;
    }
}

/** A picture's address on the site (the site's editor may write one relative to it). */
function absolute(src: string, site: string | null): string {
    if (!site || /^[a-z][a-z0-9+.-]*:/i.test(src)) return src;
    try {
        return new URL(src, site.endsWith('/') ? site : `${site}/`).href;
    } catch {
        return src;
    }
}

/** An embed (UNA's div or NEO's preview image) as a link card: the page's host and address. */
function embedCard(doc: Document, url: string): HTMLElement {
    const a = doc.createElement('a');
    a.className = 'rich-embed-card';
    a.setAttribute('href', url);
    const host = doc.createElement('span');
    host.className = 'rich-embed-host';
    host.textContent = new URL(url).hostname.replace(/^www\./, '');
    const address = doc.createElement('span');
    address.className = 'rich-embed-url';
    address.textContent = url;
    a.append(host, address);
    return a;
}

/** The URL a NEO embed image carries (`…#neo-embed=<url>`), or null. */
export function embedUrlOf(src: string): string | null {
    const at = src.indexOf(EMBED_MARK);
    if (at < 0) return null;
    try {
        return httpUrl(decodeURIComponent(src.slice(at + EMBED_MARK.length)));
    } catch {
        return null;
    }
}

const HASHTAG = /(^|[\s(])#([\p{L}\p{N}_]{1,50})/gu;

/** `#word` in text (not in links or code) as a link that searches for it. */
function linkHashtags(doc: Document, root: Node): void {
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const parent = (n as Text).parentElement;
        if (parent?.closest('a, code, pre')) continue;
        if ((n as Text).data.includes('#')) texts.push(n as Text);
    }
    for (const t of texts) {
        const parts: (string | HTMLElement)[] = [];
        let last = 0;
        for (const m of t.data.matchAll(HASHTAG)) {
            const start = (m.index ?? 0) + (m[1]?.length ?? 0);
            parts.push(t.data.slice(last, start));
            const a = doc.createElement('a');
            a.className = 'rich-hashtag';
            a.setAttribute('href', `#tag/${encodeURIComponent(m[2]!)}`);
            a.setAttribute('data-hashtag', m[2]!);
            a.textContent = `#${m[2]}`;
            parts.push(a);
            last = start + 1 + m[2]!.length;
        }
        if (!parts.length) continue;
        parts.push(t.data.slice(last));
        t.replaceWith(...parts.filter((p) => p !== ''));
    }
}

/**
 * Stored HTML as the app shows it. `site` is the signed-in site (its own plain-http pictures,
 * relative links); `inApp` links hashtags to a search (only where the app can show one).
 */
export function displayHtml(html: string, site: string | null, inApp = true): string {
    const fragment = DOMPurify.sanitize(html, { ...config, RETURN_DOM_FRAGMENT: true });
    const doc = fragment.ownerDocument;

    for (const img of Array.from(fragment.querySelectorAll('img'))) {
        const raw = img.getAttribute('src') ?? '';
        const embed = embedUrlOf(raw);
        if (embed) {
            img.replaceWith(embedCard(doc, embed));
            continue;
        }
        const src = mediaSrc(absolute(raw.split(EMBED_MARK)[0] ?? '', site), site);
        if (!src) {
            // a picture the app does not load: its words, if it has any
            const alt = img.getAttribute('alt');
            img.replaceWith(alt ? doc.createTextNode(alt) : '');
            continue;
        }
        img.setAttribute('src', src);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('alt', img.getAttribute('alt') ?? '');
        for (const dim of ['width', 'height']) {
            const v = Number(img.getAttribute(dim));
            if (!(v > 0)) img.removeAttribute(dim);
        }
    }

    for (const div of Array.from(fragment.querySelectorAll('div'))) {
        const url = /\bbx-embed-link\b/.test(div.getAttribute('class') ?? '') ? httpUrl(div.getAttribute('source')) : null;
        if (url) div.replaceWith(embedCard(doc, url));
        else div.replaceWith(...Array.from(div.childNodes));
    }

    for (const a of Array.from(fragment.querySelectorAll('a'))) {
        if (a.classList.contains('rich-embed-card')) continue;
        const mention = readMention(a);
        const tag = mention ? null : readHashtag(a);
        for (const name of ['class', 'dchar', 'title', 'data-profile-id']) a.removeAttribute(name);
        if (mention) {
            a.className = 'rich-mention';
            if (mention.id) a.setAttribute('data-profile-id', mention.id);
            a.textContent = `@${mention.label}`;
            if (!mention.href && !mention.id) a.replaceWith(doc.createTextNode(`@${mention.label}`));
        } else if (tag) {
            a.className = 'rich-hashtag';
            a.setAttribute('data-hashtag', tag.tag);
            if (!a.getAttribute('href')) a.setAttribute('href', `#tag/${encodeURIComponent(tag.tag)}`);
            a.textContent = `#${tag.tag}`;
        } else if (!isAllowedHref(a.getAttribute('href'))) {
            // a relative or fragment link would move the app's own page: its words only
            a.replaceWith(...Array.from(a.childNodes));
        }
    }

    // classes only the app's own: the site's alignment as one of them, nothing else of a class
    for (const el of Array.from(fragment.querySelectorAll('[class]'))) {
        if (el.matches('a.rich-mention, a.rich-hashtag, .rich-embed-card, .rich-embed-card *')) continue;
        const align = readAlign(el);
        el.removeAttribute('class');
        if (align) el.classList.add(`rich-align-${align.replace(/^(ql-align-|text-)/, '').split(' ')[0]}`);
    }

    if (inApp) linkHashtags(doc, fragment);
    const box = doc.createElement('div');
    box.append(fragment);
    return box.innerHTML;
}

type LinkCard = Schema<'LinkCard'>;

/** Cards read this session, by site and link: one request per link, however often it is shown. */
const cards = new Map<string, Promise<LinkCard | null>>();
const PENDING_RETRY_MS = 4000;

/** A link's card from the site (GET /links/preview), asked again once while the site reads it in the background. */
export function linkCard(api: UnaApi, site: string, url: string): Promise<LinkCard | null> {
    const key = `${site}|${url}`;
    let card = cards.get(key);
    if (!card) {
        const ask = async (again: boolean): Promise<LinkCard | null> => {
            const found = unwrap(await api.GET('/links/preview', { params: { query: { url } } }));
            if (found.state === 'pending' && again) {
                await new Promise((r) => setTimeout(r, PENDING_RETRY_MS));
                return ask(false);
            }
            return found;
        };
        card = ask(true).catch(() => {
            // asked again next time it is shown
            cards.delete(key);
            return null;
        });
        cards.set(key, card);
    }
    return card;
}

/** Forget the cards read (tests; a session change keeps them, as they are the same for everyone). */
export function forgetLinkCards(): void {
    cards.clear();
}

/** A card's title, description and picture, put into its link (text only, the picture as the app loads pictures). */
function fillCard(a: HTMLAnchorElement, card: LinkCard, site: string | null): void {
    if (a.dataset.filled) return;
    a.dataset.filled = '1';
    const doc = a.ownerDocument;
    const text = doc.createElement('span');
    text.className = 'rich-embed-text';
    const host = doc.createElement('span');
    host.className = 'rich-embed-host';
    host.textContent = card.site_name || card.host;
    text.append(host);
    if (card.title && card.title !== card.host) {
        const title = doc.createElement('span');
        title.className = 'rich-embed-title';
        title.textContent = card.title;
        text.append(title);
    }
    if (card.description) {
        const description = doc.createElement('span');
        description.className = 'rich-embed-description';
        description.textContent = card.description;
        text.append(description);
    }
    const parts: Node[] = [];
    const src = mediaSrc(card.image, site);
    if (src) {
        const img = doc.createElement('img');
        img.className = 'rich-embed-image';
        img.alt = '';
        img.loading = 'lazy';
        img.src = src;
        img.addEventListener('error', () => img.remove());
        parts.push(img);
    }
    parts.push(text);
    a.classList.add('is-filled');
    a.replaceChildren(...parts);
}

export function RichText({ html, className }: { html: string; className?: string }) {
    const app = useContext(AppContext);
    const site = app?.siteUrl ?? null;
    const api = app?.api ?? null;
    const nav = useOptionalNavigation();
    const clean = useMemo(() => displayHtml(html, site, !!nav), [html, site, nav]);
    const box = useRef<HTMLDivElement>(null);

    // embeds: their cards as the site reads them, put in once they come
    useEffect(() => {
        const el = box.current;
        if (!el || !api || !site) return;
        let live = true;
        for (const a of Array.from(el.querySelectorAll<HTMLAnchorElement>('a.rich-embed-card:not([data-filled])'))) {
            const url = a.getAttribute('href');
            if (!url) continue;
            void linkCard(api, site, url).then((card) => {
                if (live && card && a.isConnected) fillCard(a, card, site);
            });
        }
        return () => {
            live = false;
        };
    }, [clean, api, site]);

    // a mention opens the profile here, a hashtag the search for it; other links as anywhere
    // (a listener on the box: the links are the controls, and Enter on one is a click too)
    useClick(box, (e, el) => {
        if (!nav || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest('a');
        if (!a || !el.contains(a)) return;
        const profile = a.getAttribute('data-profile-id');
        const tag = a.getAttribute('data-hashtag');
        if (!profile && !tag) return;
        e.preventDefault();
        // the app's link handler (lib/native.ts captureLinks) and the row around it don't take it
        e.stopPropagation();
        if (profile) nav.openDetail({ kind: 'profile', id: profile });
        else if (tag) nav.showSearch(`#${tag}`, 'posts');
    });

    return <div ref={box} className={`rich-text${className ? ' ' + className : ''}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
