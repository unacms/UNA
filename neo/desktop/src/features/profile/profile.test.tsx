import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { SyncProvider } from '../../lib/sync-provider';
import { connectionsRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import type { Relation } from './graph';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const mila: Schema<'Profile'> = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const tom: Schema<'Profile'> = { id: '10', kind: 'person', module: 'bx_persons', display_name: 'Tom', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ ...lily, about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

const full = (p: Schema<'Profile'>): Schema<'Profile'> => ({ ...p, handle: p.display_name.toLowerCase(), about: `About ${p.display_name}`, created_at: '2026-01-01T00:00:00Z' });

const none: Relation = {
    following: false,
    followed_by: false,
    friends: false,
    request_sent: false,
    request_received: false,
    blocking: false,
    muting: false,
    can_follow: true,
    can_befriend: true,
};

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

/** A site with one profile (Mila) whose relation to the viewer changes as the requests say. */
function site(relation: Relation, extra: Routes = {}) {
    const state = { relation, followers: 1, friends: 0 };
    const calls: string[] = [];
    const routes: Routes = {
        'GET /profiles/8': () => ({ status: 200, body: full(mila) }),
        'GET /profiles/8/connections': () => ({
            status: 200,
            body: { followers: state.followers, following: 0, friends: state.friends, viewer: state.relation, lists: { followers: false, following: false, friends: true } },
        }),
        'POST /profiles/8/follow': () => {
            state.relation = { ...state.relation, following: true, can_follow: false };
            state.followers++;
            return { status: 204 };
        },
        'DELETE /profiles/8/follow': () => {
            state.relation = { ...state.relation, following: false, can_follow: true };
            state.followers--;
            return { status: 204 };
        },
        'POST /profiles/8/friend': () => {
            const accepting = state.relation.request_received;
            state.relation = accepting
                ? { ...state.relation, friends: true, request_received: false, following: true, followed_by: true, can_follow: false, can_befriend: false }
                : { ...state.relation, request_sent: true, can_befriend: false };
            if (accepting) state.friends++;
            return { status: 200, body: { status: accepting ? 'friends' : 'requested' } };
        },
        'DELETE /profiles/8/friend': () => {
            state.relation = { ...none };
            return { status: 204 };
        },
        ...extra,
    };
    return { api: fakeApi(routes, calls), calls, state };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'explore', label: 'Explore', command: 'go-explore' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications' },
    { section: 'messages', label: 'Messages', command: 'go-messages' },
    { section: 'profile', label: 'Profile', command: 'go-profile' },
];

function Harness({ history, api, messageTo }: { history: RouteHistory; api: UnaApi; messageTo: (p: Schema<'Profile'>) => void }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <SyncProvider api={api} announce={() => {}} onOpenNotification={() => {}}>
                    <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />
                </SyncProvider>
            </RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, messageTo = vi.fn()) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} messageTo={messageTo} />
        </QueryClientProvider>,
    );
    return { history, messageTo };
}

const milaRoute: Route = { list: { section: 'home' }, detail: { kind: 'profile', id: '8' } };
const detail = () => screen.getByRole('region', { name: 'Mila' });
/** The profile's pane once the profile came (its heading is the name). */
const loaded = () => screen.findByRole('region', { name: 'Mila' });

function activity(id: string, author: Schema<'Profile'>, over: Partial<Schema<'Item'>['viewer']> = {}): Schema<'Activity'> {
    return {
        id,
        verb: 'posted',
        actor: author,
        object: {
            id: `c${id}`,
            kind: 'feed_post',
            module: 'bx_timeline',
            author,
            anonymous: false,
            audience: 'public',
            card: { text: `Post ${id}` },
            media: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-01T00:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_delete: false, ...over },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-01T00:00:00Z',
    } as unknown as Schema<'Activity'>;
}

