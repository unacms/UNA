import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { contextRoute, pageRoute, parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { contextKindOf, profileDetail, setSiteModules } from '../../lib/site-modules';
import { linkRoute } from '../../lib/targets';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from './group-view';
import { MY_SPACES_KEY, type Space } from './groups';
import { SIDEBAR_SPACES_LIST } from './sidebar-groups';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

const MODULES: Schema<'ModuleInfo'>[] = [
    { module: 'bx_groups', tag: 'groups', title: 'Groups', kind: 'group' },
    { module: 'bx_spaces', tag: 'spaces', title: 'Spaces', kind: 'space' },
    { module: 'bx_forum', tag: 'discussions', title: 'Discussions', kind: 'discussion' },
];

const viewer = (over: Partial<Schema<'GroupViewer'>> = {}): Schema<'GroupViewer'> => ({ status: 'none', role: null, can_join: true, join_on_site: false, can_leave: false, can_post: false, can_edit: false, ...over });

function space(id: string, name: string, over: Partial<Space> = {}): Space {
    return {
        id,
        kind: 'group',
        module: 'bx_spaces',
        handle: name.toLowerCase().replace(/\s+/g, '-'),
        display_name: name,
        about: `About ${name}`,
        status: 'active',
        avatar: null,
        cover: null,
        url: `https://community.example/view-space-profile/${id}`,
        created_at: '2026-01-01T00:00:00Z',
        visibility: 'public',
        join_policy: 'open',
        member_count: 3,
        content_visible: true,
        content_kinds: ['discussions'],
        viewer: viewer(),
        parent_id: null,
        child_count: 0,
        ...over,
    };
}

type Call = { method: string; path: string; query: string };

/**
 * A site with Spaces (or without: `spaces: false` lists no such module): Makers Guild (Lily is
 * in it, it has a badge) with two subspaces, Woodshop (open) and Print Studio (closed), and
 * Network Garden. `modules: false`: GET /api/v2 never answers (the module list not known yet).
 */
function site(opts: { spaces?: boolean; modules?: false } = {}) {
    const mine = new Set(['725']);
    const base: Record<string, Space> = {
        '725': space('725', 'Makers Guild', { child_count: 2, badges: [{ id: '1', name: 'Verified', color: null, icon: null }] }),
        '726': space('726', 'Woodshop', { parent_id: '725' }),
        '727': space('727', 'Print Studio', { parent_id: '725', visibility: 'closed', join_policy: 'approval', content_visible: false, about: '' }),
        '729': space('729', 'Network Garden'),
    };
    const shown = (id: string): Space => (mine.has(id) ? { ...base[id]!, viewer: viewer({ status: 'active', role: 'member', can_join: false, can_leave: true, can_post: true }) } : base[id]!);
    const calls: Call[] = [];
    const json = (status: number, body?: unknown) =>
        body === undefined ? new Response(null, { status }) : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
    const notFound = { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' };
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/' && opts.modules === false) return null;
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules: opts.spaces === false ? MODULES.filter((m) => m.tag !== 'spaces') : MODULES } };
        if (opts.spaces === false && (c.path.startsWith('/spaces') || c.path === '/me/spaces')) return { status: 404, body: notFound };
        if (c.path === '/me/groups') return { status: 200, body: [] };
        if (c.path === '/me/spaces') return { status: 200, body: [...mine].map(shown) };
        if (c.path === '/spaces') return { status: 200, body: { items: ['729', '725'].map(shown), next_cursor: null } };
        const m = /^\/spaces\/(\d+)(\/spaces|\/members|\/membership)?$/.exec(c.path);
        if (m?.[1] && base[m[1]]) {
            const id = m[1];
            if (!m[2]) return { status: 200, body: shown(id) };
            if (m[2] === '/spaces') return { status: 200, body: { items: Object.values(base).filter((s) => s.parent_id === id).map((s) => shown(s.id)), next_cursor: null } };
            if (m[2] === '/members') return { status: 200, body: { items: [{ profile: lily, role: 'owner', status: 'active', since: '2026-01-01T00:00:00Z' }], next_cursor: null } };
            if (c.method === 'POST') {
                mine.add(id);
                return { status: 200, body: { status: 'active' } };
            }
        }
        if (/^\/profiles\/\d+\/timeline$/.test(c.path)) return { status: 200, body: { items: [], next_cursor: null } };
        if (c.path === '/discussions') return { status: 200, body: { items: [], next_cursor: null } };
        if (c.path === '/discussions/categories') return { status: 200, body: { categories: [], can_create: true } };
        // /groups paths: no such space there (a space is no group of the Groups module)
        if (c.path.startsWith('/groups/')) return { status: 404, body: notFound };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search };
            calls.push(c);
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return json(a.status, a.body);
        },
    });
    return { api, calls };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'profile', label: 'Profile', command: 'go-profile' },
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

