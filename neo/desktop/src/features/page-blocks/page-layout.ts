/**
 * A section's page as the site's Pages builder sets it up (GET /layout/resolve): its layout and
 * the blocks beside its main content, and which of them show on the screen the content pane is
 * now. The app draws a page's main cell itself (Home's feed); the other cells' blocks are its
 * complementary blocks, drawn by kind.
 */
import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useState, type RefObject } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';

export type ResolvedPage = Schema<'ResolvedPage'>;
export type ResolvedBlock = Schema<'ResolvedBlock'>;
/** UNA's screens: the site's three widths (and the mobile app, which the desktop app never is). */
export type Screen = Schema<'Screen'>;

/**
 * The site page each section shows: Home is the site's root page, Explore its explore page,
 * Posts and Discussions their modules' home pages.
 */
export const SECTION_PAGES = { home: '/', explore: '/page/explore', posts: '/page/posts-home', discussions: '/page/discussions-home' } as const;

/**
 * The path on the site of a profile's (or a group's, space's or event's) page: the path and
 * query of its `url` under the site's address, which GET /layout/resolve reads as the site does
 * (an SEO link names the page and its id). Null for none, or a link elsewhere.
 */
export function sitePath(url: string | null | undefined, siteUrl: string): string | null {
    if (!url) return null;
    let link: URL;
    let site: URL;
    try {
        link = new URL(url);
        site = new URL(siteUrl);
    } catch {
        return null;
    }
    if (link.host.toLowerCase() !== site.host.toLowerCase() || !/^https?:$/.test(link.protocol)) return null;
    const base = site.pathname.replace(/\/+$/, '');
    if (base && link.pathname !== base && !link.pathname.startsWith(`${base}/`)) return null;
    const path = link.pathname.slice(base.length) || '/';
    return `${path.startsWith('/') ? path : `/${path}`}${link.search}`;
}

export const pageLayoutKey = (path: string) => ['page-layout', path] as const;
export const pageBlockKey = (endpoint: string) => ['page-block', endpoint] as const;

/**
 * The content pane's widths for UNA's screens, as container queries: from DESKTOP_MIN a page's
 * side cells go beside its main one (a 320px column next to a feed of 600px and more), from
 * TABLET_MIN it is a tablet, narrower a phone.
 */
export const DESKTOP_MIN = 960;
export const TABLET_MIN = 600;

/**
 * The screen the content pane is: by its width, and a phone whenever a detail is open beside it
 * (the list narrows to a column of its own, as the site's page on a phone). Not measured (tests,
 * the first frame): a tablet, which draws no column beside the feed.
 */
export function screenOf(width: number | null, detailBeside: boolean): Screen {
    if (detailBeside) return 'phone';
    if (width === null) return 'tablet';
    if (width >= DESKTOP_MIN) return 'desktop';
    return width >= TABLET_MIN ? 'tablet' : 'phone';
}

/** The kinds of block the app draws; others are skipped. */
export const DRAWN_KINDS: ReadonlySet<string> = new Set([
    'graph.friends',
    'graph.friend_suggestions',
    'graph.follow_suggestions',
    'posts.list',
    'groups.list',
    'groups.joined',
    'spaces.list',
    'spaces.joined',
    'events.list',
    'events.joined',
    'profile.info',
    'groups.members',
    'spaces.members',
    'events.members',
    'posts.categories',
    'discussions.categories',
    'discussions.list',
    // a text block written in Studio (About, Terms, Privacy): the site's HTML, drawn as rich text
    'text.html',
]);

/** Whether a block shows on a screen: one the app draws, with a route, not hidden there ("Hidden on"). */
export function shownOn(block: ResolvedBlock, screen: Screen): boolean {
    return DRAWN_KINDS.has(block.kind) && !!block.endpoint && !block.design.hidden_on.includes(screen);
}

/** How many items a paged block asks for as a side card, when its route names no `limit` (the API's own for a side cell). */
export const SIDE_LIMIT = 5;

/**
 * A block as a card beside the page's content: a paged one of the page's main cell (whose route
 * has no `limit`: on the site it is a whole list) asks for a card's few items.
 */