// jsdom lays nothing out: give the pane's scroller a viewport and each post a height
const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 600 : 800;
                if (prop === 'offsetHeight' && this.classList.contains('feed-row')) return 200;
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
    vi.restoreAllMocks();
});

describe('A profile’s page', () => {
    it('shows the profile, its counts and the relation buttons', async () => {
        const { api } = site({ ...none, followed_by: true });
        renderApp(milaRoute, api);
        const pane = await loaded();
        // a page in the content pane, not a detail beside a list
        expect(pane.dataset.pane).toBe('list');
        expect(await within(pane).findByText('@mila')).toBeTruthy();
        expect(await within(pane).findByText('Follows you')).toBeTruthy();
        expect(within(pane).getByText('1 follower')).toBeTruthy();
        expect(within(pane).getByRole('button', { name: '0 friends' })).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Follow Mila' })).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Add friend Mila' })).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Message Mila' })).toBeTruthy();
        // only lists the viewer may open are tabs
        const tabs = within(pane).getByRole('tablist');
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Friends', 'About']);
        // what it says about itself is its About tab
        expect(within(pane).queryByText('About Mila')).toBeNull();
        fireEvent.click(within(tabs).getByRole('tab', { name: 'About' }));
        expect(await within(pane).findByText('About Mila')).toBeTruthy();
        // nothing opens it on the site
        expect(within(pane).queryByRole('button', { name: /on site/i })).toBeNull();
    });

    it('follows and unfollows, keeping focus on the button and saying what happened', async () => {
        const { api, calls } = site(none);
        renderApp(milaRoute, api);
        const button = await within(await loaded()).findByRole('button', { name: 'Follow Mila' });
        button.focus();
        fireEvent.click(button);
        await waitFor(() => expect(button.textContent).toBe('Unfollow'));
        expect(calls).toContain('POST /profiles/8/follow');
        expect(document.activeElement).toBe(button);
        expect(screen.getByText('You follow Mila now')).toBeTruthy();
        await waitFor(() => expect(within(detail()).getByText('2 followers')).toBeTruthy());

        fireEvent.click(button);
        await waitFor(() => expect(button.textContent).toBe('Follow'));
        expect(calls).toContain('DELETE /profiles/8/follow');
        expect(screen.getByText('You no longer follow Mila')).toBeTruthy();
    });

    it('accepts a friend request, and asks before removing a friend', async () => {
        const { api, calls } = site({ ...none, request_received: true });
        renderApp(milaRoute, api);
        const pane = await loaded();
        expect(await within(pane).findByText('Wants to be your friend')).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Decline Mila' })).toBeTruthy();
        fireEvent.click(within(pane).getByRole('button', { name: 'Accept Mila' }));
        expect(await within(pane).findByRole('button', { name: 'Remove friend Mila' })).toBeTruthy();
        expect(screen.getByText('You and Mila are friends')).toBeTruthy();
        expect(within(pane).getByRole('button', { name: 'Unfollow Mila' })).toBeTruthy();

        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(within(pane).getByRole('button', { name: 'Remove friend Mila' }));
        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        expect(calls).not.toContain('DELETE /profiles/8/friend');

        confirm.mockReturnValue(true);
        fireEvent.click(within(pane).getByRole('button', { name: 'Remove friend Mila' }));
        expect(await within(pane).findByRole('button', { name: 'Add friend Mila' })).toBeTruthy();
        expect(calls).toContain('DELETE /profiles/8/friend');
        expect(within(pane).getByRole('button', { name: 'Follow Mila' })).toBeTruthy();
    });

    it('declines a request on the profile, and focus stays among the buttons', async () => {
        const { api, calls } = site({ ...none, request_received: true });
        renderApp(milaRoute, api);
        const decline = await within(await loaded()).findByRole('button', { name: 'Decline Mila' });
        decline.focus();
        fireEvent.click(decline);
        expect(await within(detail()).findByRole('button', { name: 'Add friend Mila' })).toBeTruthy();
        expect(calls).toContain('DELETE /profiles/8/friend');
        expect(screen.getByText('Friend request from Mila declined')).toBeTruthy();
        expect(document.activeElement).toBe(within(detail()).getByRole('button', { name: 'Follow Mila' }));
    });

    it('sends and cancels a friend request', async () => {
        const { api } = site(none);
        renderApp(milaRoute, api);
        fireEvent.click(await within(await loaded()).findByRole('button', { name: 'Add friend Mila' }));
        expect(await within(detail()).findByRole('button', { name: 'Cancel request Mila' })).toBeTruthy();
        expect(screen.getByText('Friend request sent to Mila')).toBeTruthy();
        fireEvent.click(within(detail()).getByRole('button', { name: 'Cancel request Mila' }));
        expect(await within(detail()).findByRole('button', { name: 'Add friend Mila' })).toBeTruthy();
    });

    it('shows why the site refused, and opens a new message with Message', async () => {
        const { api } = site(none, { 'POST /profiles/8/follow': () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'Your membership can’t do this' } }) });
        const { messageTo } = renderApp(milaRoute, api);
        const button = await within(await loaded()).findByRole('button', { name: 'Follow Mila' });
        fireEvent.click(button);
        expect((await within(detail()).findByRole('alert')).textContent).toContain('Your membership can’t do this');
        expect(button.textContent).toBe('Follow');
        fireEvent.click(within(detail()).getByRole('button', { name: 'Message Mila' }));
        expect(messageTo).toHaveBeenCalledWith(expect.objectContaining({ id: '8' }));
    });

    it('lists friends in a tab kept in the route', async () => {
        const { api } = site(none, { 'GET /profiles/8/friends': () => ({ status: 200, body: { items: [{ profile: tom, since: '2026-10-01T00:00:00Z' }], next_cursor: null } }) });
        const { history } = renderApp(milaRoute, api);
        const tab = await within(await loaded()).findByRole('tab', { name: 'Friends' });
        fireEvent.click(tab);
        expect(routeToPath(history.current)).toBe('/profile?id=8&tab=friends');
        expect(tab.getAttribute('aria-selected')).toBe('true');
        const list = await within(detail()).findByRole('list', { name: 'Mila’s friends' });
        // a name opens that profile
        fireEvent.click(within(list).getByRole('button', { name: 'Tom' }));
        expect(routeToPath(history.current)).toBe('/profile?id=10');
    });

    it('a tab in the route waits for the connections instead of drawing the posts first', async () => {
        let answer: (a: Answer) => void = () => {};
        const { api, calls } = site(none, {
            'GET /profiles/8/connections': () => new Promise<Answer>((resolve) => (answer = resolve)),
            'GET /profiles/8/friends': () => ({ status: 200, body: { items: [{ profile: tom, since: '2026-10-01T00:00:00Z' }], next_cursor: null } }),
        });
        renderApp({ list: { section: 'home' }, detail: { kind: 'profile', id: '8', tab: 'friends' } }, api);
        expect(await within(await loaded()).findByText('Loading friends…')).toBeTruthy();
        expect(calls).not.toContain('GET /profiles/8/timeline');
        await act(async () =>
            answer({ status: 200, body: { followers: 0, following: 0, friends: 1, viewer: none, lists: { followers: false, following: false, friends: true } } }),
        );
        expect(await within(detail()).findByRole('list', { name: 'Mila’s friends' })).toBeTruthy();
        expect(calls).not.toContain('GET /profiles/8/timeline');
    });

    it('says so when the tab in the route is not one the viewer may open', async () => {
        const { api } = site(none);
        renderApp({ list: { section: 'home' }, detail: { kind: 'profile', id: '8', tab: 'following' } }, api);
        expect(await within(await loaded()).findByText('Following isn’t shown for this profile; showing the posts.')).toBeTruthy();
    });

    it('says when the profile can’t be seen', async () => {
        const api = fakeApi({ 'GET /profiles/8': () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden' } }) });
        renderApp(milaRoute, api);
        expect(await screen.findByText('You can’t see this profile')).toBeTruthy();
    });
});

