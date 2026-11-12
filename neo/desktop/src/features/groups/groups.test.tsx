import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { draftKey, draftStore, setDraftStore } from '../../lib/drafts';
import { RouterProvider } from '../../lib/navigation';
import { groupRoute, pageRoute, parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { linkRoute } from '../../lib/targets';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { actionAnnouncement, type Group, membershipActions, membersText, membershipText, postableGroups } from './groups';
import { SIDEBAR_GROUPS_LIST } from './sidebar-groups';
import { richText, setRichText } from '../../components/rich-editor/test-utils';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [{ ...lily, about: '', created_at: '2026-01-01T00:00:00Z' }] } as unknown as Schema<'Me'>;

const viewer = (over: Partial<Schema<'GroupViewer'>> = {}): Schema<'GroupViewer'> => ({ status: 'none', role: null, can_join: true, join_on_site: false, can_leave: false, can_post: false, can_edit: false, ...over });
const member = (role: Schema<'GroupRole'> = 'member') => viewer({ status: 'active', role, can_join: false, can_leave: true, can_post: true });

function group(id: string, name: string, over: Partial<Group> = {}): Group {
    return {
        id,
        kind: 'group',
        module: 'bx_groups',
        handle: name.toLowerCase().replace(/\s+/g, '-'),
        display_name: name,
        about: `About ${name}`,
        status: 'active',
        avatar: null,
        cover: null,
        url: `https://community.example/view-group-profile/${id}`,
        created_at: '2026-01-01T00:00:00Z',
        visibility: 'public',
        join_policy: 'open',
        member_count: 3,
        content_visible: true,
        content_kinds: [],
        viewer: viewer(),
        ...over,
    };
}

