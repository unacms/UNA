import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { type Route, RouteHistory, routeToPath, SEARCH_MODULE_TABS, type SearchModuleTab, searchRoute } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { MODULE_TAGS, moduleFoundText, moduleSearchKey, moduleTabName } from './module-results';
import { foundText, tabLabel } from './search-view';

type Profile = Schema<'Profile'>;
type Media = Schema<'Media'>;
type ModuleInfo = Schema<'ModuleInfo'>;

const lily: Profile = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const guild: Profile = { id: '725', kind: 'group', module: 'bx_spaces', display_name: 'Makers Guild', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

const WHEN = { published_at: '2026-11-04T16:35:32Z', created_at: '2026-11-04T16:35:32Z', updated_at: '2026-11-04T16:35:32Z' };
const NO_RIGHTS = { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false };

function media(id: string, over: Partial<Media> = {}): Media {
    return {
        id,
        kind: 'image',
        mime: 'image/jpeg',
        size: 1000,
        state: 'ready',
        original_name: `${id}.jpg`,
        url: `https://community.example/s/${id}.jpg`,
        download_url: `https://community.example/s/${id}.jpg`,
        variants: { thumb: { url: `https://community.example/s/thumb-${id}.jpg`, width: 300, height: 200 } },
        width: 1200,
        height: 800,
        duration_ms: null,
        ...over,
    };
}

/** A photo, video or file as its list sends it. */
function fileItem(id: string, kind: 'photo' | 'video' | 'file', title: string): Schema<'FileItem'> {
    return {
        id,
        kind,
        module: `bx_${kind}s`,
        title,
        excerpt: '',
        text_html: null,
        media: kind === 'video' ? media(`m${id}`, { kind: 'video', mime: 'video/mp4', duration_ms: 42_000 }) : kind === 'file' ? media(`m${id}`, { kind: 'file', mime: 'application/pdf', variants: {}, width: null, height: null }) : media(`m${id}`),
        embed_url: null,
        embed_player_url: null,
        album_id: null,
        author: lily,
        audience: 'public',
        context_id: null,
        state: 'published',
        moderation: 'approved',
        links: [],
        comments_enabled: true,
        featured: false,
        stats: { comments: 0, reactions: 0, views: 12 },
        content_id: null,
        url: `https://community.example/view-${kind}/${id}`,
        viewer: NO_RIGHTS,
        ...WHEN,
    };
}

const post = {
    id: '37',
    content_id: '7700',
    module: 'bx_posts',
    title: 'Lily’s slow walk with one lens',
    summary: 'Why the zoom stayed at home for a month.',
    body_html: null,
    author: lily,
    anonymous: false,
    context_id: null,
    audience: 'public',
    state: 'published',
    moderation: 'approved',
    category: { id: '3', slug: '3', name: 'Art' },
    cover: null,
    media: [],
    links: [],
    poll: null,
    reading_minutes: 2,
    comments_enabled: true,
    featured: false,
    stats: { comments: 2, reactions: 1, views: 40 },
    revision: 1,
    url: 'https://community.example/view-post/a-slow-walk',
    viewer: { ...NO_RIGHTS, can_react: true, can_comment: true },
    publish_at: null,
    ...WHEN,
} as Schema<'Post'>;

const album = {
    id: '21',
    module: 'bx_albums',
    title: 'Lily’s ridge trip',
    excerpt: '',
    text_html: null,
    preview: [media('a1'), media('a2')],
    author: lily,
    audience: 'public',
    context_id: null,
    state: 'published',
    moderation: 'approved',
    links: [],
    comments_enabled: true,
    featured: false,
    stats: { items: 3, comments: 0, reactions: 0, views: 4 },
    content_id: null,
    url: 'https://community.example/view-album/21',
    viewer: NO_RIGHTS,
    ...WHEN,
} as Schema<'Album'>;

const poll = {
    id: '2',
    content_id: '7630',
    module: 'bx_polls',
    question: 'Which night suits Lily’s workshop?',
    text_html: null,
    options: [
        { id: '5', title: 'Tuesday', votes: 1 },
        { id: '6', title: 'Thursday', votes: 3 },
    ],
    voters: 4,
    hidden_results: false,
    results_visible: true,
    image: null,
    author: lily,
    audience: 'public',
    context_id: null,
    state: 'published',
    moderation: 'approved',
    stats: { comments: 2, reactions: 1, views: 30 },
    url: 'https://community.example/view-poll/2',
    viewer: { voted: null, can_vote: true, can_delete: false },
    ...WHEN,
} as Schema<'Poll'>;

const task = {
    id: '91',
    module: 'bx_tasks',
    title: 'Print Lily’s posters',
    summary: '',
    body_html: null,
    context_id: '725',
    context: guild,
    list_id: null,
    list_title: 'Inbox',
    author: lily,
    assignees: [lily],
    due_at: null,
    completed: false,
    priority: null,
    state: { id: '2', title: 'Todo', done: false },
    type: null,
    estimate: null,
    labels: [],
    time_spent: 0,
    timer: null,
    audience: 'context',
    moderation: 'approved',
    stats: { comments: 0, reactions: 0, views: 1 },
    content_id: null,
    url: 'https://community.example/view-task/91',
    viewer: { can_edit: false, can_complete: true, can_track_time: true, can_delete: false, can_comment: false, can_react: false, reaction: null },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
} as Schema<'Task'>;

const video = fileItem('55', 'video', 'Lily at the lake');
const older = fileItem('54', 'video', 'Lily, an older clip');

/** Every content module with a search of its own, as GET /api/v2 lists them. */
const ALL: ModuleInfo[] = SEARCH_MODULE_TABS.map((kind) => ({ module: `bx_${MODULE_TAGS[kind]}`, tag: MODULE_TAGS[kind], title: MODULE_TAGS[kind], kind: 'entry' }));

const NOT_FOUND = { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' };

/** What each module's search finds for "lily"; `off`: paths that answer 404, `broken`: 500, `gaps`: two empty pages first. */
function fakeApi(calls: string[], { modules = ALL, off = [], broken = [], gaps = [] }: { modules?: ModuleInfo[]; off?: string[]; broken?: string[]; gaps?: string[] } = {}): UnaApi {
    const found: Record<string, unknown[]> = {
        '/search/posts': [post],
        '/search/photos': [fileItem('31', 'photo', 'Lily on the ridge'), fileItem('32', 'photo', 'Lily’s garden')],
        '/search/albums': [album],
        '/search/files': [fileItem('71', 'file', 'Lily’s agenda')],
        '/search/polls': [poll],
        '/search/tasks': [task],
    };
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const json = (status: number, body: unknown) =>
                new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
            if (off.includes(path)) return json(404, NOT_FOUND);
            if (broken.includes(path)) return json(500, { type: 'about:blank', title: 'The search is down', status: 500, code: 'internal' });
            const nothing = url.searchParams.get('q') === 'zzz';
            if (path === '/') return json(200, { name: 'Network', api_version: '2', modules });
            if (path === '/search/profiles') return json(200, nothing ? [] : [lily]);
            if (path === '/search/content') return json(200, { items: [], next_cursor: null });
            if (path === '/search/videos') {
                // two pages, by cursor
                if (nothing) return json(200, { items: [], next_cursor: null });
                return json(200, url.searchParams.get('cursor') === 'p2' ? { items: [older], next_cursor: null } : { items: [video], next_cursor: 'p2' });
            }
            // pages the viewer may see nothing of, before the one with the results
            if (gaps.includes(path) && url.searchParams.get('cursor') !== 'g3') return json(200, { items: [], next_cursor: url.searchParams.get('cursor') === 'g2' ? 'g3' : 'g2' });
            const items = found[path];
            if (items) return json(200, { items: nothing ? [] : items, next_cursor: null });
            if (path.startsWith('/search/') || path === '/navigation' || path === '/agents' || path === '/me/groups') return json(404, NOT_FOUND);
            return new Promise<Response>(() => {});
        },
    });
}