describe('Friend requests', () => {
    it('accepts and declines, moving focus to the next request', async () => {
        let requests = [
            { profile: mila, since: '2026-11-01T00:00:00Z' },
            { profile: tom, since: '2026-10-30T00:00:00Z' },
        ];
        const answer = (id: string, a: Answer) => {
            requests = requests.filter((r) => r.profile.id !== id);
            return a;
        };
        const calls: string[] = [];
        const api = fakeApi(
            {
                'GET /me/friend-requests': () => ({ status: 200, body: { items: requests, next_cursor: null } }),
                'POST /profiles/8/friend': () => answer('8', { status: 200, body: { status: 'friends' } }),
                'DELETE /profiles/10/friend': () => answer('10', { status: 204 }),
            },
            calls,
        );
        renderApp(connectionsRoute('requests'), api);
        const pane = screen.getByRole('region', { name: 'Connections' });
        const accept = await within(pane).findByRole('button', { name: 'Accept Mila' });
        accept.focus();
        fireEvent.click(accept);
        await waitFor(() => expect(within(pane).queryByRole('button', { name: 'Accept Mila' })).toBeNull());
        expect(calls).toContain('POST /profiles/8/friend');
        expect(screen.getByText('You and Mila are friends')).toBeTruthy();
        expect(document.activeElement).toBe(within(pane).getByRole('button', { name: 'Accept Tom' }));

        fireEvent.click(within(pane).getByRole('button', { name: 'Decline Tom' }));
        await waitFor(() => expect(within(pane).queryByRole('button', { name: 'Decline Tom' })).toBeNull());
        expect(calls).toContain('DELETE /profiles/10/friend');
        // none left: the pane's heading
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Connections', level: 1 }));
    });

    it('opens from Notifications, with how many wait (the sync’s count)', async () => {
        const api = fakeApi({
            'GET /me/friend-requests': () => ({ status: 200, body: { items: [{ profile: mila, since: '2026-11-01T00:00:00Z' }], next_cursor: null } }),
            'GET /sync': () => ({ status: 200, body: { cursor: 'c', changes: [], more: false, reset: false, badges: { notifications: 3, friend_requests: 1 }, lists: {} } }),
        });
        const { history } = renderApp(sectionRoute('notifications'), api);
        const list = screen.getByRole('region', { name: 'Notifications' });
        // a row above the notifications, not one of them: outside the feed
        const button = await within(list).findByRole('button', { name: 'Review friend requests, 1 waiting' });
        expect(button.closest('[role="feed"]')).toBeNull();
        expect(within(list).getByText('1 friend request')).toBeTruthy();
        // the toolbar says how many are unread, from the same sync
        expect(within(list).getByText('3 unread')).toBeTruthy();
        fireEvent.click(button);
        // Connections' Requests tab in the content pane: the notifications do not stay beside it
        expect(routeToPath(history.current)).toBe('/connections?tab=requests');
        expect(await screen.findByRole('region', { name: 'Connections' })).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull();
    });
});