function renderApp(route: Route, api: UnaApi, seed?: (client: QueryClient) => void) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    seed?.(client);
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} />
        </QueryClientProvider>,
    );
    return { history, client };
}

// jsdom lays nothing out: the panes get a size, so the virtualized feed draws its posts
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
    localStorage.clear();
    setSiteModules(null);
});

async function pageRegion(name: string): Promise<HTMLElement> {
    return waitFor(() => {
        const pane = screen.getAllByRole('region', { name }).find((r) => r.dataset.pane === 'list');
        if (!pane) throw new Error(`no page named ${name}`);
        return pane;
    });
}

describe('space routes', () => {
    it('have one string form each, and a space as a detail opens as its page', () => {
        expect(routeToPath(contextRoute('space', '725'))).toBe('/spaces?space=725');
        expect(routeToPath(contextRoute('space', '725', 'spaces'))).toBe('/spaces?space=725&tab=spaces');
        expect(parseRoute('/spaces?space=725&tab=discussions')).toEqual(contextRoute('space', '725', 'discussions'));
        expect(parseRoute('/spaces')).toEqual(sectionRoute('spaces'));
        expect(parseRoute('/home/space/725/spaces')).toEqual({ list: { section: 'home' }, detail: { kind: 'space', id: '725', tab: 'spaces' } });
        expect(pageRoute(parseRoute('/notifications/space/725')!)).toEqual(contextRoute('space', '725'));
        // Subspaces is a space's tab only
        for (const bad of ['/spaces?group=725', '/groups?space=725', '/spaces?space=abc', '/spaces/space/725/posts', '/spaces?space=725&tab=nope', '/home/space/abc', '/groups?group=67&tab=spaces', '/home/group/67/spaces'])
            expect(parseRoute(bad), bad).toBeNull();
    });

    it('open in a window of their own', () => {
        expect(opensInWindow({ kind: 'space', id: '725' })).toBe(true);
    });

    it('route a profile of kind group by its module, once the site said which modules it has', () => {
        const group = { id: '67', kind: 'group', module: 'bx_groups' } as const;
        const sp = { id: '725', kind: 'group', module: 'bx_spaces' } as const;
        const event = { id: '900', kind: 'group', module: 'bx_events' } as const;
        // not known yet: every context as a group, as before
        expect(profileDetail(sp)).toEqual({ kind: 'group', id: '725' });
        setSiteModules(MODULES);
        expect(profileDetail(group)).toEqual({ kind: 'group', id: '67' });
        expect(profileDetail(sp)).toEqual({ kind: 'space', id: '725' });
        // a context the app has no page for (its module has no paths here): its profile, not a 404 group
        expect(profileDetail(event)).toEqual({ kind: 'profile', id: '900' });
        expect(profileDetail(lily)).toEqual({ kind: 'profile', id: '4' });
        expect(contextKindOf('bx_forum')).toBeNull();
        expect(linkRoute({ kind: 'group', id: '725', item_id: null, thread_id: null, module: 'bx_spaces' })).toEqual({ kind: 'space', id: '725' });
        expect(linkRoute({ kind: 'group', id: '900', item_id: null, thread_id: null, module: 'bx_events' })).toEqual({ kind: 'profile', id: '900' });
    });

    it('have Subspaces, and Discussions where the site lets them in', () => {
        expect(contextTabs(space('1', 'A'), 'space')).toEqual(['posts', 'spaces', 'discussions', 'members', 'about']);
        expect(contextTabs(space('1', 'A', { content_kinds: [] }), 'space')).toEqual(['posts', 'spaces', 'members', 'about']);
        // a closed space from outside: About only, as the site's page shows outsiders no subspaces
        expect(contextTabs(space('1', 'A', { content_visible: false }), 'space')).toEqual(['about']);
        expect(contextTabs(space('1', 'A', { content_visible: false, module: 'bx_groups' }), 'group')).toEqual(['about']);
        expect(contextTabs(space('1', 'A', { module: 'bx_groups' }), 'group')).toEqual(['posts', 'discussions', 'members', 'about']);
    });
});

