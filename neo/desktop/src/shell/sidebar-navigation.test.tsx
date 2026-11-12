import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema } from 'una-api';

import { AppContext, type AppContextValue } from '../lib/context';
import { fallbackMenus } from '../lib/native-menu';
import { RouterProvider } from '../lib/navigation';
import { connectionsPage, parseRoute, RouteHistory, routeToPath, sectionRoute, sitePage } from '../lib/router';
import { currentRow, NAVIGATION_KEY, type Navigation, type NavigationItem, sidebarModel, targetList } from '../lib/site-navigation';
import { setSiteModules } from '../lib/site-modules';
import { type CommandHandler, Shell } from './shell';
import type { NavItem } from './sidebar';
import { rowBadge } from './sidebar-navigation';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

type Target = NavigationItem['target'];
const section = (name: string, view: string | null = null, path: string | null = null): Target => ({ kind: 'section', section: name, view, id: null, module: null, path });

function item(id: string, title: string, target: Target, more: Partial<NavigationItem> = {}): NavigationItem {
    const [set = '', module = '', name = ''] = id.split(':');
    return { id, set, module, name, title, icon: null, link: `https://community.example/${name}`, counter: null, target, tabs: [], contexts: [], more_contexts: false, all_target: null, config: {}, hidden_on: [], ...more };
}

/** A site's sidebar as an owner may set it up: the site menu, the member menu headed You, and the contexts one belongs to. */
const NAVIGATION: Navigation = {
    menu: 'sys_apps_sidebar',
    platform: 'desktop-app',
    groups: [
        { id: 'sys_apps_sidebar:system:member-avatar', name: 'member-avatar', kind: 'profile', title: '', menu: null, profile: lily, items: [] },
        {
            id: 'sys_apps_sidebar:system:public-menu',
            name: 'public-menu',
            kind: 'items',
            title: '',
            menu: 'sys_site_in_panel',
            profile: null,
            items: [
                item('sys_site:system:home', 'Home', section('home'), { icon: 'home' }),
                item('sys_site:system:explore', 'Explore', section('explore'), { icon: 'compass' }),
                item('sys_site:bx_notifications:notifications-view', 'Notifications', section('notifications'), { icon: 'bell' }),
                // Persons' People: the app's People section
                item('sys_site:bx_persons:persons-home', 'People', section('persons', 'recent'), { icon: 'user-round' }),
                item('sys_site:bx_posts:posts-home', 'Posts', section('posts', null, '/page/posts-home'), { icon: 'file-text' }),
                item('sys_site:bx_polls:polls-home', 'Polls', section('polls', null, '/page/polls-home')),
                item('sys_site:bx_glossary:glossary-home', 'Glossary', null),
                item('sys_site:bx_wiki:wiki-home', 'Wiki', section('wiki')),
                item('sys_site:bx_tasks:tasks-home', 'Tasks', section('tasks')),
                item('sys_site:system:about', 'About', { kind: 'page', section: null, view: null, id: null, module: null, path: '/page/about' }),
            ],
        },
        {
            id: 'sys_apps_sidebar:system:member-menu',
            name: 'member-menu',
            kind: 'items',
            title: 'You',
            menu: 'sys_profile_stats',
            profile: null,
            items: [
                item('sys_profile_stats:system:profile-stats-profile', 'Profile', { kind: 'profile', section: null, view: null, id: '4', module: 'bx_persons', path: null }),
                item('sys_profile_stats:system:friend-suggestions', 'Connections', section('connections'), { counter: 9 }),
                item('sys_profile_stats:bx_posts:profile-stats-my-posts', 'My posts', section('posts', 'mine'), { counter: 12 }),
                // the same place as the site menu's Posts: one row
                item('sys_profile_stats:bx_posts:profile-stats-again', 'Posts again', section('posts')),
            ],
        },
        {
            id: 'sys_apps_sidebar:system:member-memberships',
            name: 'member-memberships',
            kind: 'followings',
            title: '',
            menu: 'sys_profile_memberships',
            profile: null,
            items: [
                // one's friends: Browse people opens People, All your friends its Friends tab
                item('sys_profile_memberships:bx_persons:persons', 'Your friends', section('persons'), {
                    link: null,
                    more_contexts: true,
                    all_target: section('persons', 'friends'),
                    contexts: [{ id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila Santos', avatar: null }],
                }),
                item('sys_profile_memberships:bx_groups:groups', 'Your groups', section('groups'), {
                    link: null,
                    // more than the sidebar shows: All your groups opens the ones one is in
                    more_contexts: true,
                    all_target: section('groups', 'joined'),
                    contexts: [
                        { id: '13', kind: 'group', module: 'bx_groups', display_name: 'Lily Gardeners', avatar: null },
                        { id: '14', kind: 'group', module: 'bx_groups', display_name: 'Lake Walkers', avatar: null },
                    ],
                }),
            ],
        },
    ],
};

/** The fixed sidebar the shell gets from app.tsx, for a site without GET /navigation. */
const fixed: NavItem[] = [
    { section: 'home', label: 'Home (fixed)', command: 'go-home', icon: 'house' },
    { section: 'messages', label: 'Messages (fixed)', command: 'go-messages', icon: 'message-circle' },
];

type Answer = 'navigation' | 404 | 'never';

function renderShell({ answer = 'navigation' as Answer, kept, history = new RouteHistory(sectionRoute('home')) }: { answer?: Answer; kept?: Navigation; history?: RouteHistory } = {}) {
    const calls: string[] = [];
    const api = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: Request | URL | string) => {
            const request = input instanceof Request ? input : new Request(input);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
            if (path === '/navigation') {
                if (answer === 404) return json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' });
                if (answer === 'navigation') return json(200, NAVIGATION);
            }
            if (path === '/layout/resolve') return json(200, { id: '7', uri: '/page/polls-home', layout: 'single', title: 'Polls', title_key: null, params: {}, cells: [{ name: 'main', blocks: [] }] });
            return new Promise<Response>(() => {});
        },
    });
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        const ctx: AppContextValue = {
            api,
            siteUrl: 'https://community.example',
            me,
            signOut: () => {},
            signingOut: false,
            messageTo: () => {},
            runCommand: (id) => commands.current?.(id),
            sessions: [{ key: 'https://community.example|3', siteUrl: 'https://community.example', siteName: 'UNA Makers', accountName: 'Lily', active: true }],
            sessionKey: 'https://community.example|3',
        };
        return (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    <Shell siteUrl="https://community.example" items={fixed} profile={lily} commands={commands} />
                </RouterProvider>
            </AppContext.Provider>
        );
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    // what the offline store brought back at start (persist.ts hydrates it before the first render)
    if (kept) client.setQueryData(NAVIGATION_KEY, kept, { updatedAt: 0 });
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { history, calls };
}