function post(id: string, text: string, contextId: string | null = null): Schema<'Activity'> {
    return {
        id,
        verb: 'posted',
        actor: lily,
        object: {
            id: `c${id}`,
            kind: 'feed_post',
            module: 'bx_timeline',
            author: lily,
            anonymous: false,
            audience: contextId ? 'context' : 'public',
            context_id: contextId,
            card: { text },
            media: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-06T00:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-06T00:00:00Z',
    } as unknown as Schema<'Activity'>;
}

type Answer = { status: number; body?: unknown };
type Call = { method: string; path: string; body: unknown };

/**
 * A site with three groups: UNA Network (Lily owns it), Design Circle (open) and Night Owls
 * (closed, its admins approve). Joining and leaving change what the site answers.
 */
function site(opts: { groups?: boolean; secret?: boolean; invited?: boolean; refuseLeave?: boolean } = {}) {
    const state = { mine: new Set(opts.secret ? ['69', '13'] : ['13']), pending: new Set<string>(), invited: new Set(opts.invited ? ['70'] : []), posts: [] as Schema<'Activity'>[], reported: new Set<string>() };
    const base: Record<string, Group> = {
        '13': group('13', 'UNA Network', { member_count: 1 }),
        '67': group('67', 'Design Circle'),
        '68': group('68', 'Night Owls', { visibility: 'closed', join_policy: 'approval', about: '', content_visible: false }),
        // secret: the site answers 404 to all but its members and invitees
        '69': group('69', 'Hidden Garden', { visibility: 'secret', join_policy: 'approval' }),
        '70': group('70', 'Book Club', { visibility: 'secret' }),
    };
    const hidden = (id: string) => base[id]?.visibility === 'secret' && !state.mine.has(id) && !state.invited.has(id);
    const shown = (id: string): Group => {
        const g = base[id]!;
        if (state.mine.has(id)) return { ...g, content_visible: true, about: g.about || `About ${g.display_name}`, viewer: member(id === '13' ? 'owner' : 'member') };
        if (state.pending.has(id)) return { ...g, viewer: viewer({ status: 'pending', can_join: false, can_leave: true }) };
        if (state.invited.has(id)) return { ...g, viewer: viewer({ status: 'invited', can_join: true, can_leave: true }) };
        return g;
    };
    const calls: Call[] = [];
    const json = (status: number, body?: unknown) =>
        body === undefined ? new Response(null, { status }) : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
    const notFound = { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' };
    const answer = (c: Call): Answer | null => {
        if (opts.groups === false && (c.path.startsWith('/groups') || c.path === '/me/groups')) return { status: 404, body: notFound };
        if (c.method === 'GET' && c.path === '/me/groups') return { status: 200, body: [...state.mine].reverse().map(shown) };
        if (c.method === 'GET' && c.path === '/groups') return { status: 200, body: { items: ['68', '67', '13'].map(shown), next_cursor: null } };
        let m = /^\/groups\/(\d+)(\/members|\/membership)?$/.exec(c.path);
        if (m?.[1] && base[m[1]]) {
            const id = m[1];
            if (hidden(id)) return { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found', detail: 'The group was not found' } };
            if (!m[2] && c.method === 'GET') return { status: 200, body: shown(id) };
            if (m[2] === '/members') return { status: 200, body: { items: [{ profile: eric, role: 'owner', status: 'active', since: '2026-01-01T00:00:00Z' }], next_cursor: null } };
            if (c.method === 'POST') {
                if (state.invited.delete(id)) state.mine.add(id);
                else if (base[id]!.join_policy === 'approval') state.pending.add(id);
                else state.mine.add(id);
                return { status: 200, body: { status: state.mine.has(id) ? 'active' : 'pending' } };
            }
            if (c.method === 'DELETE') {
                if (opts.refuseLeave) return { status: 403, body: { type: 'urn:una:problem:forbidden', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'The owner cannot leave the group' } };
                state.mine.delete(id);
                state.pending.delete(id);
                state.invited.delete(id);
                return { status: 204 };
            }
        }
        // the site's More of a group: its Report (GET /profiles/{id}/actions, POST /profiles/{id}/report)
        m = /^\/profiles\/(\d+)\/(actions|report)$/.exec(c.path);
        if (m?.[1] && m[2] === 'actions' && c.method === 'GET') {
            const report: Schema<'ProfileAction'> = { name: 'report', title: 'Report', icon: 'flag', action: 'report', done: state.reported.has(m[1]), choices: [{ name: 'spam', title: 'spam' }, { name: 'other', title: 'other' }] };
            return { status: 200, body: [report] };
        }
        if (m?.[1] && m[2] === 'report' && c.method === 'POST') {
            state.reported.add(m[1]);
            return { status: 204 };
        }
        m = /^\/profiles\/(\d+)\/timeline$/.exec(c.path);
        if (m?.[1]) return { status: 200, body: { items: state.posts.filter((p) => p.object.context_id === m?.[1]), next_cursor: null } };
        if (c.method === 'POST' && c.path === '/feed-posts') {
            const body = c.body as Schema<'NewFeedPost'>;
            const created = post(String(100 + state.posts.length), 'New', body.context_id ?? null);
            state.posts.unshift(created);
            return { status: 201, body: created };
        }
        if (c.method === 'GET' && c.path === '/profiles/67') return { status: 200, body: { ...base['67'], about: '' } };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const text = await request.text();
            const c = { method: request.method, path: new URL(request.url).pathname.replace(/^\/api\/v2/, ''), body: text ? (JSON.parse(text) as unknown) : null };
            calls.push(c);
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return json(a.status, a.body);
        },
    });
    return { api, calls, state };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'explore', label: 'Explore', command: 'go-explore' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications' },
    { section: 'messages', label: 'Messages', command: 'go-messages' },
    { section: 'profile', label: 'Profile', command: 'go-profile' },
];

function Harness({ history, api }: { history: RouteHistory; api: UnaApi }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
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
                if (prop === 'offsetHeight' && this.tagName === 'ARTICLE') return 120;
                return 0;
            },
        });
    }
});
afterAll(() => {
    for (const [prop, descriptor] of sizes) if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
});

/** The group's page once it shows: the content pane (the list pane's place), not a detail beside a list. */
async function pageRegion(name: string): Promise<HTMLElement> {
    return waitFor(() => {
        const pane = screen.getAllByRole('region', { name }).find((r) => r.dataset.pane === 'list');
        if (!pane) throw new Error(`no page named ${name}`);
        return pane;
    });
}

afterEach(() => {
    cleanup();
    localStorage.clear();
    setDraftStore(null);
    vi.restoreAllMocks();
});

