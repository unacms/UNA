import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { connectionsRoute, parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { SyncProvider } from '../../lib/sync-provider';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { rowMenuActions } from '../profile/connections-list';
import { connectionsTabs, tabSource } from './connections-page';

const person = (id: string, name: string, badges?: Schema<'Profile'>['badges']): Schema<'Profile'> => ({
    id,
    kind: 'person',
    module: 'bx_persons',
    display_name: name,
    status: 'active',
    about: '',
    created_at: '2026-01-01T00:00:00Z',
    ...(badges ? { badges } : {}),
});
const lily = person('4', 'Lily');
const mila = person('8', 'Mila', [{ id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' }]);
const tom = person('10', 'Tom');
const ana = person('12', 'Ana');
const since = '2026-11-01T00:00:00Z';

const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer | Promise<Answer>>;

function fakeApi(routes: Routes, calls: string[] = []): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            const type = status >= 400 ? 'application/problem+json' : 'application/json';
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } });
        },
    });
}

const page = (profiles: Schema<'Profile'>[]) => ({ status: 200, body: { items: profiles.map((profile) => ({ profile, since })), next_cursor: null } });

/** Lily's connections: Mila and Tom friends, Ana asking, Tom asked, Mila followed, Ana following her. */
function site(extra: Routes = {}, requests = 1) {
    const calls: string[] = [];
    const state = { friends: [mila, tom], requests: [ana], sent: [tom], following: [mila], followers: [ana] };
    const routes: Routes = {
        'GET /profiles/4/connections': () => ({ status: 200, body: { followers: 1, following: 1, friends: 2, viewer: null, lists: { followers: true, following: true, friends: true } } }),
        'GET /profiles/4/friends': () => page(state.friends),
        'GET /profiles/4/following': () => page(state.following),
        'GET /profiles/4/followers': () => page(state.followers),
        'GET /me/friend-requests': () => page(state.requests),
        'GET /me/friend-requests/sent': () => page(state.sent),
        'GET /sync': () => ({ status: 200, body: { cursor: 'c', changes: [], more: false, reset: false, badges: { notifications: 0, messages: 0, friend_requests: requests }, lists: {} } }),
        'GET /notifications': () => ({ status: 200, body: { items: [], next_cursor: null } }),
        'DELETE /profiles/10/friend': () => {
            state.sent = state.sent.filter((p) => p.id !== '10');
            state.friends = state.friends.filter((p) => p.id !== '10');
            return { status: 204 };
        },
        'DELETE /profiles/8/friend': () => {
            state.friends = state.friends.filter((p) => p.id !== '8');
            return { status: 204 };
        },
        'DELETE /profiles/8/follow': () => {
            state.following = state.following.filter((p) => p.id !== '8');
            return { status: 204 };
        },
        ...extra,
    };
    return { api: fakeApi(routes, calls), calls, state };
}

const items = (requests: number): NavItem[] => [
    { section: 'home', label: 'Home', command: 'go-home', icon: 'house' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications', icon: 'bell' },
    { section: 'profile', label: 'Profile', command: 'go-profile', icon: 'circle-user-round' },
    { section: 'connections', label: 'Connections', icon: 'users', badge: requests, spokenBadge: `, ${requests} friend requests waiting` },
];

function Harness({ history, api, requests, messageTo }: { history: RouteHistory; api: UnaApi; requests: number; messageTo: (p: Schema<'Profile'>) => void }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <SyncProvider api={api} announce={() => {}} onOpenNotification={() => {}}>
                    <Shell siteUrl="https://community.example" items={items(requests)} requests={requests} profile={lily} commands={commands} />
                </SyncProvider>
            </RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, requests = 1) {
    const history = new RouteHistory(route);
    const messageTo = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} requests={requests} messageTo={messageTo} />
        </QueryClientProvider>,
    );
    return { history, messageTo };
}

const pane = () => screen.getByRole('region', { name: 'Connections' });

afterEach(cleanup);