const nav: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'search', label: 'Search', command: 'go-search' },
];

function renderSearch(route: Route, site: Parameters<typeof fakeApi>[1] = {}, restore?: (client: QueryClient) => void) {
    const calls: string[] = [];
    const api = fakeApi(calls, site);
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    restore?.(client);
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
        return (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    <Shell siteUrl="https://community.example" items={nav} commands={commands} profile={lily} />
                </RouterProvider>
            </AppContext.Provider>
        );
    }
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { history, calls, client };
}

const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 600 : 800;
                return 0;
            },
        });
    }
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
});
afterEach(() => {
    cleanup();
    setSiteModules(null);
    vi.restoreAllMocks();
});

const tabs = () => within(screen.getByRole('tablist', { name: 'Results' }));
const tabNames = () =>
    tabs()
        .getAllByRole('tab')
        .map((tab) => tab.textContent);
const moduleCalls = (calls: string[]) => calls.filter((c) => /^GET \/search\/(posts|photos|albums|videos|files|polls|tasks)\b/.test(c));

describe('what the module tabs say', () => {
    it('names each tab, counts it and says what it found', () => {
        expect(SEARCH_MODULE_TABS.map(moduleTabName)).toEqual(['Posts', 'Photos', 'Albums', 'Videos', 'Files', 'Polls', 'Tasks']);
        expect(tabLabel('videos', undefined)).toBe('Videos');
        expect(tabLabel('videos', 24, true)).toBe('Videos 24+');
        // the feed's posts next to the Posts module's
        expect(tabLabel('posts', 3, false, 'Feed')).toBe('Feed 3');
        expect(foundText('files', 0)).toBe('No files found');
        expect(foundText('photos', 1)).toBe('1 photo found');
        expect(moduleFoundText('tasks', 50, true)).toBe('50 or more tasks found');
        expect(moduleFoundText('articles', 2, false)).toBe('2 posts found');
    });

    it('keeps a search among its module’s lists, where the detail finds and updates a row', () => {
        expect(moduleSearchKey('articles', 'lily')).toEqual(['posts', 'list', 'search', 'lily']);
        expect(moduleSearchKey('photos', 'lily')).toEqual(['photos', 'list', 'search', 'lily']);
        expect(moduleSearchKey('tasks', 'lily')).toEqual(['tasks', 'search', 'lily']);
    });
});