describe('group words and actions', () => {
    it('offers what the site allows, the main action first', () => {
        expect(membershipActions(group('1', 'A'))).toEqual(['join']);
        expect(membershipActions(group('1', 'A', { join_policy: 'approval' }))).toEqual(['ask']);
        expect(membershipActions(group('1', 'A', { viewer: viewer({ can_join: false, join_on_site: true }) }))).toEqual([]);
        expect(membershipActions(group('1', 'A', { viewer: viewer({ status: 'invited', can_leave: true }) }))).toEqual(['accept', 'decline']);
        expect(membershipActions(group('1', 'A', { viewer: viewer({ status: 'pending', can_join: false, can_leave: true }) }))).toEqual(['cancel']);
        expect(membershipActions(group('1', 'A', { viewer: member() }))).toEqual(['leave']);
        expect(membershipActions(group('1', 'A', { viewer: null }))).toEqual([]);
    });

    it('says what a group is and what happened', () => {
        expect(membersText(1)).toBe('1 member');
        expect(membersText(1200)).toBe(`${(1200).toLocaleString()} members`);
        expect(membershipText(member('owner'))).toBe('Owner');
        expect(membershipText(viewer({ status: 'pending' }))).toBe('Request sent');
        expect(membershipText(viewer())).toBe('');
        expect(actionAnnouncement('ask', 'Night Owls', 'pending')).toBe('Asked to join Night Owls. Its admins decide.');
        expect(actionAnnouncement('join', 'Design Circle', 'active')).toBe('You joined Design Circle');
        expect(actionAnnouncement('cancel', 'Night Owls')).toBe('Request to join Night Owls withdrawn');
    });

    it('posts only into groups the site lets the viewer post in', () => {
        const mine = [group('1', 'A', { viewer: member() }), group('2', 'B', { viewer: { ...member(), can_post: false } })];
        expect(postableGroups(mine).map((g) => g.id)).toEqual(['1']);
        expect(postableGroups(null)).toEqual([]);
    });
});

describe('group routes', () => {
    it('have one string form each', () => {
        expect(routeToPath(groupRoute('67'))).toBe('/groups?group=67');
        expect(parseRoute('/groups?group=67')).toEqual(groupRoute('67'));
        expect(routeToPath(groupRoute('67', 'members'))).toBe('/groups?group=67&tab=members');
        expect(parseRoute('/groups?group=67&tab=about')).toEqual(groupRoute('67', 'about'));
        expect(parseRoute('/groups')).toEqual(sectionRoute('groups'));
        // a group as a detail: a window of its own, or an older path and link, which the main window opens as the page
        expect(parseRoute('/home/group/67')).toEqual({ list: { section: 'home' }, detail: { kind: 'group', id: '67' } });
        expect(parseRoute('/home/group/67/members')).toEqual({ list: { section: 'home' }, detail: { kind: 'group', id: '67', tab: 'members' } });
        expect(pageRoute(parseRoute('/groups/group/67?group=67')!)).toEqual(groupRoute('67'));
        expect(pageRoute(parseRoute('/home/group/67/members')!)).toEqual(groupRoute('67', 'members'));
        expect(new RouteHistory(parseRoute('/notifications/group/67')!).snapshot().paths).toEqual(['/groups?group=67']);
        for (const bad of ['/groups?group=abc', '/groups?group=67&group=68', '/groups?feed=hot', '/groups?group=', '/groups/group/67/posts', '/groups?group=67&tab=posts', '/groups?tab=members&group=67', '/groups?group=67&tab=nope'])
            expect(parseRoute(bad), bad).toBeNull();
    });

    it('open a group link as a group', () => {
        expect(linkRoute({ kind: 'group', id: '13', item_id: null, thread_id: null })).toEqual({ kind: 'group', id: '13' });
    });
});