describe('One’s own profile page', () => {
    it('is the Profile section, with Edit profile opening beside it', async () => {
        const { api } = site(none, {
            'GET /profiles/4': () => ({ status: 200, body: { ...me.profiles[0], url: 'https://community.example/u/lily' } }),
            'GET /profiles/4/connections': () => ({ status: 200, body: { followers: 2, following: 1, friends: 0, viewer: null, lists: { followers: true, following: true, friends: false } } }),
        });
        const { history } = renderApp(sectionRoute('profile'), api);
        const pane = await screen.findByRole('region', { name: 'Lily' });
        expect(pane.dataset.pane).toBe('list');
        const tabs = await within(pane).findByRole('tablist');
        expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Posts', 'Followers', 'Following', 'About']);
        // its tabs keep naming no profile: the acting one's
        fireEvent.click(within(tabs).getByRole('tab', { name: 'Followers' }));
        expect(routeToPath(history.current)).toBe('/profile?tab=followers');
        fireEvent.click(within(pane).getByRole('button', { name: 'Edit profile' }));
        expect(routeToPath(history.current)).toBe('/profile/edit-profile/4?tab=followers');
        expect(within(pane).queryByRole('button', { name: /on site/i })).toBeNull();
    });

    it('has More next to its actions, not in a toolbar: the site’s items (its Edit Profile is the hero’s) and the app’s', async () => {
        const { api } = site(none, {
            'GET /profiles/4': () => ({ status: 200, body: { ...me.profiles[0], url: 'https://community.example/u/lily' } }),
            'GET /profiles/4/connections': () => ({ status: 200, body: { followers: 2, following: 1, friends: 0, viewer: null, lists: { followers: true, following: true, friends: false } } }),
            'GET /profiles/4/actions': () => ({ status: 200, body: [{ name: 'edit-persons-profile', title: 'Edit Profile', icon: 'pencil-line', action: 'edit', done: false, choices: null }] }),
        });
        renderApp(sectionRoute('profile'), api);
        const pane = await screen.findByRole('region', { name: 'Lily' });
        const more = await within(pane).findByRole('button', { name: 'More for Lily' });
        expect(more.closest('.hero-actions')).toBeTruthy();
        expect(Array.from(pane.querySelectorAll('.hero-actions button')).map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim())).toEqual(['Edit profile', 'Friend requests', 'More for Lily']);
        // no toolbar drawn over the cover, no More in it
        const head = pane.querySelector('.pane-head')!;
        expect(head.hasAttribute('data-bar-hidden')).toBe(true);
        expect(within(head as HTMLElement).queryAllByRole('button')).toEqual([]);
        fireEvent.click(more);
        const menu = await screen.findByRole('menu');
        const names = within(menu)
            .getAllByRole('menuitem')
            .map((i) => i.textContent);
        expect(names).toContain('Copy Link');
        expect(names).not.toContain('Edit Profile');
    });
});