export function sideCard(block: ResolvedBlock): ResolvedBlock {
    if (!block.paged || !block.endpoint) return block;
    const [path = '', search = ''] = block.endpoint.split('?', 2);
    const query = new URLSearchParams(search);
    if (query.has('limit')) return block;
    query.set('limit', String(SIDE_LIMIT));
    return { ...block, endpoint: `${path}?${query.toString()}` };
}

/**
 * A page's complementary blocks that show on a screen: those of its `top` cell, of its side
 * cells (`side`, `left`, `right`, in reading order: the desktop app draws them in one column on
 * the right, the sidebar being on the left already) and of its `bottom` cell. The main cell is
 * the app's own.
 *
 * `about` is a profile's or a context's page, whose own content is its timeline wherever the
 * site puts it (the site's group page has Info in its main half and the posts in the bottom
 * row, a person's page has Friends in its main column): every block the app draws about it,
 * from any cell, goes beside the timeline as a side card (sideCard), Info first, the others in
 * the page's reading order.
 */
export function complementary(page: ResolvedPage | undefined, screen: Screen, about = false): { top: ResolvedBlock[]; side: ResolvedBlock[]; bottom: ResolvedBlock[] } {
    const out = { top: [] as ResolvedBlock[], side: [] as ResolvedBlock[], bottom: [] as ResolvedBlock[] };
    if (about) {
        for (const cell of page?.cells ?? []) for (const block of cell.blocks) if (shownOn(block, screen)) out.side.push(sideCard(block));
        // what the profile is comes before who is in it (sort is stable: the rest keep their order)
        out.side.sort((a, b) => Number(b.kind === 'profile.info') - Number(a.kind === 'profile.info'));
        return out;
    }
    for (const cell of page?.cells ?? []) {
        if (cell.name === 'main') continue;
        const into = cell.name === 'top' ? out.top : cell.name === 'bottom' ? out.bottom : out.side;
        for (const block of cell.blocks) if (shownOn(block, screen)) into.push(block);
    }
    return out;
}

/** A block's route as a path under the API's base and its query; null for one that is not a plain path. */
export function blockRoute(endpoint: string): { path: string; query: Record<string, string> } | null {
    const [path = '', search = ''] = endpoint.split('?', 2);
    if (!/^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(path)) return null;
    return { path, query: Object.fromEntries(new URLSearchParams(search)) };
}

/** Reads a block's first page from its route (the server's: a GET it serves). */
export async function readBlock<T>(api: UnaApi, endpoint: string): Promise<T> {
    const route = blockRoute(endpoint);
    if (!route) throw new Error('This block has no route the app can read');
    // openapi-fetch puts the path after the API's base as it is; it is one of the API's own GETs
    const get = api.GET as unknown as (path: string, init: { params: { query: Record<string, string> } }) => Promise<{ data?: T; error?: unknown; response: Response }>;
    return unwrap(await get(route.path, { params: { query: route.query } }));
}

/** The page a section shows, for the desktop app, kept like the site's other settings (10 minutes). Null path: none. */
export function usePageLayout(path: string | null) {
    const { api } = useApp();
    return useQuery({
        queryKey: pageLayoutKey(path ?? ''),
        queryFn: async (): Promise<ResolvedPage> => unwrap(await api.GET('/layout/resolve', { params: { query: { path: path ?? '/', platform: 'desktop-app' } } })),
        enabled: path !== null,
        staleTime: 10 * 60_000,
        // an older site without the route, or a page it doesn't have: the section without blocks
        retry: false,
    });
}

/**
 * An element's width as it changes (ResizeObserver); null until measured, and where nothing
 * measures. The ref is a pane body's (usePaneBody), a new object when its element changes.
 * Measured before the first paint (a layout effect), so a page that lays out by it (its side
 * column, a task's properties or chips) never shows a frame of the other layout.
 */
export function useWidth(ref: RefObject<HTMLElement | null>): number | null {
    const [width, setWidth] = useState<number | null>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const measure = () => setWidth(el.clientWidth || null);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return width;
}
