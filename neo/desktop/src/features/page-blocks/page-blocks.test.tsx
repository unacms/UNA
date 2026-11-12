import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ASIDE_DEFAULT, ASIDE_MIN } from '../../lib/aside-width';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { locale } from '../../lib/i18n';
import { RouterProvider } from '../../lib/navigation';
import { groupPage, profilePage, RouteHistory, type Route, sectionRoute } from '../../lib/router';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { categoryRows, infoWhen } from './page-blocks';
import { blockRoute, complementary, DESKTOP_MIN, type ResolvedBlock, type ResolvedPage, screenOf, shownOn, SIDE_LIMIT, sideCard, sitePath, TABLET_MIN } from './page-layout';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const person = (id: string, name: string): Schema<'Profile'> => ({ ...lily, id, display_name: name });

const design = (hidden: Schema<'Screen'>[] = []): Schema<'BlockDesign'> => ({
    frame: { title: true, bg: true, padding: true },
    hidden_on: hidden,
    title_hidden_on: [],
    bg_hidden_on: [],
    padding_hidden_on: [],
});
const block = (id: string, kind: string, title: string, endpoint: string | null, hidden: Schema<'Screen'>[] = []): ResolvedBlock => ({
    id,
    kind,
    module: 'system',
    title,
    title_key: null,
    endpoint,
    paged: true,
    design: design(hidden),
});

const home: ResolvedPage = {
    id: '1',
    uri: '/',
    layout: 'three_columns',
    title: 'Home',
    title_key: null,
    params: {},
    cells: [
        { name: 'top', blocks: [] },
        { name: 'left', blocks: [] },
        { name: 'main', blocks: [block('247', 'timeline.public', 'Public Feed', '/feeds/public')] },
        {
            name: 'right',
            blocks: [
                block('33', 'graph.friend_suggestions', 'Friend Suggestions', '/me/recommendations/friends?limit=3'),
                block('40', 'graph.friends', 'Friends', '/profiles/4/friends?limit=5', ['phone']),
                block('41', 'some.widget', 'A widget', '/widgets'),
                block('42', 'graph.follow_suggestions', 'Who to follow', '/me/recommendations/follows?limit=5', ['desktop']),
                block('43', 'posts.list', 'Featured Posts', '/posts?sort=featured&limit=5', ['phone']),
                block('44', 'groups.joined', 'My groups', '/me/groups'),
            ],
        },
        { name: 'bottom', blocks: [] },
    ],
};

// a person's page as the site installs it: the timeline at the top (the app's own), Friends in the
// main column (a whole list: its route has no limit) and Info in the side one
const milaPage: ResolvedPage = {
    id: '49',
    uri: '/page/view-persons-profile',
    layout: 'sidebar_right',
    title: '',
    title_key: null,
    params: { id: '3' },
    cells: [
        { name: 'top', blocks: [block('252', 'timeline.profile', '', '/profiles/8/timeline?limit=5')] },
        { name: 'main', blocks: [block('106', 'graph.friends', 'Friends', '/profiles/8/friends')] },
        { name: 'side', blocks: [{ ...block('110', 'profile.info', 'Info', '/profiles/8/info'), paged: false }] },
    ],
};
// a group's page: Info in the site's main half, Members in the other
const bookClubPage: ResolvedPage = {
    id: '60',
    uri: '/page/view-group-profile',
    layout: 'sidebar_right',
    title: '',
    title_key: null,
    params: { id: '142' },
    cells: [
        { name: 'top', blocks: [] },
        { name: 'main', blocks: [{ ...block('502', 'profile.info', 'Info', '/profiles/223/info'), paged: false }] },
        { name: 'side', blocks: [block('505', 'groups.members', 'Members', '/groups/223/members?limit=5', ['phone'])] },
        { name: 'bottom', blocks: [] },
    ],
};
// the posts home page: the list is the app's own, Categories and Featured Posts beside it
const postsPage: ResolvedPage = {
    id: '70',
    uri: '/page/posts-home',
    layout: 'sidebar_right',
    title: 'Posts',
    title_key: null,
    params: {},
    cells: [
        { name: 'main', blocks: [block('179', 'posts.list', 'Latest Posts', '/posts?sort=recent')] },
        { name: 'side', blocks: [{ ...block('181', 'posts.categories', 'Posts Categories', '/posts/categories?counts=true'), paged: false }, block('178', 'posts.list', 'Featured Posts', '/posts?sort=featured&limit=5', ['phone'])] },
    ],
};
const discussionsPage: ResolvedPage = {
    id: '71',
    uri: '/page/discussions-home',
    layout: 'sidebar_left',
    title: 'Discussions',
    title_key: null,
    params: {},
    cells: [
        { name: 'top', blocks: [] },
        { name: 'side', blocks: [{ ...block('589', 'discussions.categories', 'Discussions Categories', '/discussions/categories?counts=true'), paged: false }, block('588', 'discussions.list', 'Featured Discussions', '/discussions?sort=featured&limit=5', ['phone'])] },
        { name: 'main', blocks: [block('620', 'discussions.list', 'Discussions', '/discussions?sort=latest')] },
    ],
};
const pages: Record<string, ResolvedPage> = {
    '/view-persons-profile/mila': milaPage,
    '/view-group-profile/book-club': bookClubPage,
    '/page/posts-home': postsPage,
    '/page/discussions-home': discussionsPage,
};

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer>;