describe('Connections', () => {
    it('is a page of tabs: Friends first, Requests with how many wait', async () => {
        const { api } = site();
        const { history } = renderApp(connectionsRoute(), api);
        const tabs = within(pane()).getByRole('tablist', { name: 'Connections' });
        // the count comes with the sync
        await within(tabs).findByRole('tab', { name: 'Requests, 1 waiting' });
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Friends', 'Requests1, 1 waiting', 'Sent', 'Following', 'Followers', 'Suggestions']);
        expect(within(tabs).getByRole('tab', { name: 'Friends' }).getAttribute('aria-selected')).toBe('true');
        expect(within(tabs).getByRole('tab', { name: 'Requests, 1 waiting' })).toBeTruthy();
        const list = await within(pane()).findByRole('list', { name: 'Your friends, newest friendship first' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        // badges after the name
        expect(within(list).getByText('Moderator')).toBeTruthy();

        fireEvent.click(within(tabs).getByRole('tab', { name: 'Followers' }));
        expect(routeToPath(history.current)).toBe('/connections?tab=followers');
        expect(await within(pane()).findByRole('list', { name: 'People who follow you, newest first' })).toBeTruthy();
        // Back goes to the tab before
        history.back();
        expect(routeToPath(history.current)).toBe('/connections');
    });

    it('cancels a sent request, taking it off the list', async () => {
        const { api, calls } = site();
        renderApp(connectionsRoute('sent'), api);
        const list = await within(pane()).findByRole('list', { name: 'Friend requests you sent, newest first' });
        const cancel = within(list).getByRole('button', { name: 'Cancel request to Tom' });
        fireEvent.click(cancel);
        await waitFor(() => expect(within(pane()).queryByRole('button', { name: 'Cancel request to Tom' })).toBeNull());
        expect(calls).toContain('DELETE /profiles/10/friend');
        expect(screen.getByText('Friend request to Tom cancelled')).toBeTruthy();
        expect(await within(pane()).findByText('No requests waiting')).toBeTruthy();
    });

    it('ends a friendship from the row’s menu, after asking', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { api, calls } = site();
        renderApp(connectionsRoute(), api);
        const list = await within(pane()).findByRole('list', { name: 'Your friends, newest friendship first' });
        fireEvent.click(within(list).getByRole('button', { name: 'More for Mila' }));
        const menu = await screen.findByRole('menu');
        expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Send Message', 'Remove friend']);
        fireEvent.click(within(menu).getByRole('menuitem', { name: 'Remove friend' }));
        await waitFor(() => expect(calls).toContain('DELETE /profiles/8/friend'));
        expect(confirm).toHaveBeenCalled();
        await waitFor(() => expect(within(list).queryByText('Mila')).toBeNull());
        confirm.mockRestore();
    });

    it('opens a person’s profile page in the content pane', async () => {
        const { api } = site();
        const { history } = renderApp(connectionsRoute('following'), api);
        const list = await within(pane()).findByRole('list', { name: 'People you follow, newest first' });
        fireEvent.click(within(list).getByRole('button', { name: 'Mila' }));
        expect(routeToPath(history.current)).toBe('/profile?id=8');
        expect(history.current.detail).toBeNull();
        history.back();
        expect(routeToPath(history.current)).toBe('/connections?tab=following');
    });

    it('moves between the rows with the arrow keys', async () => {
        const { api } = site();
        renderApp(connectionsRoute(), api);
        const list = await within(pane()).findByRole('list', { name: 'Your friends, newest friendship first' });
        const first = within(list).getByRole('button', { name: 'Mila' });
        first.focus();
        fireEvent.keyDown(first, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(within(list).getByRole('button', { name: 'Tom' }));
        fireEvent.keyDown(document.activeElement!, { key: 'Home' });
        expect(document.activeElement).toBe(first);
    });

    it('says what each row’s menu ends', () => {
        expect(rowMenuActions({ kind: 'list', profileId: '4', list: 'friends' })).toEqual(['unfriend']);
        expect(rowMenuActions({ kind: 'list', profileId: '4', list: 'following' })).toEqual(['unfollow']);
        expect(rowMenuActions({ kind: 'list', profileId: '4', list: 'followers' })).toEqual([]);
        expect(rowMenuActions({ kind: 'requests' })).toEqual([]);
        expect(rowMenuActions({ kind: 'suggested', friends: true })).toEqual([]);
        expect(connectionsTabs(false)).toEqual(['following', 'followers', 'suggested']);
        expect(connectionsTabs(undefined)).toEqual(['friends', 'requests', 'sent', 'following', 'followers', 'suggested']);
    });
});

const suggestions = (profiles: Schema<'Profile'>[], next: string | null = null) => ({ status: 200, body: { items: profiles.map((profile, i) => ({ profile, score: 10 - i })), next_cursor: next } });

describe('Connections’ Suggestions', () => {
    it('is a tab of its own, written into the path, and back', () => {
        const route = connectionsRoute('suggested');
        expect(routeToPath(route)).toBe('/connections?tab=suggested');
        expect(parseRoute('/connections?tab=suggested')).toEqual(route);
        expect(tabSource('suggested', '4', true)).toEqual({ kind: 'suggested', friends: true });
        expect(tabSource('suggested', '4', undefined)).toEqual({ kind: 'suggested', friends: true });
        expect(tabSource('suggested', '4', false)).toEqual({ kind: 'suggested', friends: false });
        expect(tabSource('requests', '4', true)).toEqual({ kind: 'requests' });
        expect(tabSource('following', '4', true)).toEqual({ kind: 'list', profileId: '4', list: 'following' });
    });

    it('lists people one may know, page by page, with no date under the name', async () => {
        const later = person('14', 'Zoe');
        const { api, calls } = site({
            'GET /me/recommendations/friends': (request) => (new URL(request.url).searchParams.get('cursor') === 'p2' ? suggestions([later, tom]) : suggestions([tom, ana], 'p2')),
        });
        renderApp(connectionsRoute('suggested'), api);
        const list = await within(pane()).findByRole('list', { name: 'People you may know, best match first' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        expect(list.querySelector('time')).toBeNull();
        fireEvent.click(within(pane()).getByRole('button', { name: 'Load more' }));
        // Tom on both pages shows once
        await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(3));
        expect(within(list).getByRole('button', { name: 'Zoe' })).toBeTruthy();
        expect(calls).not.toContain('GET /me/recommendations/follows');
    });

    it('asks to be friends from the row, keeping the row and the focus', async () => {
        // the site leaves Tom out once asked: the row stays until the list is next read
        let asked = false;
        const { api, calls } = site({
            'GET /me/recommendations/friends': () => suggestions(asked ? [ana] : [tom, ana]),
            'POST /profiles/10/friend': () => {
                asked = true;
                return { status: 200, body: { status: 'requested' } };
            },
        });
        renderApp(connectionsRoute('suggested'), api);
        const list = await within(pane()).findByRole('list', { name: 'People you may know, best match first' });
        const add = within(list).getByRole('button', { name: 'Add friend, Tom' });
        add.focus();
        fireEvent.click(add);
        await within(list).findByRole('button', { name: 'Requested, Tom' });
        expect(calls).toContain('POST /profiles/10/friend');
        // the graph's refresh has run (the page's own counts are read again) and still the row is there
        await waitFor(() => expect(calls.filter((c) => c === 'GET /profiles/4/connections').length).toBeGreaterThan(1));
        expect(calls.filter((c) => c === 'GET /me/recommendations/friends')).toHaveLength(1);
        expect(document.activeElement).toBe(within(list).getByRole('button', { name: 'Requested, Tom' }));
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        // pressed again, it asks nothing more
        fireEvent.click(within(list).getByRole('button', { name: 'Requested, Tom' }));
        expect(calls.filter((c) => c === 'POST /profiles/10/friend')).toHaveLength(1);
    });

    it('says why the site refused, under the row', async () => {
        const { api } = site({
            'GET /me/recommendations/friends': () => suggestions([tom]),
            'POST /profiles/10/friend': () => ({ status: 403, body: { type: 'urn:una:problem:forbidden', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'Tom takes no friend requests' } }),
        });
        renderApp(connectionsRoute('suggested'), api);
        const list = await within(pane()).findByRole('list', { name: 'People you may know, best match first' });
        fireEvent.click(within(list).getByRole('button', { name: 'Add friend, Tom' }));
        const alert = await within(list).findByRole('alert');
        expect(alert.textContent).toBe('Tom takes no friend requests');
        // under the name, not among the row's buttons
        expect(alert.closest('.list-main')).toBeTruthy();
        expect(within(list).getByRole('button', { name: 'Add friend, Tom' })).toBeTruthy();
    });

    it('offers profiles to follow where the profile can’t have friends', async () => {
        const { api, calls } = site({
            'GET /profiles/4/connections': () => ({ status: 200, body: { followers: 0, following: 0, friends: 0, viewer: null, lists: { followers: true, following: true, friends: false } } }),
            'GET /me/recommendations/follows': () => suggestions([mila]),
            'POST /profiles/8/follow': () => ({ status: 204 }),
        });
        renderApp(connectionsRoute('suggested'), api);
        const tabs = within(pane()).getByRole('tablist', { name: 'Connections' });
        await waitFor(() => expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Following', 'Followers', 'Suggestions']));
        const list = await within(pane()).findByRole('list', { name: 'Profiles you may want to follow, best match first' });
        fireEvent.click(within(list).getByRole('button', { name: 'Follow, Mila' }));
        await within(list).findByRole('button', { name: 'Following, Mila' });
        expect(calls).toContain('POST /profiles/8/follow');
        expect(calls).not.toContain('GET /me/recommendations/friends');
    });

    it('reads the list again from the start before the next page, once a request was made', async () => {
        const zoe = person('14', 'Zoe');
        let asked = false;
        const reads: string[] = [];
        const { api } = site({
            'GET /me/recommendations/friends': (request) => {
                const cursor = new URL(request.url).searchParams.get('cursor');
                reads.push(cursor ?? 'start');
                // once Tom is asked, the site's list moves up a place: Zoe would be skipped from the old cursor
                if (asked) return cursor === 'p2' ? suggestions([]) : suggestions([ana, zoe], 'p2');
                return cursor === 'p2' ? suggestions([]) : suggestions([tom, ana], 'p2');
            },
            'POST /profiles/10/friend': () => {
                asked = true;
                return { status: 200, body: { status: 'requested' } };
            },
        });
        renderApp(connectionsRoute('suggested'), api);
        const list = await within(pane()).findByRole('list', { name: 'People you may know, best match first' });
        fireEvent.click(within(list).getByRole('button', { name: 'Add friend, Tom' }));
        await within(list).findByRole('button', { name: 'Requested, Tom' });
        fireEvent.click(within(pane()).getByRole('button', { name: 'Load more' }));
        expect(await within(list).findByRole('button', { name: 'Zoe' })).toBeTruthy();
        expect(reads).toEqual(['start', 'start', 'p2']);
    });

    it('says when there is nobody to suggest', async () => {
        const { api } = site({ 'GET /me/recommendations/friends': () => suggestions([]) });
        renderApp(connectionsRoute('suggested'), api);
        expect(await within(pane()).findByText('No suggestions right now')).toBeTruthy();
        expect(within(pane()).getByText('People with friends in common, in your groups or nearby show up here.')).toBeTruthy();
    });
});

describe('The sidebar', () => {
    const sidebar = () => screen.getByRole('navigation', { name: 'Sections' });

    it('takes Connections into the content pane, closing what was open beside another list', async () => {
        const { api } = site();
        // the notifications, with a post open beside them
        const { history } = renderApp({ list: { section: 'notifications' }, detail: { kind: 'post', id: '12' } }, api);
        fireEvent.click(within(sidebar()).getByRole('button', { name: 'Connections, 1 friend requests waiting' }));
        // requests wait: the Requests tab, nothing beside it, the notifications gone
        expect(routeToPath(history.current)).toBe('/connections?tab=requests');
        expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
        expect(await within(pane()).findByRole('button', { name: 'Accept Ana' })).toBeTruthy();
        expect(within(sidebar()).getByRole('button', { name: /^Connections/ }).getAttribute('aria-current')).toBe('page');
        // inside Connections it keeps the tab
        fireEvent.click(within(pane()).getByRole('tab', { name: 'Sent' }));
        fireEvent.click(within(sidebar()).getByRole('button', { name: /^Connections/ }));
        expect(routeToPath(history.current)).toBe('/connections?tab=sent');
    });

    it('opens Connections at Friends when no request waits', () => {
        const { api } = site({}, 0);
        const { history } = renderApp(sectionRoute('home'), api, 0);
        fireEvent.click(within(sidebar()).getByRole('button', { name: 'Connections' }));
        expect(routeToPath(history.current)).toBe('/connections');
    });

    it('never leaves a detail open beside the section a row shows', () => {
        const { api } = site();
        const { history } = renderApp({ list: { section: 'home' }, detail: { kind: 'post', id: '12' } }, api);
        for (const name of ['Home', 'Notifications', /^Connections/, 'Profile']) {
            history.push({ list: { section: 'explore' }, detail: { kind: 'post', id: '12' } });
            fireEvent.click(within(sidebar()).getByRole('button', { name }));
            expect(history.current.detail, String(name)).toBeNull();
        }
    });

    it('takes an older friend requests link to Connections’ Requests tab', async () => {
        const { api } = site();
        renderApp(parseRoute('/notifications/friend-requests')!, api);
        expect(await within(pane()).findByRole('button', { name: 'Accept Ana' })).toBeTruthy();
        expect(within(pane()).getByRole('tab', { name: 'Requests, 1 waiting' }).getAttribute('aria-selected')).toBe('true');
    });
});
