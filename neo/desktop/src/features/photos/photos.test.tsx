/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { feedRoute, parseRoute, type Route, RouteHistory, routeToPath } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { type Picked, type Staging, type Uploader } from '../../lib/uploads';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from '../groups/group-view';
import { mediaTabs } from '../media/media-browse';
import { navigationEntries } from '../palette/commands';
import { AlbumPane } from './album-pane';
import { NewAlbum, NewPhotos } from './new-media';
import { PhotoGrid } from './photo-grid';
import { attachmentsReducer } from '../compose/attachments';
import { addedText, type Album, albumCardText, gridMove, itemsText, type Photo, photoListKey, photoSiblings, tileName, tileSrc, viewerLabel } from './photos';

vi.mock('../../lib/native', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../lib/native')>()), confirmAction: vi.fn(async () => true) }));

type Media = Schema<'Media'>;
const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric Novak', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Top contributor', color: null, icon: null }] };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const MODULES: Schema<'ModuleInfo'>[] = [
    { module: 'bx_videos', tag: 'videos', title: 'Videos', kind: 'video' },
    { module: 'bx_photos', tag: 'photos', title: 'Photos', kind: 'photo' },
    { module: 'bx_albums', tag: 'albums', title: 'Albums', kind: 'album' },
];
const allowAll = (url: string | null | undefined) => url ?? null;

function media(id: string, over: Partial<Media> = {}): Media {
    return {
        id,
        kind: 'image',
        mime: 'image/jpeg',
        size: 0,
        state: 'ready',
        original_name: '',
        url: `https://community.example/s/large-${id}.jpg`,
        download_url: `https://community.example/s/large-${id}.jpg`,
        variants: {
            thumb: { url: `https://community.example/s/thumb-${id}.jpg`, width: 300, height: 200 },
            medium: { url: `https://community.example/s/medium-${id}.jpg`, width: 500, height: 333 },
            large: { url: `https://community.example/s/large-${id}.jpg`, width: 1200, height: 800 },
        },
        width: 1200,
        height: 800,
        duration_ms: null,
        ...over,
    };
}

function photo(id: string, title: string, over: Partial<Photo> = {}): Photo {
    return {
        id,
        kind: 'photo',
        module: 'bx_photos',
        title,
        excerpt: '',
        text_html: null,
        media: media(`m${id}`),
        embed_url: null,
        embed_player_url: null,
        album_id: null,
        author: eric,
        audience: 'public',
        context_id: null,
        state: 'published',
        moderation: 'approved',
        links: [],
        comments_enabled: true,
        featured: false,
        stats: { comments: 0, reactions: 0, views: 12 },
        content_id: null,
        url: `https://community.example/view-photo/${id}`,
        viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false },
        published_at: '2026-11-04T16:35:32Z',
        created_at: '2026-11-04T16:35:32Z',
        updated_at: '2026-11-04T16:35:32Z',
        ...over,
    };
}

function album(id: string, title: string, over: Partial<Album> = {}): Album {
    return {
        id,
        module: 'bx_albums',
        title,
        excerpt: '',
        text_html: null,
        preview: [media('a1'), media('a2')],
        author: eric,
        audience: 'public',
        context_id: null,
        state: 'published',
        moderation: 'approved',
        links: [],
        comments_enabled: true,
        featured: false,
        stats: { items: 3, comments: 0, reactions: 0, views: 4 },
        content_id: null,
        url: `https://community.example/view-album/${id}`,
        viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: true, can_delete: true },
        published_at: '2026-11-04T16:35:32Z',
        created_at: '2026-11-04T16:35:32Z',
        updated_at: '2026-11-04T16:35:32Z',
        ...over,
    };
}