function fakeApi(routes: Routes, asked: string[]): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            asked.push(`${request.method} ${path}${url.search}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'explore', label: 'Explore', command: 'go-explore' },
];

function Harness({ history, api }: { history: RouteHistory; api: UnaApi }) {
    const commands = useRef<CommandHandler | null>(null);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

const feedPage = (next: string | null): Schema<'Page_Activity'> => ({ items: [], next_cursor: next }) as unknown as Schema<'Page_Activity'>;

function renderHome(route: Route, next: string | null = null, more: Routes = {}) {
    const asked: string[] = [];
    const routes: Routes = {
        'GET /reactions/details': () => ({ status: 200, body: { kinds: [], display: 'icon', per_user: 1, any_emoji: false } }),
        'GET /feeds/home': () => ({ status: 200, body: feedPage(next) }),
        'GET /layout/resolve': (request) => ({ status: 200, body: pages[new URL(request.url).searchParams.get('path') ?? ''] ?? home }),
        'GET /me/recommendations/friends': () => ({ status: 200, body: { items: [{ profile: person('12', 'Kenji'), score: 6 }], next_cursor: null } }),
        'GET /me/recommendations/follows': () => ({ status: 200, body: { items: [{ profile: person('14', 'Sofia'), score: 2 }], next_cursor: null } }),
        'GET /profiles/4/friends': () => ({ status: 200, body: { items: [{ profile: person('8', 'Mila'), since: '2026-01-01T00:00:00Z' }], next_cursor: null } }),
        'GET /me/groups': () => ({ status: 200, body: [] }),
        'GET /posts': () => ({
            status: 200,
            body: { items: [{ id: '41', title: 'The network app is in testing', author: person('65', 'Andrey'), published_at: '2026-11-01T00:00:00Z', created_at: '2026-11-01T00:00:00Z' }], next_cursor: null },
        }),
        'POST /profiles/12/friend': () => ({ status: 200, body: { status: 'requested' } }),
        ...more,
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={new RouteHistory(route)} api={fakeApi(routes, asked)} />
        </QueryClientProvider>,
    );
    return { asked };
}

// jsdom lays nothing out: the pane's scroller is desktop-wide, and a ResizeObserver that never calls back
const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
const hadObserver = 'ResizeObserver' in globalThis;
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
    if (!hadObserver)
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
    if (!hadObserver) delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
});
afterEach(() => cleanup());

describe('a page\'s screens and blocks', () => {
    it('takes the screen from the content pane\'s width, and a phone beside an open detail', () => {
        expect(screenOf(DESKTOP_MIN, false)).toBe('desktop');
        expect(screenOf(DESKTOP_MIN - 1, false)).toBe('tablet');
        expect(screenOf(TABLET_MIN, false)).toBe('tablet');
        expect(screenOf(TABLET_MIN - 1, false)).toBe('phone');
        expect(screenOf(1400, true)).toBe('phone');
        expect(screenOf(null, false)).toBe('tablet');
    });

    it('draws a text block written in Studio (About, Terms, Privacy)', () => {
        const text = { id: '42', kind: 'text.html', module: 'system', title: 'About', title_key: null, endpoint: '/layout/blocks/42/text', paged: false, design: { frame: { title: true, bg: true, padding: true }, hidden_on: [], title_hidden_on: [], bg_hidden_on: [], padding_hidden_on: [] } } as unknown as ResolvedBlock;
        expect(shownOn(text, 'desktop')).toBe(true);
        expect(shownOn({ ...text, design: { ...text.design, hidden_on: ['desktop'] } } as ResolvedBlock, 'desktop')).toBe(false);
    });

    it('keeps the side cells\' blocks the app draws and that show on the screen', () => {
        const ids = (blocks: ResolvedBlock[]) => blocks.map((b) => b.id);
        expect(ids(complementary(home, 'desktop').side)).toEqual(['33', '40', '43', '44']);
        expect(ids(complementary(home, 'phone').side)).toEqual(['33', '42', '44']);
        expect(complementary(home, 'desktop').top).toEqual([]);
        expect(complementary(undefined, 'desktop').side).toEqual([]);
    });

    it('puts every block about a profile beside its timeline, from any cell: Info first, the rest in reading order', () => {
        const ids = (blocks: ResolvedBlock[]) => blocks.map((b) => b.id);
        expect(ids(complementary(bookClubPage, 'desktop', true).side)).toEqual(['502', '505']);
        expect(ids(complementary(bookClubPage, 'phone', true).side)).toEqual(['502']);
        expect(ids(complementary(bookClubPage, 'desktop').side)).toEqual(['505']);
        // the timeline is the app's own: not drawn; Friends, in the site's main column, is a card after Info
        expect(ids(complementary(milaPage, 'desktop', true).side)).toEqual(['110', '106']);
        expect(ids(complementary(milaPage, 'phone', true).side)).toEqual(['110', '106']);
        expect(complementary(milaPage, 'desktop', true).top).toEqual([]);
        // a list of the main column asks for a card's few items; a route with its own limit, or not paged, is as it was
        expect(complementary(milaPage, 'desktop', true).side.map((b) => b.endpoint)).toEqual(['/profiles/8/info', `/profiles/8/friends?limit=${SIDE_LIMIT}`]);
        expect(sideCard(block('1', 'groups.members', 'Members', '/groups/223/members?limit=3')).endpoint).toBe('/groups/223/members?limit=3');
        expect(sideCard(block('2', 'posts.list', 'Posts', '/posts?sort=recent')).endpoint).toBe(`/posts?sort=recent&limit=${SIDE_LIMIT}`);
    });

    it('takes a profile\'s page on the site from its url', () => {
        expect(sitePath('https://community.example/view-persons-profile/mila', 'https://community.example')).toBe('/view-persons-profile/mila');
        expect(sitePath('https://community.example/page.php?i=view-group-profile&id=4', 'https://community.example/')).toBe('/page.php?i=view-group-profile&id=4');
        expect(sitePath('https://community.example/una/view-persons-profile/mila', 'https://community.example/una')).toBe('/view-persons-profile/mila');
        expect(sitePath('https://elsewhere.example/view-persons-profile/mila', 'https://community.example')).toBeNull();
        expect(sitePath('https://community.example/other/x', 'https://community.example/una')).toBeNull();
        expect(sitePath(null, 'https://community.example')).toBeNull();
    });

    it('lists the categories that have items, and writes dates in the viewer\'s locale', () => {
        expect(categoryRows([{ id: '1', slug: '1', name: 'Art', count: 2 }, { id: '2', slug: '2', name: 'Cars', count: 0 }])).toEqual([{ id: '1', name: 'Art', count: 2 }]);
        expect(categoryRows({ categories: [{ id: '5', title: 'General', count: 6 }], can_create: true })).toEqual([{ id: '5', name: 'General', count: 6 }]);
        expect(categoryRows(null)).toEqual([]);
        expect(infoWhen({ value: '7/11/2026', datetime: null })).toBe('7/11/2026');
        expect(infoWhen({ value: 'x', datetime: '2026-11-07' })).toBe(new Intl.DateTimeFormat(locale(),{ dateStyle: 'medium' }).format(new Date('2026-11-07')));
        expect(infoWhen({ value: 'x', datetime: '2026-11-07T09:30:00Z' })).toBe(new Intl.DateTimeFormat(locale(),{ dateStyle: 'medium', timeStyle: 'short' }).format(new Date('2026-11-07T09:30:00Z')));
    });

    it('reads only plain routes under the API', () => {
        expect(blockRoute('/posts?sort=featured&limit=5')).toEqual({ path: '/posts', query: { sort: 'featured', limit: '5' } });
        expect(blockRoute('/me/groups')).toEqual({ path: '/me/groups', query: {} });
        for (const bad of ['//evil.example/x', '/a/../b', 'https://evil.example/', '/a b']) expect(blockRoute(bad)).toBeNull();
    });
});

describe('Home with the site\'s blocks', () => {
    it('draws a column beside the feed at desktop width: cards with headings, people, posts, an action', async () => {
        const { asked } = renderHome(sectionRoute('home'));
        const aside = await screen.findByRole('complementary', { name: 'More on Home' });
        await within(aside).findByRole('heading', { level: 2, name: 'Friend Suggestions' });
        await within(aside).findByRole('heading', { level: 2, name: 'Friends' });
        await within(aside).findByRole('heading', { level: 2, name: 'Featured Posts' });
        expect(within(aside).getByRole('button', { name: 'Kenji' })).toBeTruthy();
        expect(within(aside).getByRole('button', { name: 'Mila' })).toBeTruthy();
        expect(within(aside).getByRole('button', { name: 'The network app is in testing' })).toBeTruthy();
        // hidden on desktop, an unknown kind, an empty list: not drawn, and the hidden one not even read
        expect(within(aside).queryByRole('heading', { name: 'Who to follow' })).toBeNull();
        expect(within(aside).queryByRole('heading', { name: 'A widget' })).toBeNull();
        expect(within(aside).queryByRole('heading', { name: 'My groups' })).toBeNull();
        expect(asked.some((a) => a.startsWith('GET /me/recommendations/follows'))).toBe(false);
        expect(asked).toContain('GET /layout/resolve?path=%2F&platform=desktop-app');
        expect(asked).toContain('GET /posts?sort=featured&limit=5');

        const add = within(aside).getByRole('button', { name: 'Add friend, Kenji' });
        add.focus();
        fireEvent.click(add);
        await within(aside).findByRole('button', { name: 'Requested, Kenji' });
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Requested, Kenji');
        expect(asked).toContain('POST /profiles/12/friend');
    });

    it('lets the side column be made wider or narrower from its divider, remembered on this computer', async () => {
        renderHome(sectionRoute('home'));
        await screen.findByRole('complementary', { name: 'More on Home' });
        const columns = document.querySelector<HTMLElement>('.page-columns[data-columns="side"]')!;
        const divider = screen.getByRole('separator', { name: 'Resize side column' });
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT));
        // the column is after the line: the left arrow widens it, the right narrows it
        fireEvent.keyDown(divider, { key: 'ArrowLeft' });
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT + 8));
        expect(columns.style.getPropertyValue('--aside-width')).toBe(`${ASIDE_DEFAULT + 8}px`);
        expect(localStorage.getItem('una-desktop-aside-width')).toBe(String(ASIDE_DEFAULT + 8));
        fireEvent.keyDown(divider, { key: 'ArrowRight', shiftKey: true });
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT + 8 - 32));
        // dragging to the left widens it too
        fireEvent.pointerDown(divider, { button: 0, clientX: 500, pointerId: 1 });
        fireEvent.pointerMove(divider, { clientX: 460, pointerId: 1 });
        fireEvent.pointerUp(divider, { pointerId: 1 });
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT + 8 - 32 + 40));
        // Home is the narrowest; a double-click puts the default back, which is not kept
        fireEvent.keyDown(divider, { key: 'Home' });
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_MIN));
        fireEvent.doubleClick(divider);
        expect(divider.getAttribute('aria-valuenow')).toBe(String(ASIDE_DEFAULT));
        expect(localStorage.getItem('una-desktop-aside-width')).toBeNull();
    });

    it('beside an open post is a phone: no column, and the blocks shown on phones go under the feed\'s end', async () => {
        const { asked } = renderHome({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } });
        const aside = await screen.findByRole('complementary', { name: 'More on Home' });
        expect(aside.closest('.page-main')).toBeTruthy();
        await within(aside).findByRole('heading', { name: 'Friend Suggestions' });
        await within(aside).findByRole('heading', { name: 'Who to follow' });
        expect(within(aside).queryByRole('heading', { name: 'Friends' })).toBeNull();
        expect(within(aside).queryByRole('heading', { name: 'Featured Posts' })).toBeNull();
        expect(asked.some((a) => a.startsWith('GET /profiles/4/friends'))).toBe(false);
        expect(document.querySelector('.page-columns[data-columns]')).toBeNull();
    });

    it('waits for the feed\'s end before stacking them under an endless feed', async () => {
        renderHome({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } }, 'more');
        await waitFor(() => expect(document.querySelector('.page-columns')?.getAttribute('data-screen')).toBe('phone'));
        expect(screen.queryByRole('complementary', { name: 'More on Home' })).toBeNull();
    });
});

const mila: Schema<'Profile'> = { ...person('8', 'Mila'), url: 'https://community.example/view-persons-profile/mila' };
const connections = { followers: 2, following: 1, friends: 1, viewer: null, lists: { followers: true, following: true, friends: true } };
const bookClub = {
    ...person('223', 'Book Club'),
    kind: 'group',
    module: 'bx_groups',
    url: 'https://community.example/view-group-profile/book-club',
    visibility: 'public',
    join_policy: 'open',
    member_count: 4,
    content_visible: true,
    content_kinds: [],
    viewer: null,
};
const discussion = (id: string, title: string) => ({
    id,
    content_id: null,
    title,
    summary: '',
    body: '',
    body_html: '',
    author: person('8', 'Mila'),
    anonymous: false,
    category: { id: '5', title: 'General' },
    audience: 'public',
    context_id: null,
    stats: { replies: 0, views: 1 },
    sticky: false,
    locked: false,
    resolved: null,
    last_reply_at: null,
    last_reply_by: null,
    url: '',
    created_at: '2026-11-04T10:00:00Z',
    updated_at: '2026-11-04T10:00:00Z',
    viewer: { can_edit: false, can_edit_text: false, can_delete: false, can_reply: true },
});

describe('profile and group pages with the site\'s blocks', () => {
    it('draws a profile\'s Info and Friends beside its feed, read from its page on the site', async () => {
        const { asked } = renderHome({ list: profilePage('8'), detail: null }, null, {
            'GET /profiles/8': () => ({ status: 200, body: mila }),
            'GET /profiles/8/connections': () => ({ status: 200, body: connections }),
            'GET /profiles/8/timeline': () => ({ status: 200, body: feedPage(null) }),
            'GET /profiles/8/info': () => ({
                status: 200,
                body: {
                    fields: [
                        { name: 'gender', label: 'Gender', value: 'Woman', datetime: null },
                        { name: 'birthday', label: 'Birthday', value: '1990-04-02T00:00:00Z', datetime: '1990-04-02' },
                    ],
                },
            }),
            'GET /profiles/8/friends': () => ({ status: 200, body: { items: [{ profile: person('9', 'Tom'), since: '2026-01-01T00:00:00Z' }], next_cursor: null } }),
        });
        const aside = await screen.findByRole('complementary', { name: 'More on Mila' });
        expect(aside.closest('.profile-panel')).toBeTruthy();
        await within(aside).findByRole('heading', { level: 2, name: 'Info' });
        expect(within(aside).getByText('Gender').tagName).toBe('DT');
        expect(within(aside).getByText('Woman').tagName).toBe('DD');
        expect(within(aside).getByText(infoWhen({ value: '', datetime: '1990-04-02' })).getAttribute('datetime')).toBe('1990-04-02');
        await within(aside).findByRole('heading', { level: 2, name: 'Friends' });
        expect(within(aside).getByRole('button', { name: 'Tom' })).toBeTruthy();
        // Info comes first, and the timeline at the top is the page's own
        const headings = within(aside).getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
        expect(headings).toEqual(['Info', 'Friends']);
        // Friends is in the site's main column (a whole list there): the card asks for a few
        expect(asked.some((a) => a.startsWith(`GET /profiles/8/friends?limit=${SIDE_LIMIT}`))).toBe(true);
        expect(asked).toContain(`GET /layout/resolve?path=${encodeURIComponent('/view-persons-profile/mila')}&platform=desktop-app`);
        expect(asked.some((a) => a.startsWith('GET /profiles/8/timeline?limit=5'))).toBe(false);
    });

    it('draws a group\'s Info and Members beside its posts', async () => {
        renderHome({ list: groupPage('223'), detail: null }, null, {
            'GET /groups/223': () => ({ status: 200, body: bookClub }),
            'GET /profiles/223/timeline': () => ({ status: 200, body: feedPage(null) }),
            'GET /profiles/223/info': () => ({ status: 200, body: { fields: [{ name: 'group_cat', label: 'Category', value: 'Interests', datetime: null }] } }),
            'GET /groups/223/members': () => ({ status: 200, body: { items: [{ profile: person('9', 'Tom'), role: 'member', status: 'active', since: '2026-01-01T00:00:00Z' }], next_cursor: null } }),
        });
        const aside = await screen.findByRole('complementary', { name: 'More on Book Club' });
        await within(aside).findByText('Interests');
        await within(aside).findByRole('heading', { level: 2, name: 'Members' });
        expect(within(aside).getByRole('button', { name: 'Tom' })).toBeTruthy();
        expect(within(aside).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Info', 'Members']);
    });
});

describe('Posts and Discussions with the site\'s blocks', () => {
    it('lists Posts\' categories with their counts beside the list; one opens the list of that category in the app', async () => {
        const fullPost = {
            id: '37',
            content_id: '7700',
            module: 'bx_posts',
            title: 'A slow walk with one lens',
            summary: '',
            body_html: null,
            author: person('8', 'Mila'),
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
            featured: true,
            stats: { comments: 0, reactions: 0, views: 4 },
            revision: 1,
            url: '',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
            published_at: '2026-11-05T10:00:00Z',
            publish_at: null,
            created_at: '2026-11-05T10:00:00Z',
            updated_at: '2026-11-05T10:00:00Z',
        };
        const { asked } = renderHome(sectionRoute('posts'), null, {
            'GET /posts': () => ({ status: 200, body: { items: [fullPost], next_cursor: null } }),
            'GET /posts/categories': () => ({
                status: 200,
                body: [
                    { id: '3', slug: '3', name: 'Art', count: 2 },
                    { id: '4', slug: '4', name: 'Cars', count: 0 },
                ],
            }),
        });
        const aside = await screen.findByRole('complementary', { name: 'More on Posts' });
        await within(aside).findByRole('heading', { level: 2, name: 'Posts Categories' });
        await within(aside).findByRole('heading', { level: 2, name: 'Featured Posts' });
        // a category without posts is not listed, as on the site
        expect(within(aside).queryByRole('button', { name: /^Cars/ })).toBeNull();
        const art = within(aside).getByRole('button', { name: 'Art, 2 posts' });
        expect(art.getAttribute('aria-current')).toBeNull();
        fireEvent.click(art);
        await screen.findByText('All posts');
        expect(screen.getByText('Art', { selector: '.category-filter bdi' })).toBeTruthy();
        expect(within(aside).getByRole('button', { name: 'Art, 2 posts' }).getAttribute('aria-current')).toBe('true');
        await waitFor(() => expect(asked.some((a) => a.startsWith('GET /posts?') && a.includes('sort=recent') && a.includes('category=3'))).toBe(true));
        // back to all of them
        fireEvent.click(screen.getByRole('button', { name: 'All posts' }));
        await waitFor(() => expect(screen.queryByText('All posts')).toBeNull());
    });

    it('lists Discussions\' categories and featured discussions beside the list', async () => {
        const { asked } = renderHome(sectionRoute('discussions'), null, {
            'GET /discussions/categories': () => ({ status: 200, body: { categories: [{ id: '5', title: 'General', count: 6 }], can_create: true } }),
            'GET /discussions': (request) => ({
                status: 200,
                body: { items: new URL(request.url).searchParams.get('sort') === 'featured' ? [discussion('16', 'Best two-player board games?')] : [discussion('20', 'Library café on Thursdays')], next_cursor: null },
            }),
        });
        const aside = await screen.findByRole('complementary', { name: 'More on Discussions' });
        await within(aside).findByRole('heading', { level: 2, name: 'Featured Discussions' });
        expect(within(aside).getByRole('button', { name: 'Best two-player board games?' })).toBeTruthy();
        expect(within(aside).getByRole('button', { name: 'General, 6 discussions' })).toBeTruthy();
        expect(asked).toContain('GET /discussions/categories?counts=true');
        expect(asked).toContain('GET /discussions?sort=featured&limit=5');
        // the list itself is the app's: the site's main block is not drawn
        expect(within(aside).queryByRole('heading', { name: 'Discussions' })).toBeNull();
    });
});