describe('Search’s module tabs', () => {
    it('has a tab for each module the site lists, and asks none of them until its tab is shown', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null });
        // the feed's tab is Feed next to the Posts module's Posts
        await waitFor(() => expect(tabNames()).toEqual(['People 1', 'Feed 0', 'Groups 0', 'Posts', 'Photos', 'Albums', 'Videos', 'Files', 'Polls', 'Tasks']));
        expect(moduleCalls(calls)).toEqual([]);
    });

    it('has none on a site that lists none of them', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null }, { modules: [] });
        await waitFor(() => expect(tabNames()).toEqual(['People 1', 'Posts 0', 'Groups 0']));
        expect(moduleCalls(calls)).toEqual([]);
    });

    it('says so when a link names the tab of a module the site has not', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily', 'photos'), detail: null }, { modules: ALL.filter((m) => m.tag !== 'photos') });
        // not before the site said which modules it has
        expect(screen.queryByText('This network has no photos.')).toBeNull();
        expect(await screen.findByText('This network has no photos.')).toBeTruthy();
        expect(tabs().queryByRole('tab', { name: /^Photos/ })).toBeNull();
        expect(moduleCalls(calls)).toEqual([]);
    });

    it('loads videos in cursor pages and opens one beside the list', async () => {
        const { history, calls } = renderSearch({ list: searchRoute('lily'), detail: null });
        fireEvent.click(await screen.findByRole('tab', { name: 'Videos' }));
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=videos');
        const list = await screen.findByRole('list', { name: 'Videos matching “lily”' });
        expect(calls).toContain('GET /search/videos?q=lily&limit=24');
        expect(screen.getByRole('tab', { name: 'Videos 1+' }).getAttribute('aria-selected')).toBe('true');
        // said once the results are in
        expect(await screen.findByText('1 or more video found')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'More videos' }));
        await within(list).findByText('Lily, an older clip');
        expect(calls).toContain('GET /search/videos?q=lily&cursor=p2&limit=24');
        expect(screen.getByRole('tab', { name: 'Videos 2' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'More videos' })).toBeNull();

        fireEvent.click(within(list).getByRole('button', { name: /^Lily at the lake/ }));
        expect(routeToPath(history.current)).toBe('/search/video/55?q=lily&tab=videos');
        // the count stays on the tab after another one is shown, and the search is not asked again
        fireEvent.click(screen.getByRole('tab', { name: /^People/ }));
        expect(screen.getByRole('tab', { name: 'Videos 2' })).toBeTruthy();
        expect(calls.filter((c) => c.startsWith('GET /search/videos'))).toHaveLength(2);
    });

    const opens: [SearchModuleTab, string, string, string, RegExp][] = [
        ['articles', 'GET /search/posts?q=lily&limit=20', 'Posts matching “lily”', '/search/article/37?q=lily&tab=articles', /^Lily’s slow walk/],
        ['albums', 'GET /search/albums?q=lily&limit=24', 'Albums matching “lily”', '/search/album/21?q=lily&tab=albums', /^Lily’s ridge trip/],
        ['files', 'GET /search/files?q=lily&limit=30', 'Files matching “lily”', '/search/file/71?q=lily&tab=files', /^Lily’s agenda/],
        ['polls', 'GET /search/polls?q=lily&limit=20', 'Polls matching “lily”', '/search/poll/2?q=lily&tab=polls', /^Which night suits/],
        ['tasks', 'GET /search/tasks?q=lily&limit=50', 'Tasks matching “lily”', '/search/task/91?q=lily&tab=tasks', /^Print Lily’s posters/],
    ];
    it.each(opens)('lists %s as the module’s own rows, which open as in its list', async (tab, call, label, path, title) => {
        const { history, calls } = renderSearch({ list: searchRoute('lily', tab), detail: null });
        const list = await screen.findByRole('list', { name: label });
        expect(calls).toContain(call);
        expect(moduleCalls(calls)).toHaveLength(1);
        fireEvent.click(within(list).getByRole('button', { name: title }));
        expect(routeToPath(history.current)).toBe(path);
    });

    it('shows photos as the grid, one tab stop, which opens a photo', async () => {
        const { history, calls } = renderSearch({ list: searchRoute('lily', 'photos'), detail: null });
        const grid = await screen.findByRole('list', { name: 'Photos matching “lily”' });
        expect(calls).toContain('GET /search/photos?q=lily&limit=30');
        const tiles = within(grid).getAllByRole('button');
        expect(tiles.map((tile) => tile.tabIndex)).toEqual([0, -1]);
        fireEvent.click(tiles[1]!);
        expect(routeToPath(history.current)).toBe('/search/photo/32?q=lily&tab=photos');
        expect(screen.getByRole('tab', { name: 'Photos 2' })).toBeTruthy();
    });

    it('takes a tab away when its search answers 404, without an error', async () => {
        const { client } = renderSearch({ list: searchRoute('lily', 'polls'), detail: null }, { off: ['/search/polls'] });
        expect(await screen.findByText('This network has no polls.')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(tabNames()).toEqual(['People 1', 'Feed 0', 'Groups 0', 'Posts', 'Photos', 'Albums', 'Videos', 'Files', 'Tasks']);
        // Refresh asks every list again and fails on none
        await expect(client.refetchQueries({ queryKey: ['polls'] }, { throwOnError: true })).resolves.toBeUndefined();
    });

    it('moves focus to the first tab when the focused tab is taken away, and leaves focus in the field', async () => {
        const { history } = renderSearch({ list: searchRoute('lily'), detail: null }, { off: ['/search/polls'] });
        // reached with the keyboard: the tab has focus when its search answers 404
        const polls = await screen.findByRole('tab', { name: 'Polls' });
        polls.focus();
        fireEvent.click(polls);
        expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Polls' }));
        expect(await screen.findByText('This network has no polls.')).toBeTruthy();
        expect(tabs().queryByRole('tab', { name: /^Polls/ })).toBeNull();
        const first = tabs().getAllByRole('tab')[0]!;
        expect(first.textContent).toBe('People 1');
        expect(document.activeElement).toBe(first);
        // the arrows switch tabs again
        fireEvent.keyDown(first, { key: 'ArrowRight' });
        expect(routeToPath(history.current)).toBe('/search?q=lily');
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=posts');
        expect(document.activeElement).toBe(screen.getByRole('tab', { selected: true }));

        // focus in the search field stays there
        cleanup();
        renderSearch({ list: searchRoute('lily'), detail: null }, { off: ['/search/polls'] });
        const field = screen.getAllByRole('searchbox')[0]!;
        field.focus();
        fireEvent.click(await screen.findByRole('tab', { name: 'Polls' }));
        expect(await screen.findByText('This network has no polls.')).toBeTruthy();
        expect(document.activeElement).toBe(field);
    });

    it('fetches past empty pages for the shown tab only, a restored one waiting until it is opened', async () => {
        // kept from the last session: one page with nothing the viewer may see, and a next one
        const restored = (client: QueryClient) => client.setQueryData(moduleSearchKey('files', 'lily'), { pages: [{ items: [], next_cursor: 'g2' }], pageParams: [undefined] });
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null }, { gaps: ['/search/files', '/search/polls'] }, restored);
        await screen.findByRole('tab', { name: 'Files 0+' });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(moduleCalls(calls)).toEqual([]);

        // shown: the pages after it are asked for, up to the one with a result
        fireEvent.click(screen.getByRole('tab', { name: 'Files 0+' }));
        const list = await screen.findByRole('list', { name: 'Files matching “lily”' });
        expect(within(list).getByRole('button', { name: /^Lily’s agenda/ })).toBeTruthy();
        expect(moduleCalls(calls)).toEqual(['GET /search/files?q=lily&cursor=g2&limit=30', 'GET /search/files?q=lily&cursor=g3&limit=30']);

        // left while its first page is on the way: the empty page that arrives asks for nothing more
        fireEvent.click(screen.getByRole('tab', { name: 'Polls' }));
        fireEvent.click(screen.getByRole('tab', { name: /^People/ }));
        await screen.findByRole('tab', { name: 'Polls 0+' });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(moduleCalls(calls).filter((c) => c.includes('/search/polls'))).toEqual(['GET /search/polls?q=lily&limit=20']);
        // and goes on when the tab is shown again
        fireEvent.click(screen.getByRole('tab', { name: 'Polls 0+' }));
        expect(await screen.findByRole('list', { name: 'Polls matching “lily”' })).toBeTruthy();
        expect(moduleCalls(calls).filter((c) => c.includes('/search/polls'))).toHaveLength(3);
    });

    it('says when nothing matches, and offers to try again when the search fails', async () => {
        renderSearch({ list: searchRoute('zzz', 'files'), detail: null });
        expect(await screen.findByText('Nothing matches “zzz”')).toBeTruthy();
        expect(screen.getByText('Check the spelling or try fewer words.')).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Files 0' })).toBeTruthy();
        cleanup();

        const { calls } = renderSearch({ list: searchRoute('lily', 'tasks'), detail: null }, { broken: ['/search/tasks'] });
        expect(await screen.findByText('The search is down')).toBeTruthy();
        expect(tabs().getByRole('tab', { name: 'Tasks' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(calls.filter((c) => c.startsWith('GET /search/tasks'))).toHaveLength(2));
    });

    it('moves between the tabs with the arrow keys, through the modules’ too', async () => {
        const { history } = renderSearch({ list: searchRoute('lily', 'files'), detail: null });
        await screen.findByRole('list', { name: 'Files matching “lily”' });
        fireEvent.keyDown(screen.getByRole('tab', { name: /^Files/ }), { key: 'ArrowRight' });
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=polls');
        await screen.findByRole('list', { name: 'Polls matching “lily”' });
        fireEvent.keyDown(screen.getByRole('tab', { name: /^Polls/ }), { key: 'End' });
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=tasks');
        fireEvent.keyDown(screen.getByRole('tab', { name: /^Tasks/ }), { key: 'Home' });
        expect(routeToPath(history.current)).toBe('/search?q=lily');
    });

    // a row 320px wide, each tab 70px and More 60px
    const narrowRow = () => {
        const real = Element.prototype.getBoundingClientRect;
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            if (!this.parentElement?.classList.contains('segmented-measure')) return real.call(this);
            const width = this.classList.contains('segment-more') ? 60 : 70;
            return { width, height: 24, top: 0, bottom: 24, left: 0, right: width, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
        });
        const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')!.get!;
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('search-tabs') ? 320 : (width.call(this) as number);
        });
    };

    it('keeps the row fitted, with a tab stop, when the shown tab is one the site has not', async () => {
        narrowRow();
        const { history } = renderSearch({ list: searchRoute('lily', 'polls'), detail: null }, { off: ['/search/polls'] });
        expect(await screen.findByText('This network has no polls.')).toBeTruthy();
        // no tab is the shown one: three and More fit, and Tab stops on the first
        await waitFor(() => expect(tabNames()).toEqual(['People 1', 'Feed 0', 'Groups 0']));
        expect(screen.getByRole('button', { name: /^More Results: Posts, Photos, Albums, Videos, Files, Tasks$/ })).toBeTruthy();
        const row = tabs().getAllByRole('tab');
        expect(row.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
        expect(row.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'false', 'false']);
        // the arrows start from the ends
        fireEvent.keyDown(row[0]!, { key: 'ArrowLeft' });
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=tasks');
    });

    it('puts the tabs that don’t fit the pane in a More menu, the shown one always in the row', async () => {
        // the shown tab and two more fit
        narrowRow();
        const { history } = renderSearch({ list: searchRoute('lily', 'tasks'), detail: null });
        await screen.findByRole('list', { name: 'Tasks matching “lily”' });
        await waitFor(() => expect(tabNames()).toEqual(['People 1', 'Feed 0', 'Tasks 1']));
        const more = screen.getByRole('button', { name: /^More Results: Groups 0, Posts, Photos, Albums, Videos, Files, Polls$/ });
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
        // the arrows still go through every tab, shown or not
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Tasks 1' }), { key: 'ArrowLeft' });
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=polls');
        await waitFor(() => expect(tabNames()).toEqual(['People 1', 'Feed 0', 'Polls 1']));
    });
});