describe('groups in the window', () => {
    it('lists one’s groups in the sidebar, which open their feed and the group, and folds them away', async () => {
        const { api } = site();
        const { history } = renderApp(sectionRoute('home'), api);
        const list = await screen.findByRole('list', { name: 'Your groups' });
        fireEvent.click(within(list).getByRole('button', { name: 'UNA Network' }));
        expect(routeToPath(history.current)).toBe('/groups?group=13');
        expect(await pageRegion('UNA Network')).toBeTruthy();
        expect(within(list).getByRole('button', { name: 'UNA Network' }).getAttribute('aria-current')).toBe('page');
        expect(await screen.findByRole('feed', { name: 'UNA Network, posts' })).toBeTruthy();

        fireEvent.click(within(list).getByRole('button', { name: 'Browse groups' }));
        expect(routeToPath(history.current)).toBe('/groups');
        expect(await screen.findByRole('list', { name: 'Groups' })).toBeTruthy();

        const fold = screen.getByRole('button', { name: 'Groups', expanded: true });
        expect(fold.getAttribute('aria-controls')).toBe(SIDEBAR_GROUPS_LIST);
        fireEvent.click(fold);
        expect(screen.queryByRole('list', { name: 'Your groups' })).toBeNull();
        expect(localStorage.getItem('sidebar-groups-collapsed')).toBe('1');
    });

    it('is a page with Posts, Members and About tabs in the route, and a post opens beside it', async () => {
        const { api } = site();
        const { history } = renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        const tabs = await within(pane).findByRole('tablist', { name: 'UNA Network, group' });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Members', 'About']);
        expect(screen.queryByRole('separator', { name: 'Resize list' })).toBeNull();
        // nothing opens it on the site from the toolbar
        expect(within(pane).queryByRole('button', { name: /on site/i })).toBeNull();
        fireEvent.click(within(tabs).getByRole('tab', { name: 'About' }));
        expect(routeToPath(history.current)).toBe('/groups?group=13&tab=about');

        act(() => history.push({ list: history.current.list, detail: { kind: 'post', id: '5' } }));
        expect(routeToPath(history.current)).toBe('/groups/post/5?group=13&tab=about');
        expect(screen.getByRole('region', { name: 'Post' }).dataset.pane).toBe('detail');
        expect(await pageRegion('UNA Network')).toBeTruthy();
        expect(screen.getByRole('separator', { name: 'Resize list' })).toBeTruthy();
        // Back closes the post; the page and its tab stay
        act(() => void history.back());
        expect(routeToPath(history.current)).toBe('/groups?group=13&tab=about');
        expect(screen.queryByRole('region', { name: 'Post' })).toBeNull();
    });

    it('has no Groups on a site without the module', async () => {
        const { api, calls } = site({ groups: false });
        renderApp(sectionRoute('groups'), api);
        expect(await screen.findByText('This network has no groups.')).toBeTruthy();
        await waitFor(() => expect(calls.some((c) => c.path === '/me/groups')).toBe(true));
        expect(screen.queryByRole('list', { name: 'Your groups' })).toBeNull();
    });

    it('lists all the groups, or on the Yours tab the ones one is in, the tab in the route', async () => {
        const { api, calls } = site();
        const { history } = renderApp(sectionRoute('groups'), api);
        const tabs = await screen.findByRole('tablist', { name: 'Groups' });
        expect(within(tabs).getByRole('tab', { name: 'All' }).getAttribute('aria-selected')).toBe('true');
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Yours' }));
        expect(routeToPath(history.current)).toBe('/groups?feed=joined');
        const list = await screen.findByRole('list', { name: 'Groups' });
        await waitFor(() => expect(within(list).getAllByRole('listitem').map((li) => within(li).getAllByRole('button')[0]!.textContent)).toEqual(['UNA Network']));
        expect(calls.some((c) => c.path === '/me/groups')).toBe(true);
        expect(parseRoute('/groups?feed=joined')?.list).toEqual({ section: 'groups', feed: 'joined' });
    });

    it('joins an open group from the browse list, and it is in the sidebar', async () => {
        const { api, calls } = site();
        renderApp(sectionRoute('groups'), api);
        const browse = await screen.findByRole('list', { name: 'Groups' });
        const row = within(browse).getByRole('button', { name: 'Design Circle' }).closest('li')!;
        expect(within(row as HTMLElement).getByText('Public group · 3 members')).toBeTruthy();
        fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Join' }));
        expect(await screen.findByText('You joined Design Circle')).toBeTruthy();
        // an empty JoinRequest: the body is sent, v2 takes it
        expect(calls.find((c) => c.method === 'POST' && c.path === '/groups/67/membership')?.body).toEqual({});
        const sidebar = await screen.findByRole('list', { name: 'Your groups' });
        await waitFor(() => expect(within(sidebar).getByRole('button', { name: 'Design Circle' })).toBeTruthy());
    });

    it('asks to join a closed group, which shows only its name, and withdraws the request', async () => {
        const { api, calls } = site();
        renderApp({ list: { section: 'groups' }, detail: { kind: 'group', id: '68' } }, api);
        const pane = await screen.findByRole('region', { name: 'Night Owls' });
        await within(pane).findByText('3 members');
        expect(within(pane).getByText('Closed')).toBeTruthy();
        expect(within(pane).getByText('Only members see this group’s posts and members.')).toBeTruthy();
        expect(within(pane).queryByRole('heading', { name: 'Members' })).toBeNull();
        expect(within(pane).queryByRole('button', { name: 'Show posts' })).toBeNull();

        const ask = within(pane).getByRole('button', { name: 'Ask to join' });
        ask.focus();
        fireEvent.click(ask);
        expect(await screen.findByText('Asked to join Night Owls. Its admins decide.')).toBeTruthy();
        const cancel = await within(pane).findByRole('button', { name: 'Cancel request' });
        expect(document.activeElement).toBe(cancel);
        expect(within(pane).getByText('Request sent')).toBeTruthy();

        fireEvent.click(cancel);
        expect(await screen.findByText('Request to join Night Owls withdrawn')).toBeTruthy();
        expect(calls.filter((c) => c.path === '/groups/68/membership').map((c) => c.method)).toEqual(['POST', 'DELETE']);
        expect(await within(pane).findByRole('button', { name: 'Ask to join' })).toBeTruthy();
    });

    it('asks before leaving a group', async () => {
        const { api, calls } = site();
        renderApp({ list: { section: 'home' }, detail: { kind: 'group', id: '13' } }, api);
        const pane = await pageRegion('UNA Network');
        fireEvent.click(await within(pane).findByRole('tab', { name: 'Members' }));
        expect(await within(pane).findByRole('list', { name: 'Members' })).toBeTruthy();
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(within(pane).getByRole('button', { name: 'Leave group' }));
        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
        confirm.mockReturnValue(true);
        fireEvent.click(within(pane).getByRole('button', { name: 'Leave group' }));
        expect(await screen.findByText('You left UNA Network')).toBeTruthy();
        expect(await within(pane).findByRole('button', { name: 'Join' })).toBeTruthy();
    });

    it('posts into a group from its page, and the post is on top of its feed', async () => {
        const { api, calls } = site();
        renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        fireEvent.click(await within(pane).findByRole('button', { name: 'New post in group' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        const where = within(sheet).getByRole('combobox', { name: 'Post to' });
        await waitFor(() => expect(where).toHaveProperty('value', '13'));
        expect(
            within(where)
                .getAllByRole('option')
                .map((o) => o.textContent),
        ).toEqual(['Your timeline', 'UNA Network']);
        expect(within(sheet).getByRole('combobox', { name: 'Who can see it' })).toHaveProperty('disabled', true);
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'Hello group');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/feed-posts')?.body).toEqual({ context_id: '13', body_html: '<p>Hello group</p>' }));
        const feed = await screen.findByRole('feed', { name: 'UNA Network, posts' });
        await waitFor(() => expect(within(feed).getAllByRole('article')).toHaveLength(1));
    });

    it('says one left a secret group, which is then gone: no error, its posts and members forgotten', async () => {
        const { api, calls } = site({ secret: true });
        const { client } = renderApp(groupRoute('69'), api);
        const pane = await pageRegion('Hidden Garden');
        fireEvent.click(await within(pane).findByRole('tab', { name: 'Members' }));
        expect(await within(pane).findByRole('list', { name: 'Members' })).toBeTruthy();
        const sidebar = await screen.findByRole('list', { name: 'Your groups' });
        expect(within(sidebar).getByRole('button', { name: 'Hidden Garden' })).toBeTruthy();

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const leave = within(pane).getByRole('button', { name: 'Leave group' });
        leave.focus();
        fireEvent.click(leave);
        expect(await screen.findByText('You left Hidden Garden')).toBeTruthy();
        expect(await within(pane).findByText('This group isn’t available')).toBeTruthy();
        expect(within(pane).queryByRole('button', { name: /Join|Leave/ })).toBeNull();
        expect(within(pane).queryByRole('list', { name: 'Members' })).toBeNull();
        expect(within(pane).queryByText('The group was not found')).toBeNull();
        await waitFor(() => expect(within(sidebar).queryByRole('button', { name: 'Hidden Garden' })).toBeNull());
        expect(client.getQueryData(['group-members', '69'])).toBeUndefined();
        expect(client.getQueryData(['feed', 'profile', '69'])).toBeUndefined();
        expect(calls.filter((c) => c.path === '/groups/69/members').length).toBe(1);
        // focus is not left on the page: the pane's heading has it
        expect(document.activeElement).toBe(within(pane).getByRole('heading', { name: 'Hidden Garden' }));
    });

    it('keeps focus on a browse row after joining from it', async () => {
        const { api } = site();
        renderApp(sectionRoute('groups'), api);
        const browse = await screen.findByRole('list', { name: 'Groups' });
        const row = within(browse).getByRole('button', { name: 'Design Circle' }).closest('li') as HTMLElement;
        const join = within(row).getByRole('button', { name: 'Join' });
        join.focus();
        fireEvent.click(join);
        expect(await screen.findByText('You joined Design Circle')).toBeTruthy();
        const leave = await within(row).findByRole('button', { name: 'Leave group' });
        expect(document.activeElement).toBe(leave);
    });

    it('hands focus to what is left after declining an invitation', async () => {
        const { api, calls } = site({ invited: true });
        renderApp(groupRoute('70'), api);
        const pane = await pageRegion('Book Club');
        const decline = await within(pane).findByRole('button', { name: 'Decline' });
        expect(within(pane).getByText('Invited')).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Accept invitation' })).toBeTruthy();
        decline.focus();
        fireEvent.click(decline);
        expect(await screen.findByText('Invitation to Book Club declined')).toBeTruthy();
        expect(calls.some((c) => c.method === 'DELETE' && c.path === '/groups/70/membership')).toBe(true);
        // a secret group is gone once declined; nothing is left to focus but the heading
        await waitFor(() => expect(document.activeElement).toBe(within(pane).getByRole('heading', { name: 'Book Club' })));
    });

    it('sends a draft meant for a group one can no longer post in to one’s timeline, as the picker says', async () => {
        const { api, calls } = site();
        await draftStore().set(draftKey('https://community.example', '4', 'feed'), { text: 'For the old group', audience: 'public', contextId: '99' });
        renderApp(sectionRoute('home'), api);
        await screen.findByRole('list', { name: 'Your groups' });
        fireEvent.keyDown(document.body, { key: 'n', code: 'KeyN', ctrlKey: true });
        const sheet = await screen.findByRole('dialog', { name: 'New post' });
        const where = await within(sheet).findByRole('combobox', { name: 'Post to' });
        await waitFor(() => expect(richText(within(sheet).getByRole('textbox', { name: "What's new?" }))).toBe('For the old group'));
        await waitFor(() => expect(where).toHaveProperty('value', ''));
        expect(
            within(where)
                .getAllByRole('option')
                .map((o) => o.textContent),
        ).toEqual(['Your timeline', 'UNA Network']);
        await waitFor(() => expect(within(sheet).getByRole('status').textContent).toMatch(/not one you can post in now/));
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/feed-posts')?.body).toEqual({ audience: 'public', body_html: '<p>For the old group</p>' }));
    });

    it('shows its actions in the toolbar once the hero’s are under it, one copy at a time, icons only when the toolbar is narrow', async () => {
        const { api } = site();
        // where the hero's buttons are (under the toolbar once their bottom is above the body's top, 0),
        // how wide the toolbar is and how wide its buttons with labels would be
        let heroBottom = 100;
        let headWidth = 0;
        const real = Element.prototype.getBoundingClientRect;
        const rect = (width: number, top: number, bottom: number) => ({ width, height: bottom - top, top, bottom, left: 0, right: width, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            if (this.classList.contains('hero-actions')) return rect(200, heroBottom - 28, heroBottom);
            if (this.classList.contains('pane-hero-measure')) return rect(500, 0, 24);
            return real.call(this);
        });
        const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')!.get!;
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('pane-head') ? headWidth : (width.call(this) as number);
        });
        const scrollTo = (bottom: number) => {
            heroBottom = bottom;
            fireEvent.scroll(pane.querySelector('.pane-body')!);
        };

        renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        const head = pane.querySelector<HTMLElement>('.pane-head')!;
        const heroLeave = await within(pane).findByRole('button', { name: 'Leave group' });
        expect(within(head).queryByRole('button', { name: 'Leave group' })).toBeNull();

        // scrolled under the toolbar: the toolbar's copy, with labels, takes the focus; the hero's goes inert
        heroLeave.focus();
        act(() => scrollTo(-10));
        const leave = within(head).getByRole('button', { name: 'Leave group' });
        expect(leave.className).toBe('btn small');
        expect(within(head).getByRole('button', { name: 'New post in group' })).toBeTruthy();
        expect(pane.querySelector('.hero-actions')!.hasAttribute('inert')).toBe(true);
        expect(document.activeElement).toBe(leave);

        // back in view: the toolbar's copy goes, focus back on the hero's
        act(() => scrollTo(100));
        expect(within(head).queryByRole('button', { name: 'Leave group' })).toBeNull();
        expect(pane.querySelector('.hero-actions')!.hasAttribute('inert')).toBe(false);
        expect(document.activeElement).toBe(heroLeave);

        // a toolbar too narrow for the labels: icons, still named, and they do what the hero's do
        headWidth = 400;
        act(() => scrollTo(-10));
        const icon = within(head).getByRole('button', { name: 'Leave group' });
        expect(icon.classList.contains('tb-btn')).toBe(true);
        expect(icon.textContent?.trim()).toBe('');
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fireEvent.click(icon);
        expect(await screen.findByText('You left UNA Network')).toBeTruthy();
        expect(await within(head).findByRole('button', { name: 'Join' })).toBeTruthy();
        expect(
            Array.from(pane.querySelectorAll('.hero-actions button')).map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim()),
        ).toEqual(['Join', 'More for UNA Network']);
    });

    it('says what went wrong under the toolbar when an action pressed there fails, and under the hero once it is back in view', async () => {
        const { api } = site({ refuseLeave: true });
        let heroBottom = 100;
        const real = Element.prototype.getBoundingClientRect;
        const rect = (width: number, top: number, bottom: number) => ({ width, height: bottom - top, top, bottom, left: 0, right: width, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            if (this.classList.contains('hero-actions')) return rect(200, heroBottom - 28, heroBottom);
            if (this.classList.contains('pane-hero-measure')) return rect(300, 0, 24);
            return real.call(this);
        });
        renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        await within(pane).findByRole('button', { name: 'Leave group' });
        const scrollTo = (bottom: number) => {
            heroBottom = bottom;
            fireEvent.scroll(pane.querySelector('.pane-body')!);
        };
        act(() => scrollTo(-10));
        const head = pane.querySelector<HTMLElement>('.pane-head')!;
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fireEvent.click(within(head).getByRole('button', { name: 'Leave group' }));
        const alert = await within(pane).findByRole('alert');
        expect(alert.textContent).toMatch(/owner cannot leave/);
        // in the strip under the toolbar, in view, not under the scrolled-away hero
        expect(alert.closest('.pane-hero-errors')).toBeTruthy();
        act(() => scrollTo(100));
        expect(within(pane).getByRole('alert').closest('.hero-actions-box')).toBeTruthy();
        expect(pane.querySelector('.pane-hero-errors')).toBeNull();
    });

    it('opens a group found as a profile (a notification) as a group', async () => {
        const { api } = site();
        const { history } = renderApp({ list: { section: 'notifications' }, detail: { kind: 'profile', id: '67' } }, api);
        await waitFor(() => expect(routeToPath(history.current)).toBe('/groups?group=67'));
        expect(history.snapshot().paths).toEqual(['/groups?group=67']);
        expect(await screen.findByRole('region', { name: 'Design Circle' })).toBeTruthy();
    });
});