describe('what photos and albums show', () => {
    it('moves through a grid by rows and columns, to its ends, never past them', () => {
        // 7 tiles, 3 a row: 0 1 2 / 3 4 5 / 6
        expect([gridMove('ArrowRight', 0, 7, 3), gridMove('ArrowLeft', 0, 7, 3), gridMove('ArrowDown', 1, 7, 3), gridMove('ArrowUp', 4, 7, 3)]).toEqual([1, 0, 4, 1]);
        // down from the middle row's end, with nothing under it: the last tile; from the last row: stays
        expect([gridMove('ArrowDown', 5, 7, 3), gridMove('ArrowDown', 6, 7, 3)]).toEqual([6, 6]);
        expect([gridMove('Home', 4, 7, 3), gridMove('End', 3, 7, 3), gridMove('Home', 4, 7, 3, { toEnds: true }), gridMove('End', 1, 7, 3, { toEnds: true })]).toEqual([3, 5, 0, 6]);
        // right to left: the arrows follow the reading direction
        expect(gridMove('ArrowRight', 1, 7, 3, { rtl: true })).toBe(0);
        expect(gridMove('a', 1, 7, 3)).toBeNull();
    });

    it('names tiles by their titles, else their place, with who added them when not the list’s owner', () => {
        expect(tileName(photo('1', 'Ridge at dawn'), 0, 12)).toBe('Ridge at dawn, by Eric Novak');
        expect(tileName(photo('1', 'Ridge at dawn'), 0, 12, '6')).toBe('Ridge at dawn');
        expect(tileName(photo('1', '  '), 2, 12, '6')).toBe('Photo 3 of 12');
        expect(tileName(photo('1', '', { kind: 'video' }), 0, null, '6')).toBe('Video 1');
        expect([itemsText(1), itemsText(12)]).toEqual(['1 photo', '12 photos']);
        expect(albumCardText(album('5', 'Ridge walk', { audience: 'members' }))).toBe(', 3 photos, by Eric Novak, members only');
        // a tile shows the small copy, never the upload
        expect(tileSrc(media('x'), allowAll)).toBe('https://community.example/s/thumb-x.jpg');
    });

    it('names the viewer’s photos by the list they came from', () => {
        const p = photo('1', 'Ridge', { context_id: '70' });
        expect(viewerLabel({ all: true }, p)).toBe('the network’s photos, newest first');
        expect(viewerLabel({ author: '6' }, p)).toBe('Eric Novak’s photos');
        expect(viewerLabel({ author: '4' }, p)).toBe('their photos');
        expect(viewerLabel({ context: '70' }, p, 'Makers club')).toBe('photos in Makers club');
        expect(viewerLabel(null, p)).toBe('Ridge');
        expect(viewerLabel(null, photo('2', ''))).toBe('the photo');
        expect(viewerLabel({ search: 'lily' }, p)).toBe('photos matching “lily”');
        expect([addedText(3, 8), addedText(1, 2), addedText(0, 2)]).toEqual(['3 of 8 photos were added.', '1 of 2 photos was added.', 'No photos were added.']);
    });

    it('steps through the list a photo is in before a search’s results that hold it', () => {
        const client = new QueryClient();
        const pages = (...items: Photo[]) => ({ pages: [{ items, next_cursor: null }], pageParams: [undefined] });
        // the search came first (an earlier one, or one restored from the last session)
        client.setQueryData(['photos', 'list', 'search', 'lily'], pages(photo('3', 'Lily'), photo('9', 'Lily pond'), photo('8', 'Water lily')));
        client.setQueryData(photoListKey({ all: true }), pages(photo('1', 'Ridge'), photo('3', 'Lily')));
        const fromGrid = photoSiblings(client, '3');
        expect(fromGrid.photos.map((x) => x.id)).toEqual(['1', '3']);
        expect(fromGrid.of).toEqual({ all: true });
        // only the search holds this one: its results, called by what was searched
        const fromSearch = photoSiblings(client, '9');
        expect(fromSearch.photos.map((x) => x.id)).toEqual(['3', '9', '8']);
        expect(fromSearch.of).toEqual({ search: 'lily' });
        expect(viewerLabel(fromSearch.of, photo('9', 'Lily pond'))).toBe('photos matching “lily”');
        expect(photoSiblings(client, '77')).toEqual({ photos: [], of: null });
    });

    it('lets a tray take as many as its request does', () => {
        const one = (key: string) => ({ key, name: key, kind: 'image' as const, size: 1, status: 'uploading' as const, sent: 0, total: 1 });
        const many = Array.from({ length: 30 }, (_, i) => one(`k${i}`));
        expect(attachmentsReducer([], { type: 'add', items: many })).toHaveLength(20);
        expect(attachmentsReducer([], { type: 'add', items: many, max: 50 })).toHaveLength(30);
    });
});

describe('photo and album routes', () => {
    it('opens a photo and an album beside Media, in windows of their own too, and the forms in place', () => {
        const route: Route = { list: { section: 'media', feed: 'photos' }, detail: { kind: 'photo', id: '42' } };
        expect(routeToPath(route)).toBe('/media/photo/42?feed=photos');
        expect(parseRoute('/media/photo/42?feed=photos')).toEqual(route);
        expect(parseRoute('/media/album/18?feed=albums')).toEqual({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'album', id: '18' } });
        expect(parseRoute('/media/new-photos')).toEqual({ list: { section: 'media' }, detail: { kind: 'new-photos' } });
        expect(parseRoute('/groups/new-album/67?group=67')).toEqual({ list: { section: 'groups', group: '67' }, detail: { kind: 'new-album', contextId: '67' } });
        expect(parseRoute('/media/photo/x')).toBeNull();
        expect(parseRoute('/media/album/18/items')).toBeNull();
        expect(parseRoute('/groups?group=67&tab=albums')).toEqual({ list: { section: 'groups', group: '67', groupTab: 'albums' }, detail: null });
        expect(parseRoute('/profile?id=8&tab=photos')).toEqual({ list: { section: 'profile', profile: '8', profileTab: 'photos' }, detail: null });
        expect(routeToPath({ list: feedRoute('media', 'albums'), detail: null })).toBe('/media?feed=albums');
        expect([opensInWindow({ kind: 'photo', id: '42' }), opensInWindow({ kind: 'album', id: '18' }), opensInWindow({ kind: 'new-album' })]).toEqual([true, true, false]);
    });

    it('gives contexts Photos and Albums tabs where the site lets them in, Media the tabs the site has, and the palette its places', () => {
        expect(contextTabs({ content_visible: true, content_kinds: ['albums', 'photos', 'videos'] }, 'group')).toEqual(['posts', 'videos', 'photos', 'albums', 'members', 'about']);
        expect(mediaTabs(['photos', 'albums'])).toEqual(['photos', 'albums']);
        expect(mediaTabs(null)).toEqual(['videos', 'photos', 'albums', 'files']);
        expect(mediaTabs([])).toEqual([]);
        const entries = navigationEntries(() => undefined, { photos: true, albums: true });
        // without Videos, Photos is Media's first tab
        expect(entries.find((e) => e.label === 'Media: Photos')?.action).toEqual({ kind: 'list', list: { section: 'media' } });
        expect(entries.find((e) => e.label === 'Media: Albums')?.action).toEqual({ kind: 'list', list: { section: 'media', feed: 'albums' } });
        expect(navigationEntries(() => undefined).some((e) => e.label === 'Media: Photos')).toBe(false);
    });
});