describe('spaces in the window', () => {
    it('lists one’s spaces in the sidebar where the site has Spaces, and opens one as its page', async () => {
        const { api } = site();
        const { history } = renderApp(sectionRoute('home'), api);
        const list = await screen.findByRole('list', { name: 'Your spaces' });
        expect(screen.getByRole('button', { name: 'Spaces', expanded: true }).getAttribute('aria-controls')).toBe(SIDEBAR_SPACES_LIST);
        fireEvent.click(within(list).getByRole('button', { name: 'Makers Guild' }));
        expect(routeToPath(history.current)).toBe('/spaces?space=725');
        expect(await pageRegion('Makers Guild')).toBeTruthy();
        expect(within(list).getByRole('button', { name: 'Makers Guild' }).getAttribute('aria-current')).toBe('page');

        fireEvent.click(within(list).getByRole('button', { name: 'Browse spaces' }));
        expect(routeToPath(history.current)).toBe('/spaces');
        const browse = await screen.findByRole('list', { name: 'Spaces' });
        expect(within(browse).getByText(/2 subspaces/)).toBeTruthy();
    });

    it('drops the saved list of one’s spaces once the site’s module list has no Spaces', async () => {
        const { api, calls } = site({ spaces: false });
        // what an earlier run saved, while the site still had Spaces
        renderApp(sectionRoute('home'), api, (client) => client.setQueryData(MY_SPACES_KEY, [space('725', 'Makers Guild')]));
        await waitFor(() => expect(calls.some((c) => c.path === '/')).toBe(true));
        await waitFor(() => expect(screen.queryByRole('list', { name: 'Your spaces' })).toBeNull());
        expect(screen.queryByRole('button', { name: 'Spaces', expanded: true })).toBeNull();
    });

    it('opens a sidebar space in a window of its own on a double-click', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { api } = site();
        renderApp(sectionRoute('home'), api);
        const list = await screen.findByRole('list', { name: 'Your spaces' });
        const row = within(list).getByRole('button', { name: 'Makers Guild' });
        fireEvent.doubleClick(row);
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0]?.[0]).toContain(encodeURIComponent('/home/space/725'));
        opened.mockRestore();
    });

    it('shows badges after a space’s name in Browse, and opens a row in a window of its own on a double-click', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { api } = site();
        renderApp(sectionRoute('spaces'), api);
        const browse = await screen.findByRole('list', { name: 'Spaces' });
        const row = within(browse).getByRole('button', { name: 'Makers Guild' }).closest('li')!;
        expect(within(row).getByText('Verified')).toBeTruthy();
        fireEvent.doubleClick(within(row).getByText(/2 subspaces/));
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0]?.[0]).toContain(encodeURIComponent('/spaces/space/725'));
        // not over its buttons
        const join = within(browse).getAllByRole('button', { name: 'Join' })[0]!;
        fireEvent.doubleClick(join);
        expect(opened).toHaveBeenCalledTimes(1);
        opened.mockRestore();
    });

    it('moves a space opened as a group before the site said which modules it has to the space’s page', async () => {
        const { api, calls } = site({ modules: false });
        const { history } = renderApp(contextRoute('group', '725', 'members'), api);
        // the group path is 404 for a space; the space path answers, and the route follows
        await waitFor(() => expect(routeToPath(history.current)).toBe('/spaces?space=725&tab=members'));
        expect(calls.some((c) => c.path === '/groups/725')).toBe(true);
        expect(calls.some((c) => c.path === '/spaces/725')).toBe(true);
        const pane = await pageRegion('Makers Guild');
        expect(within(pane).queryByText('This group isn’t available')).toBeNull();
        expect(await within(pane).findByRole('tablist', { name: 'Makers Guild, space' })).toBeTruthy();
    });

    it('has no Spaces in the sidebar on a site without them, and never asks for them', async () => {
        const { api, calls } = site({ spaces: false });
        renderApp(sectionRoute('home'), api);
        await waitFor(() => expect(calls.some((c) => c.path === '/')).toBe(true));
        await waitFor(() => expect(calls.some((c) => c.path === '/me/groups')).toBe(true));
        expect(screen.queryByRole('list', { name: 'Your spaces' })).toBeNull();
        expect(calls.some((c) => c.path === '/me/spaces' || c.path.startsWith('/spaces'))).toBe(false);
    });

    it('shows a space’s subspaces on their tab, each opening its page, which names the space it is in', async () => {
        const { api, calls } = site();
        const { history } = renderApp(contextRoute('space', '725'), api);
        const pane = await pageRegion('Makers Guild');
        const tabs = await within(pane).findByRole('tablist', { name: 'Makers Guild, space' });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Subspaces', 'Discussions', 'Members', 'About']);
        expect(calls.some((c) => c.path.startsWith('/groups/725'))).toBe(false);

        fireEvent.click(within(tabs).getByRole('tab', { name: 'Subspaces' }));
        expect(routeToPath(history.current)).toBe('/spaces?space=725&tab=spaces');
        const children = await within(pane).findByRole('list', { name: 'Subspaces, 2 subspaces' });
        expect(within(children).getAllByRole('button', { name: /Woodshop|Print Studio/ }).map((b) => b.textContent)).toEqual(['Woodshop', 'Print Studio']);

        // joining a subspace goes to its own path
        fireEvent.click(within(children).getAllByRole('button', { name: 'Join' })[0]!);
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/spaces/726/membership')).toBe(true));

        fireEvent.click(within(children).getByRole('button', { name: 'Print Studio' }));
        expect(routeToPath(history.current)).toBe('/spaces?space=727');
        const child = await pageRegion('Print Studio');
        // closed from outside: About only (one tab, so no tab list), never its subspaces
        expect(await within(child).findByText('Only members see this space’s posts and members.')).toBeTruthy();
        expect(within(child).queryByRole('tablist')).toBeNull();
        expect(calls.some((c) => c.path === '/spaces/727/spaces')).toBe(false);
        fireEvent.click(await within(child).findByRole('button', { name: 'Makers Guild' }));
        expect(routeToPath(history.current)).toBe('/spaces?space=725');
    });

    it('lists the space’s discussions, with New discussion for its members', async () => {
        const { api, calls } = site();
        const { history } = renderApp(contextRoute('space', '725', 'discussions'), api);
        const pane = await pageRegion('Makers Guild');
        expect(await within(pane).findByText('No discussions in Makers Guild yet')).toBeTruthy();
        expect(calls.some((c) => c.path === '/discussions' && c.query.includes('context_id=725'))).toBe(true);
        fireEvent.click(within(pane).getByRole('button', { name: 'New discussion' }));
        expect(history.current.detail).toEqual({ kind: 'new-discussion', groupId: '725' });
    });
});