describe('a group’s page, its hero and its More', () => {
    const rect = (top: number, bottom: number, width = 200) => ({ width, height: bottom - top, top, bottom, left: 0, right: width, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;

    it('has no toolbar while its hero is in view, and a bar over the content once the hero’s name and actions are under it', async () => {
        const { api } = site();
        // where the hero's name and its buttons are; the body's top is 0, the bar over it 52px
        let nameBottom = 160;
        let actionsBottom = 170;
        const real = Element.prototype.getBoundingClientRect;
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            if (this.classList.contains('profile-name')) return rect(nameBottom - 30, nameBottom);
            if (this.classList.contains('hero-actions')) return rect(actionsBottom - 36, actionsBottom);
            if (this.classList.contains('pane-hero-measure')) return rect(0, 36, 300);
            return real.call(this);
        });
        const scrollTo = (name: number, actions: number) => {
            nameBottom = name;
            actionsBottom = actions;
            fireEvent.scroll(pane.querySelector('.pane-body')!);
        };

        renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        await within(pane).findByRole('button', { name: 'Leave group' });
        // the heading is there for screen readers and focus; the bar is not drawn, and holds nothing else
        const heading = within(pane).getByRole('heading', { name: 'UNA Network', level: 1 });
        const head = heading.closest<HTMLElement>('.pane-head')!;
        expect(head.classList.contains('pane-head-floating')).toBe(true);
        expect(head.hasAttribute('data-bar-hidden')).toBe(true);
        expect(within(head).queryAllByRole('button')).toEqual([]);
        // More is next to the hero's actions, after them
        const heroButtons = () => Array.from(pane.querySelectorAll('.hero-actions button')).map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim());
        expect(heroButtons()).toEqual(['Leave group', 'New post in group', 'More for UNA Network']);

        // the name under the bar: the bar comes, with the picture and the name, the hero's actions still in the hero
        act(() => scrollTo(40, 100));
        expect(head.hasAttribute('data-bar-hidden')).toBe(false);
        expect(head.hasAttribute('data-title-shown')).toBe(true);
        expect(head.hasAttribute('data-scrolled')).toBe(true);
        expect(heading.querySelector('.pane-title-picture .avatar')).toBeTruthy();
        expect(within(head).queryAllByRole('button')).toEqual([]);
        expect(pane.querySelector('.hero-actions')!.hasAttribute('inert')).toBe(false);

        // and the actions: in the bar, More with them; the hero's go inert
        act(() => scrollTo(20, 40));
        expect(within(head).getAllByRole('button').map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim())).toEqual(['Leave group', 'New post in group', 'More for UNA Network']);
        const more = within(head).getByRole('button', { name: 'More for UNA Network' });
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
        expect(pane.querySelector('.hero-actions')!.hasAttribute('inert')).toBe(true);

        // back in view: no bar, the same heading
        act(() => scrollTo(160, 170));
        expect(head.hasAttribute('data-bar-hidden')).toBe(true);
        expect(within(head).queryAllByRole('button')).toEqual([]);
        expect(within(pane).getByRole('heading', { name: 'UNA Network', level: 1 })).toBe(heading);
    });

    it('opens the site’s More next to the hero’s actions, and reports the group from it', async () => {
        const { api, calls } = site();
        renderApp(groupRoute('13'), api);
        const pane = await pageRegion('UNA Network');
        const more = await within(pane).findByRole('button', { name: 'More for UNA Network' });
        expect(more.classList.contains('btn-menu')).toBe(true);
        expect(more.getAttribute('aria-expanded')).toBe('false');
        await waitFor(() => expect(calls.some((c) => c.method === 'GET' && c.path === '/profiles/13/actions')).toBe(true));

        // the keyboard opens it too: the site's Report first, then the app's own
        more.focus();
        fireEvent.keyDown(more, { key: 'ArrowDown' });
        const menu = await screen.findByRole('menu');
        const names = within(menu)
            .getAllByRole('menuitem')
            .map((i) => i.textContent);
        expect(names[0]).toBe('Report…');
        expect(names).toContain('Copy Link');
        expect(more.getAttribute('aria-expanded')).toBe('true');

        fireEvent.click(within(menu).getByRole('menuitem', { name: 'Report…' }));
        const dialog = await screen.findByRole('dialog', { name: 'Report UNA Network' });
        const reasons = within(dialog).getByRole('group', { name: 'Reason' });
        expect(within(reasons).getAllByRole('radio').map((r) => r.closest('label')!.textContent)).toEqual(['Spam', 'Other']);
        // a reason first
        fireEvent.click(within(dialog).getByRole('button', { name: 'Report' }));
        expect(within(dialog).getByRole('alert').textContent).toMatch(/Choose why/);
        fireEvent.click(within(reasons).getByRole('radio', { name: 'Spam' }));
        fireEvent.change(within(dialog).getByRole('textbox', { name: /Note for the moderators/ }), { target: { value: ' Selling fake tickets ' } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Report' }));
        await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/profiles/13/report')?.body).toEqual({ type: 'spam', text: 'Selling fake tickets' }));
        expect(await screen.findByText(/Reported UNA Network/)).toBeTruthy();
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Report UNA Network' })).toBeNull());

        // reported: the item says so and does nothing more
        await waitFor(() => expect(calls.filter((c) => c.method === 'GET' && c.path === '/profiles/13/actions').length).toBe(2));
        fireEvent.click(within(pane).getByRole('button', { name: 'More for UNA Network' }));
        const again = await screen.findByRole('menu');
        expect(within(again).getAllByRole('menuitem')[0]!.textContent).toBe('Reported');
        expect(within(again).getAllByRole('menuitem')[0]!.getAttribute('aria-disabled')).toBe('true');
    });
});