type Call = { method: string; path: string; query: string; body: string };

type Held = { status: number; body?: unknown } | 'lost';

/** An answer the test gives when it chooses: until then the request is on its way. */
function later() {
    let give: (answer: Held) => void = () => {};
    const answer = new Promise<Held>((resolve) => (give = resolve));
    return { answer, give };
}

/** A pick whose files are made ready when the test says so. */
function slowPick() {
    let ready: (staging: Staging) => void = () => {};
    return { pick: () => new Promise<Staging>((resolve) => (ready = resolve)), ready: (files: Picked[]) => ready({ files, refused: [] }) };
}

/** The first request of this kind is answered by `first`; the site answers the ones after it. */
const firstOf = (request: string, first: Promise<Held>) => {
    let asked = 0;
    return (c: Call) => (`${c.method} ${c.path}` === request && !asked++ ? first : null);
};

function site({ modules = MODULES, albumVideo = false, created, over }: { modules?: Schema<'ModuleInfo'>[]; albumVideo?: boolean; created?: Photo[]; over?: (c: Call) => Promise<Held> | null } = {}) {
    const photos: Photo[] = [photo('1', 'Ridge at dawn', { viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: true, can_delete: true } }), photo('2', 'Tram stop'), photo('3', '')];
    const albums: Album[] = [album('18', 'Ridge walk weekend'), album('19', 'Empty one', { preview: [], stats: { items: 0, comments: 0, reactions: 0, views: 0 } })];
    const video = media('v', { kind: 'video', mime: 'video/mp4', url: 'https://community.example/s/v.mp4', variants: { mp4: { url: 'https://community.example/s/v.mp4', width: 0, height: 0 }, poster: { url: 'https://community.example/s/v.jpg', width: 0, height: 0 } } });
    const items: Photo[] = [
        photo('101', 'Pier', { module: 'bx_albums', album_id: '18' }),
        albumVideo ? photo('102', '', { module: 'bx_albums', album_id: '18', kind: 'video', media: video }) : photo('102', '', { module: 'bx_albums', album_id: '18' }),
        photo('103', 'Boats', { module: 'bx_albums', album_id: '18' }),
    ];
    const calls: Call[] = [];
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules } };
        if (c.path === '/photos' && c.method === 'GET') return { status: 200, body: { items: photos, next_cursor: null } };
        if (c.path === '/photos' && c.method === 'POST') return { status: 201, body: created ?? [photos[0], photos[1]] };
        const p = /^\/photos\/(\d+)$/.exec(c.path);
        if (p?.[1]) {
            const found = photos.find((x) => x.id === p[1]);
            if (!found) return { status: 404, body: { type: 'urn:una:problem:not_found', title: 'Not found', status: 404, code: 'not_found' } };
            return { status: 200, body: { ...found, text_html: `<p>About ${found.title}</p>` } };
        }
        if (c.path === '/albums' && c.method === 'GET') return { status: 200, body: { items: albums, next_cursor: null } };
        if (c.path === '/albums' && c.method === 'POST') return { status: 201, body: albums[0] };
        if (c.path === '/albums/18') return { status: 200, body: albums[0] };
        if (c.path === '/albums/18/items' && c.method === 'GET') return { status: 200, body: { items, next_cursor: null } };
        if (c.path === '/albums/18/items' && c.method === 'POST') return { status: 201, body: [items[0]] };
        if (c.path === '/me/groups' || c.path === '/me/spaces') return { status: 200, body: [] };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text() };
            calls.push(c);
            const held = await over?.(c);
            if (held === 'lost') throw new TypeError('Load failed');
            const a = held ?? answer(c);
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls };
}

const nav: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'media', label: 'Media', icon: 'film' },
];