afterEach(() => {
    act(() => fallbackMenus.show(null));
    cleanup();
    localStorage.clear();
    setSiteModules(null);
    vi.restoreAllMocks();
});

const nav = () => screen.getByRole('navigation', { name: 'Sections' });

describe('the sidebar from the site’s menus (GET /navigation)', () => {
    it('draws the site’s groups and items, in its order, with counts, headings and the current row', async () => {
        const { calls } = renderShell();
        await within(nav()).findByRole('button', { name: 'Explore' });
        expect(calls).toContain('GET /navigation?platform=desktop-app');
        const rows = within(nav())
            .getAllByRole('button')
            .map((b) => (b.querySelector('.nav-label') ?? b).textContent?.replace(/\s+/g, ' ').trim());
        // the site menu, then one's own (one Posts row), then the groups one follows
        const order = ['Home', 'Explore', 'Notifications', 'People', 'Posts', 'Polls', 'Profile', 'Connections', 'My posts', 'Your friends', 'Mila Santos', 'All your friends', 'Browse people', 'Your groups', 'Lily Gardeners', 'Lake Walkers', 'All your groups', 'Browse groups'];
        let at = -1;
        for (const name of order) {
            const i = rows.findIndex((r, n) => n > at && r === name);
            expect(i, `${name} after ${order[order.indexOf(name) - 1] ?? 'the start'} in ${rows.join(' | ')}`).toBeGreaterThan(at);
            at = i;
        }
        // nowhere the app can open: left out
        expect(rows).not.toContain('Glossary');
        expect(rows).not.toContain('Wiki');
        expect(rows).not.toContain('Posts again');
        // the fixed sidebar is gone
        expect(within(nav()).queryByRole('button', { name: /fixed/ })).toBeNull();
        // headings of the groups that have one, and the followed groups fold away
        expect(within(nav()).getByRole('heading', { name: 'You' })).toBeTruthy();
        // the groups one is a member of: a section of its own under its heading, no heading above it
        expect(within(nav()).getByRole('list', { name: 'Your groups' })).toBeTruthy();
        expect(within(nav()).queryByRole('heading', { name: 'Following' })).toBeNull();
        // the current row, the Cmd+1 hint, the counter said in the name
        expect(within(nav()).getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
        expect(within(nav()).getByRole('button', { name: 'Home' }).getAttribute('aria-keyshortcuts')).toBe('Control+Alt+1');
        expect(within(nav()).getByRole('button', { name: 'My posts, 12' })).toBeTruthy();
        // Connections counts the friend requests live, as the fixed one did
        expect(within(nav()).getByRole('button', { name: 'Connections, 9 friend requests waiting' })).toBeTruthy();
        // the site's Tasks item is the app's Tasks section, a section of its own after the group:
        // About, after Tasks in the site's menu, stays with the group's rows above it
        const tasks = within(nav()).getByRole('button', { name: /Tasks/ });
        const about = within(nav()).getByRole('button', { name: 'About' });
        expect(about.compareDocumentPosition(tasks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(about.closest('.sidebar-nav-group')?.contains(tasks)).toBe(false);
        // 32px rows with 20px icons, as every sidebar row
        // the still icon, or the animated one once it has loaded: the same box either way
        expect(within(nav()).getByRole('button', { name: 'Explore' }).querySelector('.nav-icon > span')?.getAttribute('style')).toContain('width: 20px');
    });

    it('opens each row in the content pane with nothing beside it, a followed group as its page', async () => {
        const { history } = renderShell();
        fireEvent.click(await within(nav()).findByRole('button', { name: 'My posts, 12' }));
        expect(routeToPath(history.current)).toBe('/posts?feed=mine');
        expect(within(nav()).getByRole('button', { name: 'My posts, 12' }).getAttribute('aria-current')).toBe('page');
        expect(within(nav()).getByRole('button', { name: 'Posts' }).getAttribute('aria-current')).toBeNull();
        act(() => history.push({ list: { section: 'home' }, detail: { kind: 'post', id: '12' } }));
        fireEvent.click(within(nav()).getByRole('button', { name: 'Lily Gardeners' }));
        expect(routeToPath(history.current)).toBe('/groups?group=13');
        expect(history.current.detail).toBeNull();
        expect(within(nav()).getByRole('button', { name: 'Lily Gardeners' }).getAttribute('aria-current')).toBe('page');
        // a group's page is not Browse groups
        expect(within(nav()).getByRole('button', { name: 'Browse groups' }).getAttribute('aria-current')).toBeNull();
        fireEvent.click(within(nav()).getByRole('button', { name: 'Connections, 9 friend requests waiting' }));
        expect(routeToPath(history.current)).toBe('/connections');
    });

    it('opens People from the site menu, and Your friends’ Browse people and All your friends in it', async () => {
        const { history } = renderShell();
        fireEvent.click(await within(nav()).findByRole('button', { name: 'People' }));
        expect(routeToPath(history.current)).toBe('/people');
        expect(within(nav()).getByRole('button', { name: 'People' }).getAttribute('aria-current')).toBe('page');
        fireEvent.click(within(nav()).getByRole('button', { name: 'All your friends' }));
        expect(routeToPath(history.current)).toBe('/people?feed=friends');
        expect(within(nav()).getByRole('button', { name: 'All your friends' }).getAttribute('aria-current')).toBe('page');
        expect(within(nav()).getByRole('button', { name: 'People' }).getAttribute('aria-current')).toBeNull();
        fireEvent.click(within(nav()).getByRole('button', { name: 'Browse people' }));
        expect(routeToPath(history.current)).toBe('/people');
        // a friend opens their profile
        fireEvent.click(within(nav()).getByRole('button', { name: 'Mila Santos' }));
        expect(routeToPath(history.current)).toBe('/profile?id=8');
    });

    it('opens an item without a screen of the app’s through the site’s page', async () => {
        const { history, calls } = renderShell();
        fireEvent.click(await within(nav()).findByRole('button', { name: 'Polls' }));
        expect(routeToPath(history.current)).toBe('/page?path=%2Fpage%2Fpolls-home');
        await waitFor(() => expect(calls).toContain('GET /layout/resolve?path=%2Fpage%2Fpolls-home&platform=desktop-app'));
        expect(await screen.findByRole('heading', { name: 'Polls', level: 1 })).toBeTruthy();
        expect(await screen.findByText('Nothing on this page that the app can show.')).toBeTruthy();
        expect(within(nav()).getByRole('button', { name: 'Polls' }).getAttribute('aria-current')).toBe('page');
    });

    it('says in the console which items it leaves out', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        renderShell();
        await within(nav()).findByRole('button', { name: 'Explore' });
        const notes = info.mock.calls.map((c) => String(c[0]));
        expect(notes.some((n) => n.includes('"Glossary"') && n.includes('opens nowhere'))).toBe(true);
        expect(notes.some((n) => n.includes('"Wiki"') && n.includes('no screen for section wiki'))).toBe(true);
    });

    it('folds a section with a heading (Browse) and remembers it; one without a heading has no fold', async () => {
        renderShell();
        const fold = await within(nav()).findByRole('button', { name: 'You', expanded: true });
        expect(within(nav()).getByRole('button', { name: /^Connections/ })).toBeTruthy();
        fireEvent.click(fold);
        expect(fold.getAttribute('aria-expanded')).toBe('false');
        expect(within(nav()).queryByRole('button', { name: /^Connections/ })).toBeNull();
        expect(localStorage.getItem('sidebar-followings-collapsed:group|sys_apps_sidebar:system:member-menu')).toBe('1');
        // the site menu has no heading: its rows have no fold
        expect(within(nav()).getByRole('button', { name: 'Explore' })).toBeTruthy();
        cleanup();
        renderShell();
        expect((await within(nav()).findByRole('button', { name: 'You' })).getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(within(nav()).getByRole('button', { name: 'You' }));
        expect(within(nav()).getByRole('button', { name: /^Connections/ })).toBeTruthy();
        expect(localStorage.getItem('sidebar-followings-collapsed:group|sys_apps_sidebar:system:member-menu')).toBeNull();
    });

    it('shows the answer the offline store kept at once, before the site answers', () => {
        renderShell({ answer: 'never', kept: NAVIGATION });
        // on the first frame: no waiting, no fixed list in between
        expect(within(nav()).getByRole('button', { name: 'Explore' })).toBeTruthy();
        expect(within(nav()).getByRole('button', { name: 'Lily Gardeners' })).toBeTruthy();
        expect(within(nav()).queryByRole('button', { name: /fixed/ })).toBeNull();
    });

    it('keeps the fixed sidebar on a site without GET /navigation', async () => {
        const { calls } = renderShell({ answer: 404 });
        await waitFor(() => expect(calls).toContain('GET /navigation?platform=desktop-app'));
        await waitFor(() => expect(within(nav()).getByRole('button', { name: 'Home (fixed)' })).toBeTruthy());
        expect(within(nav()).getByRole('button', { name: 'Messages (fixed)' })).toBeTruthy();
        expect(within(nav()).queryByRole('button', { name: 'Explore' })).toBeNull();
    });

    it('works from the keyboard: rows in the tab order, Enter opens one, a heading folds its groups', async () => {
        const user = userEvent.setup();
        const { history } = renderShell();
        const explore = await within(nav()).findByRole('button', { name: 'Explore' });
        within(nav()).getByRole('button', { name: 'Home' }).focus();
        await user.tab();
        expect(document.activeElement).toBe(explore);
        await user.keyboard('{Enter}');
        expect(routeToPath(history.current)).toBe('/explore');
        const fold = within(nav()).getByRole('button', { name: 'Your groups', expanded: true });
        fold.focus();
        await user.keyboard('{Enter}');
        expect(fold.getAttribute('aria-expanded')).toBe('false');
        expect(within(nav()).queryByRole('button', { name: 'Lily Gardeners' })).toBeNull();
        await user.keyboard(' ');
        expect(fold.getAttribute('aria-expanded')).toBe('true');
        expect(within(nav()).getByRole('button', { name: 'Lily Gardeners' })).toBeTruthy();
    });
});

describe('the sidebar’s rules', () => {
    it('opens targets where the app has them', () => {
        expect(targetList(section('conversations'))).toEqual({ section: 'messages' });
        expect(targetList(section('connections', 'requests'))).toEqual(connectionsPage('requests'));
        expect(targetList(section('events', 'joined'))).toEqual({ section: 'events', feed: 'going' });
        // Persons' section is People, its views the tabs (Recent the default)
        expect(targetList(section('persons'))).toEqual({ section: 'people' });
        expect(targetList(section('persons', 'recent'))).toEqual({ section: 'people' });
        expect(targetList(section('persons', 'online'))).toEqual({ section: 'people', feed: 'online' });
        expect(targetList(section('persons', 'friends'))).toEqual({ section: 'people', feed: 'friends' });
        expect(targetList(section('photos'))).toEqual({ section: 'media', feed: 'photos' });
        // a media module the site does not list has no tab: its page, or nothing
        expect(targetList(section('files', null, '/page/files-home'), { hasMediaTab: () => false })).toEqual({ section: 'page', page: '/page/files-home' });
        expect(targetList(section('wiki'))).toBeNull();
        expect(targetList({ kind: 'profile', section: null, view: null, id: '4', module: 'bx_persons', path: null }, { ownId: '4' })).toEqual({ section: 'profile' });
        expect(targetList({ kind: 'profile', section: null, view: null, id: '8', module: 'bx_persons', path: null }, { ownId: '4' })).toEqual({ section: 'profile', profile: '8' });
        expect(targetList({ kind: 'context', section: null, view: null, id: '13', module: 'bx_groups', path: null })).toEqual({ section: 'groups', group: '13' });
        expect(targetList({ kind: 'page', section: null, view: null, id: null, module: null, path: '//elsewhere' })).toBeNull();
    });

    it('picks the most specific current row, and none for someone else’s page', () => {
        const rows = [
            { key: 'posts', list: { section: 'posts' as const } },
            { key: 'mine', list: { section: 'posts' as const, feed: 'mine' as const } },
            { key: 'me', list: { section: 'profile' as const } },
            { key: 'groups', list: { section: 'groups' as const } },
        ];
        expect(currentRow(rows, { section: 'posts', feed: 'mine' })).toBe('mine');
        expect(currentRow(rows, { section: 'posts', feed: 'popular' })).toBe('posts');
        expect(currentRow(rows, { section: 'profile', profile: '4' }, '4')).toBe('me');
        expect(currentRow(rows, { section: 'profile', profile: '8' }, '4')).toBeNull();
        expect(currentRow(rows, { section: 'groups', group: '13' })).toBeNull();
    });

    it('keeps a site page in the route, one path form only', () => {
        const route = { list: sitePage('/page/about?profile_id=4')!, detail: null };
        expect(routeToPath(route)).toBe('/page?path=%2Fpage%2Fabout%3Fprofile_id%3D4');
        expect(parseRoute(routeToPath(route))).toEqual(route);
        expect(sitePage('//elsewhere.example/x')).toBeNull();
        expect(sitePage('https://elsewhere.example/')).toBeNull();
        expect(parseRoute('/page?path=%2F%2Felsewhere')).toBeNull();
    });

    it('says what a count is', () => {
        expect(rowBadge({ live: 'notifications', counter: null }, { notifications: 3 })).toEqual({ n: 3, spoken: ', 3 unread' });
        expect(rowBadge({ live: 'requests', counter: 1 }, null)).toEqual({ n: 1, spoken: ', 1 friend request waiting' });
        expect(rowBadge({ counter: 0 }, null)).toBeNull();
        expect(rowBadge({ counter: 12 }, null)).toEqual({ n: 12, spoken: ', 12' });
    });

    it('draws no group for the viewer (the profile button at the foot is it)', () => {
        const groups = sidebarModel(NAVIGATION, { ownId: '4' });
        expect(groups.map((g) => g.key)).toEqual(['sys_apps_sidebar:system:public-menu', 'sys_apps_sidebar:system:member-menu', 'sys_apps_sidebar:system:member-memberships']);
    });
});