describe('Authors open their profile', () => {
    const feed = (author: Schema<'Profile'>, over?: Partial<Schema<'Item'>['viewer']>) => ({
        'GET /feeds/home': () => ({ status: 200, body: { items: [activity('1', author, over)], next_cursor: null } }),
    });

    it('from the name on a post, and with p on the focused post', async () => {
        const { api } = site(none, feed(mila));
        const { history } = renderApp(sectionRoute('home'), api);
        const post = await screen.findByRole('article');
        fireEvent.click(within(post).getByRole('button', { name: 'Mila' }));
        expect(routeToPath(history.current)).toBe('/profile?id=8');
        // the name it was opened from shows at once, as the page's heading
        expect(screen.getByRole('heading', { name: 'Mila', level: 1 })).toBeTruthy();

        // the page took the content pane: Home's feed is drawn again
        act(() => history.push(sectionRoute('home')));
        const again = await screen.findByRole('article');
        again.focus();
        act(() => void fireEvent.keyDown(again, { key: 'p', code: 'KeyP' }));
        expect(routeToPath(history.current)).toBe('/profile?id=8');
    });

    it('c on a post opens it with the comment box focused', async () => {
        const { api } = site(none, feed(mila, { can_comment: true }));
        const { history } = renderApp(sectionRoute('home'), api);
        const post = await screen.findByRole('article');
        post.focus();
        act(() => void fireEvent.keyDown(post, { key: 'c', code: 'KeyC' }));
        expect(routeToPath(history.current)).toBe('/home/post/1');
        await waitFor(() => expect(document.activeElement?.id).toBe('comment-box-c1'));
    });

    it('c on a post closed to comments opens it, focuses its heading and says why', async () => {
        const { api } = site(none, feed(mila));
        const { history } = renderApp(sectionRoute('home'), api);
        const post = await screen.findByRole('article');
        post.focus();
        act(() => void fireEvent.keyDown(post, { key: 'c', code: 'KeyC' }));
        expect(routeToPath(history.current)).toBe('/home/post/1');
        await waitFor(() => expect(document.activeElement?.id).toBe('detail-title'));
        expect(screen.getByText('Comments are closed on this post')).toBeTruthy();
    });

    it('r on a post in the list comments on that post, not in the thread that is open', async () => {
        const { api } = site(none, {
            'GET /feeds/home': () => ({ status: 200, body: { items: [activity('1', mila, { can_comment: true }), activity('2', tom, { can_comment: true })], next_cursor: null } }),
        });
        const { history } = renderApp(sectionRoute('home'), api);
        const [first, second] = await within(screen.getByRole('feed')).findAllByRole('article');
        // the second post's thread is open
        second!.focus();
        act(() => void fireEvent.keyDown(second!, { key: 'c', code: 'KeyC' }));
        await waitFor(() => expect(document.activeElement?.id).toBe('comment-box-c2'));
        if (!first) throw new Error('no first post');
        first.focus();
        act(() => void fireEvent.keyDown(first, { key: 'r', code: 'KeyR' }));
        expect(routeToPath(history.current)).toBe('/home/post/1');
        await waitFor(() => expect(document.activeElement?.id).toBe('comment-box-c1'));

        // focus outside the detail pane and on no post: r does nothing
        const sidebarItem = screen.getByRole('button', { name: 'Explore' });
        sidebarItem.focus();
        act(() => void fireEvent.keyDown(sidebarItem, { key: 'r', code: 'KeyR' }));
        expect(document.activeElement).toBe(sidebarItem);
    });

    it('l says what the reaction came to once the site answered, each time', async () => {
        const reactions = { kinds: [{ name: 'like', title: 'Like', emoji: '👍' }], per_user: 1 };
        const { api } = site(none, {
            'GET /reactions/details': () => ({ status: 200, body: reactions }),
            'GET /feeds/home': () => ({ status: 200, body: { items: [activity('1', mila, { can_react: true }), activity('2', tom, { can_react: true })], next_cursor: null } }),
            'PUT /content/c1/reaction': () => ({ status: 204 }),
            'PUT /content/c2/reaction': () => ({ status: 204 }),
        });
        renderApp(sectionRoute('home'), api);
        await screen.findAllByRole('button', { name: 'Like', pressed: false });
        const posts = within(screen.getByRole('feed')).getAllByRole('article');
        const said = () => screen.getAllByRole('status').find((el) => el.textContent === 'Reacted')?.firstChild ?? null;
        const nodes: (ChildNode | null)[] = [];
        for (const post of posts) {
            post.focus();
            act(() => void fireEvent.keyDown(post, { key: 'l', code: 'KeyL' }));
            await waitFor(() => expect(within(post).getByRole('button', { name: 'Like, 1 reaction', pressed: true })).toBeTruthy());
            await waitFor(() => expect(said()).toBeTruthy());
            await waitFor(() => expect(nodes.includes(said())).toBe(false));
            nodes.push(said());
        }
        // a new text node each time, so a screen reader reads the second one too
        expect(nodes).toHaveLength(2);
    });

    it('single keys do nothing while typing', async () => {
        const { api } = site(none, feed(mila));
        const { history } = renderApp(sectionRoute('home'), api);
        await screen.findByRole('article');
        const box = document.getElementById('new-post')!;
        box.focus();
        act(() => void fireEvent.keyDown(box, { key: 'p', code: 'KeyP' }));
        expect(routeToPath(history.current)).toBe('/home');
    });
});