function Harness({ history, api, children }: { history: RouteHistory; api: UnaApi; children?: ReactNode }) {
    const commands = useRef<CommandHandler | null>(null);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>{children ?? <Shell siteUrl="https://community.example" items={nav} profile={lily} commands={commands} />}</RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, children?: ReactNode) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api}>
                {children}
            </Harness>
        </QueryClientProvider>,
    );
    return { history, client };
}

const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 1200 : 800;
                return 0;
            },
        });
    }
    // jsdom has no modal dialogs
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    };
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
});
afterEach(() => {
    cleanup();
    localStorage.clear();
    setSiteModules(null);
});

describe('the photo grid', () => {
    it('is one tab stop the arrow keys move through, and opens a tile with Enter or a click', () => {
        const opened: number[] = [];
        const windows: number[] = [];
        render(<PhotoGrid items={[photo('1', 'One'), photo('2', 'Two'), photo('3', 'Three')]} label="Photos" ownerId="6" onOpen={(i) => opened.push(i)} onOpenWindow={(i) => windows.push(i)} />);
        const tiles = within(screen.getByRole('list', { name: 'Photos' })).getAllByRole('button');
        expect(tiles.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
        tiles[0]!.focus();
        // one column where the grid's columns can't be read (jsdom): down goes to the next one
        fireEvent.keyDown(tiles[0]!, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(tiles[1]);
        expect(tiles.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
        fireEvent.keyDown(tiles[1]!, { key: 'End', metaKey: true, ctrlKey: true });
        expect(document.activeElement).toBe(tiles[2]);
        fireEvent.click(tiles[2]!);
        expect(opened).toEqual([2]);
        fireEvent.doubleClick(tiles[0]!);
        expect(windows).toEqual([0]);
    });

    it('starts its tab stop on the open tile, which alone has the check mark, and follows what a click opens', () => {
        const items = [photo('1', 'One'), photo('2', 'Two'), photo('3', 'Three')];
        const { rerender } = render(<PhotoGrid items={items} label="Photos" ownerId="6" selectedId="3" onOpen={() => undefined} />);
        const tiles = () => within(screen.getByRole('list', { name: 'Photos' })).getAllByRole('button');
        expect(tiles().map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
        expect(tiles().map((t) => !!t.querySelector('.photo-tile-check'))).toEqual([false, false, true]);
        expect(tiles()[2]!.getAttribute('aria-current')).toBe('true');
        // a click (which focuses no button in WebKit) moves the tab stop with the open one
        fireEvent.click(tiles()[1]!);
        rerender(<PhotoGrid items={items} label="Photos" ownerId="6" selectedId="2" onOpen={() => undefined} />);
        expect(tiles().map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    });

    it('draws the open tile as a shape of its own: never the outset outline focus is', () => {
        // the stylesheet as written (vitest hands CSS imports over empty)
        const file = ['src/styles.css', 'desktop/src/styles.css'].find((f) => existsSync(f)) ?? 'src/styles.css';
        const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]! }));
        const open = rules.filter((r) => r.selector.includes('photo-tile[aria-current'));
        expect(open.length).toBeGreaterThan(0);
        for (const r of open) {
            expect(r.body).not.toMatch(/(^|[;\s])outline\s*:/);
            // a ring inside the tile (inset), not one around it where focus's outline goes
            if (/box-shadow/.test(r.body)) expect(r.body).toMatch(/box-shadow:\s*inset\b/);
        }
        // focus keeps its outline outside the tile
        expect(rules.find((r) => r.selector === '.photo-tile:focus-visible')?.body).toMatch(/outline-offset:\s*2px/);
    });
});

describe('photos and albums in the window', () => {
    it('lists the photos under Media’s Photos tab as a grid, and opens one beside it with its picture, full size in the viewer', async () => {
        const { api } = site();
        const { history } = renderApp({ list: { section: 'media', feed: 'photos' }, detail: null }, api);
        const grid = await screen.findByRole('list', { name: 'Photos, newest first' });
        expect(screen.getByRole('tab', { name: 'Photos' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByRole('button', { name: 'Add photos' })).toBeTruthy();
        const tiles = within(grid).getAllByRole('button');
        expect(tiles.map((t) => t.getAttribute('aria-label'))).toEqual(['Ridge at dawn, by Eric Novak', 'Tram stop, by Eric Novak', 'Photo 3, by Eric Novak']);
        expect(tiles[0]!.querySelector('img')?.getAttribute('src')).toBe('https://community.example/s/thumb-m1.jpg');

        fireEvent.click(tiles[0]!);
        expect(routeToPath(history.current)).toBe('/media/photo/1?feed=photos');
        expect(await screen.findByText('About Ridge at dawn')).toBeTruthy();
        expect(tiles[0]!.getAttribute('aria-current')).toBe('true');

        // the viewer goes through the grid's photos; Esc closes it, focus back on the picture
        const picture = screen.getByRole('button', { name: 'View “Ridge at dawn” full size' });
        picture.focus();
        fireEvent.click(picture);
        const dialog = await screen.findByRole('dialog');
        // named by its title and the list it came from (the network's, not the opened one's author)
        expect(dialog.getAttribute('aria-label')).toBe('Photo 1 of 3: Ridge at dawn, the network’s photos, newest first');
        expect(dialog.querySelector('img')?.getAttribute('alt')).toBe('Ridge at dawn');
        fireEvent.keyDown(dialog, { key: 'ArrowRight' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 2 of 3: Tram stop, the network’s photos, newest first');
        expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://community.example/s/large-m2.jpg');
        fireEvent.keyDown(dialog, { key: 'End' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 3 of 3, the network’s photos, newest first');
        expect(dialog.querySelector('img')?.getAttribute('alt')).toBe('Photo 3 of 3');
        act(() => (dialog as HTMLDialogElement).close());
        await waitFor(() => expect(document.activeElement).toBe(picture));
    });

    it('shows the albums as cards, and an album beside them with its photos in the viewer', async () => {
        const { api } = site();
        const { history } = renderApp({ list: { section: 'media', feed: 'albums' }, detail: null }, api);
        const cards = await screen.findByRole('list', { name: 'Albums, newest first' });
        const title = within(cards).getByRole('button', { name: 'Ridge walk weekend, 3 photos, by Eric Novak' });
        expect(within(title.closest('li')!).getByText('Top contributor')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'New album' })).toBeTruthy();
        fireEvent.click(title);
        expect(routeToPath(history.current)).toBe('/media/album/18?feed=albums');
        const grid = await screen.findByRole('list', { name: 'Photos in Ridge walk weekend, in the album’s order' });
        const tiles = within(grid).getAllByRole('button');
        expect(tiles.map((t) => t.getAttribute('aria-label'))).toEqual(['Pier', 'Photo 2 of 3', 'Boats']);
        fireEvent.click(tiles[2]!);
        const dialog = await screen.findByRole('dialog');
        expect(dialog.getAttribute('aria-label')).toBe('Photo 3 of 3: Boats, Ridge walk weekend');
        fireEvent.keyDown(dialog, { key: 'Home' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 1 of 3: Pier, Ridge walk weekend');
    });

    it('plays a video an album has in the viewer, never as a picture', async () => {
        const { api } = site({ albumVideo: true });
        renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'album', id: '18' } }, api);
        const grid = await screen.findByRole('list', { name: 'Photos in Ridge walk weekend, in the album’s order' });
        const tiles = within(grid).getAllByRole('button');
        expect(tiles[1]!.getAttribute('aria-label')).toBe('Video 2 of 3');
        fireEvent.click(tiles[1]!);
        const dialog = await screen.findByRole('dialog');
        expect(dialog.getAttribute('aria-label')).toBe('Video 2 of 3, Ridge walk weekend');
        expect(dialog.querySelector('img')).toBeNull();
        expect(dialog.querySelector('video')?.getAttribute('src')).toBe('https://community.example/s/v.mp4');
    });

    it('says when a photo is gone', async () => {
        const { api } = site();
        renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'photo', id: '77' } }, api);
        expect(await screen.findByText('This photo is gone')).toBeTruthy();
    });
});

/** Uploads that finish when the test says so. */
function fakeUploader(names: string[]) {
    const pending = new Map<string, { resolve: (m: Media) => void; purpose?: string }>();
    const base: Uploader = {
        pick: async () => ({ files: names.map((n): Picked => ({ handle: `h-${n}`, name: n, size: 2000, mime: 'image/jpeg', kind: 'image' })), refused: [] }),
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths: async () => ({ files: [], refused: [] }),
        upload: (file: Picked, _progress, purpose) => new Promise<Media>((resolve) => void pending.set(file.handle ?? file.name, { resolve, purpose })),
        cancel: () => undefined,
        release: () => undefined,
    };
    return { base, pending };
}

describe('adding photos and albums', () => {
    it('uploads picked photos with the photo purpose and adds them, then opens the first', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader(['Harbour.jpg', 'Pier.jpg']);
        const { history } = renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'new-photos' } }, api, <NewPhotos uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose photos…' }));
        await waitFor(() => expect(pending.size).toBe(2));
        expect([...pending.values()].map((p) => p.purpose)).toEqual(['photo', 'photo']);
        // not before the uploads are done
        fireEvent.click(screen.getByRole('button', { name: 'Add photos' }));
        expect(await screen.findByText('Wait until the uploads are done')).toBeTruthy();
        await act(async () => {
            pending.get('h-Harbour.jpg')?.resolve(media('91'));
            pending.get('h-Pier.jpg')?.resolve(media('92'));
        });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'By the sea' } });
        fireEvent.change(screen.getByLabelText('Who can see them'), { target: { value: 'members' } });
        fireEvent.click(await screen.findByRole('button', { name: 'Add 2 photos' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/photos')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/photos')!.body)).toEqual({ media_ids: ['91', '92'], text_html: '<p>By the sea</p>', audience: 'members' });
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'photo', id: '1' }));
        // the site took them: nothing is deleted when the form goes
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    });

    it('makes an album that needs a title, with its photos, and opens it', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader(['One.jpg']);
        const { history } = renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'new-album' } }, api, <NewAlbum uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Make album' }));
        expect(await screen.findByText('Give the album a title.')).toBeTruthy();
        expect(calls.some((c) => c.method === 'POST' && c.path === '/albums')).toBe(false);
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ridge walk weekend' } });
        fireEvent.click(screen.getByRole('button', { name: 'Choose photos…' }));
        await waitFor(() => expect(pending.get('h-One.jpg')?.purpose).toBe('album'));
        await act(async () => pending.get('h-One.jpg')?.resolve(media('95')));
        fireEvent.click(screen.getByRole('button', { name: 'Make album' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/albums')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/albums')!.body)).toEqual({ title: 'Ridge walk weekend', media_ids: ['95'], audience: 'public' });
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'album', id: '18' }));
    });

    it('adds photos to an album at its end and says so', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader(['Sunset.jpg']);
        renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'album', id: '18' } }, api, <AlbumPane id="18" uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Add Photos' }));
        const panel = screen.getByRole('region', { name: 'Add photos to Ridge walk weekend' });
        fireEvent.click(within(panel).getByRole('button', { name: 'Choose photos…' }));
        await waitFor(() => expect(pending.get('h-Sunset.jpg')?.purpose).toBe('album'));
        await act(async () => pending.get('h-Sunset.jpg')?.resolve(media('96')));
        fireEvent.click(within(panel).getByRole('button', { name: 'Add to album' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/albums/18/items')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/albums/18/items')!.body)).toEqual({ media_ids: ['96'] });
        expect(await screen.findByText('A photo was added to the album')).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'Add photos to Ridge walk weekend' })).toBeNull();
    });

    it('moves focus into the Add photos panel when its button goes', async () => {
        const { api } = site();
        renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'album', id: '18' } }, api, <AlbumPane id="18" uploader={fakeUploader([]).base} />);
        const button = await screen.findByRole('button', { name: 'Add Photos' });
        button.focus();
        fireEvent.click(button);
        const panel = screen.getByRole('region', { name: 'Add photos to Ridge walk weekend' });
        await waitFor(() => expect(document.activeElement).toBe(within(panel).getByRole('button', { name: 'Choose photos…' })));
    });

    it('keeps the photos the site did not take, and says how many it added', async () => {
        const { api, calls } = site({ created: [photo('1', 'Harbour', { media: media('91') })] });
        const { base, pending } = fakeUploader(['Harbour.jpg', 'Pier.jpg']);
        const { history } = renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'new-photos' } }, api, <NewPhotos uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose photos…' }));
        await waitFor(() => expect(pending.size).toBe(2));
        await act(async () => {
            pending.get('h-Harbour.jpg')?.resolve(media('91'));
            pending.get('h-Pier.jpg')?.resolve(media('92'));
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Add 2 photos' }));
        expect((await screen.findByRole('alert')).textContent).toMatch(/^1 of 2 photos was added\. The site took no more; the one left is still here/);
        // still the form, with the one left in its tray and on the site (nothing deleted)
        expect(history.current.detail).toEqual({ kind: 'new-photos' });
        expect(screen.getByRole('button', { name: 'Add photos' })).toBeTruthy();
        expect(screen.getByText('Pier.jpg')).toBeTruthy();
        expect(screen.queryByText('Harbour.jpg')).toBeNull();
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    });

    it('offers only the audiences the site has turned on', async () => {
        const modules = MODULES.map((m) => (m.tag === 'photos' ? { ...m, audiences: ['public', 'friends', 'private'] as ('public' | 'friends' | 'private')[] } : m));
        const { api } = site({ modules });
        renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'new-photos' } }, api, <NewPhotos uploader={fakeUploader([]).base} />);
        const select = await screen.findByLabelText('Who can see them');
        await waitFor(() => expect([...select.querySelectorAll('option')].map((o) => o.value)).toEqual(['public', 'friends', 'private']));
    });

    const picked = (name: string): Picked => ({ handle: `h-${name}`, name, size: 2000, mime: 'image/jpeg', kind: 'image' });
    const sentTo = (calls: Call[], path: string) => calls.filter((c) => c.method === 'POST' && c.path === path);

    it('holds Add while a photo is being made ready, and adds them all once it is uploaded', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader(['Harbour.jpg']);
        const slow = slowPick();
        const picks = [base.pick, slow.pick];
        const { history } = renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'new-photos' } }, api, <NewPhotos uploader={{ ...base, pick: (o) => picks.shift()!(o) }} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose photos…' }));
        await waitFor(() => expect(pending.size).toBe(1));
        await act(async () => pending.get('h-Harbour.jpg')?.resolve(media('91')));
        const more = await screen.findByRole('button', { name: 'Add more photos…' });
        fireEvent.click(more);
        // chosen, and not in the form yet: sent now, the photos would go without it
        const add = screen.getByRole('button', { name: 'Add photos' });
        fireEvent.click(add);
        expect((await screen.findByRole('alert')).textContent).toBe('Wait until the uploads are done');
        expect(document.activeElement).toBe(more);
        expect(add.hasAttribute('disabled')).toBe(false);
        fireEvent.keyDown(screen.getByLabelText('Title'), { key: 'Enter', metaKey: true, ctrlKey: true });
        await act(async () => {});
        expect(sentTo(calls, '/photos')).toHaveLength(0);
        await act(async () => slow.ready([picked('Pier.jpg')]));
        await waitFor(() => expect(pending.size).toBe(2));
        await act(async () => pending.get('h-Pier.jpg')?.resolve(media('92')));
        fireEvent.click(await screen.findByRole('button', { name: 'Add 2 photos' }));
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'photo', id: '1' }));
        expect(sentTo(calls, '/photos').map((c) => JSON.parse(c.body))).toEqual([{ media_ids: ['91', '92'], audience: 'public' }]);
    });

    it('takes no change while photos are being added, and takes them again with what it held when they were not', async () => {
        const first = later();
        const { api, calls } = site({ over: firstOf('POST /photos', first.answer) });
        const { base, pending } = fakeUploader(['Harbour.jpg']);
        const { history } = renderApp({ list: { section: 'media', feed: 'photos' }, detail: { kind: 'new-photos' } }, api, <NewPhotos uploader={base} />);
        const choose = await screen.findByRole('button', { name: 'Choose photos…' });
        fireEvent.click(choose);
        await waitFor(() => expect(pending.size).toBe(1));
        await act(async () => pending.get('h-Harbour.jpg')?.resolve(media('91')));
        const title = screen.getByLabelText('Title') as HTMLInputElement;
        const text = screen.getByLabelText('Description') as HTMLTextAreaElement;
        const who = screen.getByLabelText('Who can see them') as HTMLSelectElement;
        fireEvent.change(title, { target: { value: 'Harbour' } });
        fireEvent.change(text, { target: { value: 'By the sea' } });
        await waitFor(() => expect(who.value).toBe('public'));
        const add = screen.getByRole('button', { name: 'Add photos' });
        const remove = screen.getByRole('button', { name: 'Remove Photo Harbour.jpg' });
        fireEvent.click(add);
        await waitFor(() => expect(add.getAttribute('aria-busy')).toBe('true'));
        expect(title.readOnly).toBe(true);
        expect(text.readOnly).toBe(true);
        expect(who.getAttribute('aria-disabled')).toBe('true');
        expect(who.disabled).toBe(false);
        expect(choose.getAttribute('aria-disabled')).toBe('true');
        expect(remove.getAttribute('aria-disabled')).toBe('true');
        fireEvent.change(title, { target: { value: 'Typed while it was sent' } });
        fireEvent.change(text, { target: { value: 'Typed while it was sent' } });
        fireEvent.change(who, { target: { value: 'members' } });
        fireEvent.click(remove);
        fireEvent.click(choose);
        fireEvent.click(add);
        await act(async () => {});
        expect(title.value).toBe('Harbour');
        expect(text.value).toBe('By the sea');
        expect(who.value).toBe('public');
        expect(screen.getByText('Harbour.jpg')).toBeTruthy();
        expect(pending.size).toBe(1);
        expect(sentTo(calls, '/photos')).toHaveLength(1);
        // they were not added: the form stays, with what it held, and takes changes again
        first.give('lost');
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The photos were not added: Load failed'));
        expect(add.getAttribute('aria-busy')).toBeNull();
        expect(title.readOnly).toBe(false);
        expect(text.readOnly).toBe(false);
        expect(who.getAttribute('aria-disabled')).toBeNull();
        expect(choose.getAttribute('aria-disabled')).toBeNull();
        expect(title.value).toBe('Harbour');
        expect(screen.getByText('Harbour.jpg')).toBeTruthy();
        fireEvent.click(add);
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'photo', id: '1' }));
        const body = { media_ids: ['91'], title: 'Harbour', text_html: '<p>By the sea</p>', audience: 'public' };
        expect(sentTo(calls, '/photos').map((c) => JSON.parse(c.body))).toEqual([body, body]);
    });

    it('holds Make album while a photo is being made ready, and takes no change while the album is being made', async () => {
        const first = later();
        const { api, calls } = site({ over: firstOf('POST /albums', first.answer) });
        const { base, pending } = fakeUploader([]);
        const slow = slowPick();
        const { history } = renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'new-album' } }, api, <NewAlbum uploader={{ ...base, pick: slow.pick }} />);
        const title = (await screen.findByLabelText('Title')) as HTMLInputElement;
        const text = screen.getByLabelText('Description') as HTMLTextAreaElement;
        const who = screen.getByLabelText('Who can see it') as HTMLSelectElement;
        fireEvent.change(title, { target: { value: 'Ridge walk weekend' } });
        await waitFor(() => expect(who.value).toBe('public'));
        const choose = screen.getByRole('button', { name: 'Choose photos…' });
        fireEvent.click(choose);
        // chosen, and not in the form yet: made now, the album would be without it
        const make = screen.getByRole('button', { name: 'Make album' });
        fireEvent.click(make);
        expect((await screen.findByRole('alert')).textContent).toBe('Wait until the uploads are done');
        expect(document.activeElement).toBe(choose);
        fireEvent.keyDown(title, { key: 'Enter', metaKey: true, ctrlKey: true });
        await act(async () => {});
        expect(sentTo(calls, '/albums')).toHaveLength(0);
        await act(async () => slow.ready([picked('One.jpg')]));
        await waitFor(() => expect(pending.size).toBe(1));
        await act(async () => pending.get('h-One.jpg')?.resolve(media('95')));
        await screen.findByText(/^Ready/);
        fireEvent.click(make);
        await waitFor(() => expect(make.getAttribute('aria-busy')).toBe('true'));
        expect(title.readOnly).toBe(true);
        expect(text.readOnly).toBe(true);
        expect(who.getAttribute('aria-disabled')).toBe('true');
        expect(screen.getByRole('button', { name: 'Add more photos…' }).getAttribute('aria-disabled')).toBe('true');
        fireEvent.change(title, { target: { value: 'Typed while it was made' } });
        fireEvent.change(text, { target: { value: 'Typed while it was made' } });
        fireEvent.click(screen.getByRole('button', { name: 'Remove Photo One.jpg' }));
        fireEvent.click(make);
        await act(async () => {});
        expect(title.value).toBe('Ridge walk weekend');
        expect(text.value).toBe('');
        expect(screen.getByText('One.jpg')).toBeTruthy();
        // it was not made: the form takes changes again, and makes it with what it held
        first.give('lost');
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The album was not made: Load failed'));
        expect(title.readOnly).toBe(false);
        expect(who.getAttribute('aria-disabled')).toBeNull();
        fireEvent.click(make);
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'album', id: '18' }));
        const body = { title: 'Ridge walk weekend', media_ids: ['95'], audience: 'public' };
        expect(sentTo(calls, '/albums').map((c) => JSON.parse(c.body))).toEqual([body, body]);
    });

    it('holds Add to album while a photo is being made ready, takes none while they are added, and can add them again after an answer that never came', async () => {
        const first = later();
        const { api, calls } = site({ over: firstOf('POST /albums/18/items', first.answer) });
        const { base, pending } = fakeUploader([]);
        const slow = slowPick();
        renderApp({ list: { section: 'media', feed: 'albums' }, detail: { kind: 'album', id: '18' } }, api, <AlbumPane id="18" uploader={{ ...base, pick: slow.pick }} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Add Photos' }));
        const panel = screen.getByRole('region', { name: 'Add photos to Ridge walk weekend' });
        const choose = within(panel).getByRole('button', { name: 'Choose photos…' });
        const add = within(panel).getByRole('button', { name: 'Add to album' });
        fireEvent.click(choose);
        // chosen, and not in the panel yet
        fireEvent.click(add);
        expect((await within(panel).findByRole('alert')).textContent).toBe('Wait until the uploads are done');
        await act(async () => slow.ready([picked('Sunset.jpg')]));
        await waitFor(() => expect(pending.size).toBe(1));
        await act(async () => pending.get('h-Sunset.jpg')?.resolve(media('96')));
        await within(panel).findByText(/^Ready/);
        fireEvent.click(add);
        await waitFor(() => expect(add.getAttribute('aria-busy')).toBe('true'));
        expect(choose.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(within(panel).getByRole('button', { name: 'Remove Photo Sunset.jpg' }));
        fireEvent.click(add);
        await act(async () => {});
        expect(within(panel).getByText('Sunset.jpg')).toBeTruthy();
        expect(sentTo(calls, '/albums/18/items')).toHaveLength(1);
        // Cancel and Esc wait for the answer: closing would delete the upload the request names
        const cancel = within(panel).getByRole('button', { name: 'Cancel' });
        expect(cancel.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(cancel);
        fireEvent.keyDown(add, { key: 'Escape' });
        await act(async () => {});
        expect(screen.getByRole('region', { name: 'Add photos to Ridge walk weekend' })).toBe(panel);
        expect(calls.filter((c) => c.method === 'DELETE')).toHaveLength(0);
        // no answer came: the panel is as it was, and says why
        first.give('lost');
        await waitFor(() => expect(within(panel).getByRole('alert').textContent).toBe('The photos were not added: Load failed'));
        expect(add.getAttribute('aria-busy')).toBeNull();
        expect(choose.getAttribute('aria-disabled')).toBeNull();
        expect(cancel.getAttribute('aria-disabled')).toBeNull();
        fireEvent.click(add);
        expect(await screen.findByText('A photo was added to the album')).toBeTruthy();
        expect(sentTo(calls, '/albums/18/items').map((c) => JSON.parse(c.body))).toEqual([{ media_ids: ['96'] }, { media_ids: ['96'] }]);
    });
});
