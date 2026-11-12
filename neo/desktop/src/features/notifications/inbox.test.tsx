import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { type CommandHandler, Shell } from '../../shell/shell';
import { splitNotificationText } from './notification-row';
import type { NavItem } from '../../shell/sidebar';

type Notification = Schema<'Notification'>;

const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

const n = (id: string, over: Partial<Notification>): Notification => ({
    id,
    kind: 'social.comment',
    source: 'bx_timeline.commentPost',
    module: 'bx_timeline',
    actor: eric,
    actors: 1,
    text: `Notification ${id}`,
    url: `https://community.example/n/${id}`,
    object_kind: 'other',
    object_id: null,
    item_id: null,
    thread_id: null,
    data: {},
    read: false,
    created_at: '2026-11-06T10:00:00Z',
    updated_at: '2026-11-06T10:00:00Z',
    ...over,
});

const inbox: Notification[] = [
    n('30', { text: 'Eric answered your comment', object_kind: 'comment', object_id: '99', item_id: '12', thread_id: '55' }),
    n('29', { text: 'Eric reacted to your post', kind: 'social.reacted', source: 'bx_timeline_reactions.doVote', data: { kind: 'like' }, object_kind: 'content', object_id: '12' }),
    n('28', { text: 'Eric follows you', kind: 'graph.followed', source: 'sys_profiles_subscriptions.connection_added', module: 'sys_profiles_subscriptions', object_kind: 'profile', object_id: '6', read: true }),
    n('27', { text: 'A poll closed', kind: 'other', source: 'bx_polls.closed', module: 'bx_polls', object_kind: 'other', actor: null, read: true }),
];

type Answer = { status: number; body?: unknown };

function fakeApi(routes: Record<string, (request: Request) => Answer>, calls: string[]): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}${request.method === 'POST' ? ` ${await request.clone().text()}` : ''}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

function site(over: Record<string, (request: Request) => Answer> = {}) {
    const calls: string[] = [];
    const api = fakeApi(
        {
            'GET /notifications': (r) => {
                const unread = new URL(r.url).searchParams.get('unread_only') === 'true';
                return { status: 200, body: { items: unread ? inbox.filter((x) => !x.read) : inbox, next_cursor: null } };
            },
            'POST /notifications/read': () => ({ status: 204 }),
            'GET /sync': () => ({ status: 200, body: { cursor: 'c', changes: [], more: false, reset: false, badges: { notifications: 2, messages: 0, friend_requests: 1 }, lists: {} } }),
            ...over,
        },
        calls,
    );
    return { api, calls };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications' },
];

function Harness({ history, api }: { history: RouteHistory; api: UnaApi }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} commands={commands} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

function renderInbox(route: Route = sectionRoute('notifications'), prepare?: (client: QueryClient) => void, over?: Record<string, (request: Request) => Answer>) {
    const { api, calls } = site(over);
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    prepare?.(client);
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api} />
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
                if (prop === 'offsetHeight' && this.classList.contains('notification-row')) return 64;
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

const feed = () => screen.findByRole('feed', { name: 'Notifications, All' });

describe('Notifications inbox', () => {
    it('lists notifications as articles, unread ones said so', async () => {
        renderInbox();
        const list = await feed();
        const rows = await within(list).findAllByRole('article');
        expect(rows.map((r) => r.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4']);
        expect(rows[0]?.getAttribute('aria-setsize')).toBe('4');
        expect(within(rows[0]!).getByText(', unread')).toBeTruthy();
        expect(within(rows[2]!).queryByText(', unread')).toBeNull();
        expect(within(rows[3]!).getByText(', opens on the site')).toBeTruthy();
    });

    it('draws a list whose page is cached when the pane opens (restored, or a 304 refetch that changes nothing)', async () => {
        renderInbox(sectionRoute('notifications'), (client) => {
            client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } });
            client.setQueryData(['notifications', 'all'], { pages: [{ items: inbox, next_cursor: null }], pageParams: [undefined] });
        });
        const rows = await within(await feed()).findAllByRole('article');
        expect(rows).toHaveLength(4);
    });

    it('fetches on past a first page that came back empty with a next one', async () => {
        const { calls } = renderInbox(sectionRoute('notifications'), undefined, {
            'GET /notifications': (r) =>
                new URL(r.url).searchParams.get('cursor') === 'more' ? { status: 200, body: { items: inbox, next_cursor: null } } : { status: 200, body: { items: [], next_cursor: 'more' } },
        });
        const rows = await within(await feed()).findAllByRole('article');
        expect(rows).toHaveLength(4);
        expect(calls.filter((c) => c.startsWith('GET /notifications?'))).toHaveLength(2);
        expect(screen.queryByText('No notifications yet.')).toBeNull();
    });

    it('opens what a notification is about with Enter and marks it read', async () => {
        const { history, calls } = renderInbox();
        const rows = await within(await feed()).findAllByRole('article');
        fireEvent.keyDown(rows[0]!, { key: 'Enter' });
        expect(routeToPath(history.current)).toBe('/notifications/post/12/comment-99-in-55');
        await waitFor(() => expect(calls).toContain('POST /notifications/read {"ids":["30"]}'));
        // read state is one marker: this one and the older ones show as read at once
        await waitFor(() => expect(within(rows[1]!).queryByText(', unread')).toBeNull());
    });

    it('j, k and o move through the rows and open one', async () => {
        const { history, calls } = renderInbox();
        const list = await feed();
        const rows = await within(list).findAllByRole('article');
        screen.getByRole('heading', { name: 'Notifications', level: 1 }).focus();
        fireEvent.keyDown(document.activeElement!, { key: 'j' });
        fireEvent.keyDown(document.activeElement!, { key: 'j' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('29'));
        fireEvent.keyDown(document.activeElement!, { key: 'k' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('30'));
        fireEvent.keyDown(document.activeElement!, { key: 'j' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('29'));
        fireEvent.keyDown(document.activeElement!, { key: 'o' });
        expect(routeToPath(history.current)).toBe('/notifications/post/12');
        // a read one opens without asking the site again
        const posts = calls.filter((c) => c.startsWith('POST /notifications/read')).length;
        rows[2]!.focus();
        fireEvent.keyDown(rows[2]!, { key: 'Enter' });
        // a profile is a page in the content pane, not a detail beside the list
        expect(routeToPath(history.current)).toBe('/profile?id=6');
        expect(calls.filter((c) => c.startsWith('POST /notifications/read'))).toHaveLength(posts);
    });

    it('opens who did it for what the app has no place for, with no "on the site" on the row', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { history } = renderInbox(sectionRoute('notifications'), undefined, {
            'GET /notifications': () => ({ status: 200, body: { items: [n('40', { text: 'Eric voted in a poll', kind: 'other', source: 'bx_polls.voted', module: 'bx_polls', object_kind: 'other' })], next_cursor: null } }),
        });
        const rows = await within(await feed()).findAllByRole('article');
        expect(within(rows[0]!).queryByText(', opens on the site')).toBeNull();
        expect(rows[0]!.querySelector('.notification-meta svg')).toBeNull();
        fireEvent.click(within(rows[0]!).getByText(/voted in a poll/));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/profile?id=6'));
        expect(opened).not.toHaveBeenCalled();
    });

    it('opens what a notification is about in a window of its own on a double-click', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        renderInbox();
        const rows = await within(await feed()).findAllByRole('article');
        fireEvent.doubleClick(within(rows[1]!).getByText(/reacted to your post/));
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0]?.[0]).toContain(encodeURIComponent('/notifications/post/12'));
        // the picture opens who did it, not a window
        fireEvent.doubleClick(within(rows[1]!).getByRole('button', { name: 'Eric’s profile' }));
        expect(opened).toHaveBeenCalledTimes(1);
    });

    it('opens on the site only what has neither a place in the app nor someone who did it', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { history } = renderInbox();
        const rows = await within(await feed()).findAllByRole('article');
        fireEvent.click(within(rows[3]!).getByText('A poll closed'));
        await waitFor(() => expect(opened).toHaveBeenCalledWith('https://community.example/n/27', '_blank', 'noopener'));
        expect(history.current.detail).toBeNull();
        // one click is one tab
        await new Promise((r) => setTimeout(r, 20));
        expect(opened).toHaveBeenCalledTimes(1);
    });

    it('opens once and marks read once for a click on the text', async () => {
        const { history, calls } = renderInbox();
        const rows = await within(await feed()).findAllByRole('article');
        // the name is on the first line, the rest of the text on the second; together they are the row's name
        expect(within(await feed()).getByRole('article', { name: 'Eric reacted to your post' })).toBe(rows[1]);
        expect(rows[1]!.querySelector('.notification-line .unread-dot, .notification-line bdi')).toBeTruthy();
        fireEvent.click(within(rows[1]!).getByRole('button', { name: 'reacted to your post' }));
        expect(routeToPath(history.current)).toBe('/notifications/post/12');
        await waitFor(() => expect(calls).toContain('POST /notifications/read {"ids":["29"]}'));
        await new Promise((r) => setTimeout(r, 20));
        expect(calls.filter((c) => c.startsWith('POST /notifications/read'))).toHaveLength(1);
    });

    it('keeps focus in the list when the focused row leaves it', async () => {
        const { client } = renderInbox();
        const list = await feed();
        const rows = await within(list).findAllByRole('article');
        rows[1]!.focus();
        fireEvent.focus(rows[1]!);
        // the list comes back without the focused row (read elsewhere)
        client.setQueryData(['notifications', 'all'], { pages: [{ items: [inbox[0], inbox[2], inbox[3]], next_cursor: null }], pageParams: [undefined] });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('28'));
    });

    it('marks all as read', async () => {
        const { calls } = renderInbox();
        await within(await feed()).findAllByRole('article');
        fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
        await waitFor(() => expect(calls).toContain('POST /notifications/read {}'));
        expect(await screen.findByText('All notifications marked as read')).toBeTruthy();
    });

    it('keeps Mark all as read in place when nothing is unread, so focus stays on it', async () => {
        const { client, calls } = renderInbox();
        await within(await feed()).findAllByRole('article');
        client.setQueryData(['notifications', 'all'], { pages: [{ items: inbox.map((x) => ({ ...x, read: true })), next_cursor: null }], pageParams: [undefined] });
        const button = screen.getByRole('button', { name: 'Mark all as read' });
        await waitFor(() => expect(button.getAttribute('aria-disabled')).toBe('true'));
        button.focus();
        fireEvent.click(button);
        expect(document.activeElement).toBe(button);
        // it says why it does nothing: its description, read with its name
        expect(screen.getByRole('button', { name: 'Mark all as read', description: 'nothing is unread' })).toBe(button);
        expect(calls).not.toContain('POST /notifications/read {}');
    });

    it('puts day headings between the rows, never counted or reached by the keys', async () => {
        const day = 86_400_000;
        const spread = [
            n('40', { created_at: new Date(Date.now() - 60_000).toISOString() }),
            n('39', { created_at: new Date(Date.now() - 2 * day).toISOString(), read: true }),
            n('38', { created_at: new Date(Date.now() - 30 * day).toISOString(), read: true }),
        ];
        renderInbox(sectionRoute('notifications'), undefined, { 'GET /notifications': () => ({ status: 200, body: { items: spread, next_cursor: null } }) });
        const list = await feed();
        const rows = await within(list).findAllByRole('article');
        expect(rows).toHaveLength(3);
        expect(rows.map((r) => r.getAttribute('aria-setsize'))).toEqual(['3', '3', '3']);
        expect(rows.map((r) => r.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
        // the headings are drawn but hidden from screen readers: each row says its day
        const headings = Array.from(list.querySelectorAll<HTMLElement>('.day-heading'));
        expect(headings.map((h) => h.textContent)).toEqual(['Today', 'This week', 'Earlier']);
        expect(headings.every((h) => h.getAttribute('aria-hidden') === 'true' && !h.hasAttribute('data-index'))).toBe(true);
        expect(within(rows[0]!).getByText('Today,')).toBeTruthy();
        // the virtualizer measures each by its place among the virtual rows, headings included
        // (data-index, the notification's own, would give a heading the height of a notification)
        expect(headings.map((h) => h.dataset.row)).toEqual(['0', '2', '4']);
        expect(rows.map((r) => r.dataset.row)).toEqual(['1', '3', '5']);
        // j, k and the arrows go from row to row, past the headings
        screen.getByRole('heading', { name: 'Notifications', level: 1 }).focus();
        fireEvent.keyDown(document.activeElement!, { key: 'j' });
        await waitFor(() => expect(document.activeElement).toBe(rows[0]));
        fireEvent.keyDown(rows[0]!, { key: 'ArrowDown' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('39'));
        fireEvent.keyDown(document.activeElement!, { key: 'j' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('38'));
        fireEvent.keyDown(document.activeElement!, { key: 'End' });
        expect((document.activeElement as HTMLElement).dataset.id).toBe('38');
        fireEvent.keyDown(document.activeElement!, { key: 'k' });
        await waitFor(() => expect((document.activeElement as HTMLElement).dataset.id).toBe('39'));
        expect(document.activeElement?.classList.contains('day-heading')).toBe(false);
    });

    it('draws a kind badge on the picture and the unread dot in the gutter', async () => {
        renderInbox();
        const rows = await within(await feed()).findAllByRole('article');
        expect(rows[0]!.querySelector('.kind-badge')?.getAttribute('data-tone')).toBe('accent');
        expect(rows[1]!.querySelector('.kind-badge')?.getAttribute('data-tone')).toBe('heart');
        expect(rows[0]!.classList.contains('unread')).toBe(true);
        expect(rows[2]!.classList.contains('unread')).toBe(false);
    });

    it('shows the actor\'s badges after the name on the first line: two pills, +N, and every badge in the row\'s name', async () => {
        const badges: Schema<'ProfileBadge'>[] = [
            { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' },
            { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' },
            { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' },
        ];
        const badged = { ...eric, badges };
        const list: Notification[] = [
            n('40', { text: 'Eric answered your comment', actor: badged, object_kind: 'comment', object_id: '99', item_id: '12', thread_id: '55' }),
            n('39', { text: 'Your post was approved', actor: badged, read: true }),
            n('38', { text: 'Eric follows you', kind: 'graph.followed', object_kind: 'profile', object_id: '6' }),
        ];
        renderInbox(undefined, undefined, { 'GET /notifications': () => ({ status: 200, body: { items: list, next_cursor: null } }) });
        const pills = (el: Element) => Array.from(el.querySelectorAll('.badges-pills .badge')).map((b) => b.textContent?.trim());
        const row = await within(await feed()).findByRole('article', { name: /^Eric ?, Founder, Moderator, Top contributor, answered your comment$/ });
        // the first line: the unread dot, the name, its badges, then the time on the right
        const line = row.querySelector('.notification-line') as HTMLElement;
        expect(Array.from(line.children).map((c) => c.className.split(' ')[0])).toEqual(['unread-dot', 'notification-who', 'notification-meta']);
        const who = line.querySelector('.notification-who') as HTMLElement;
        expect(who.querySelector('bdi')?.nextElementSibling?.classList.contains('badges')).toBe(true);
        expect(pills(who)).toEqual(['Founder', 'Moderator', '+1']);
        expect(who.querySelector('.badges-pills')?.getAttribute('aria-hidden')).toBe('true');
        // a text that does not start with the name: the badges are drawn, the row is named by its text
        const approved = within(await feed()).getByRole('article', { name: 'Your post was approved' });
        expect(pills(approved)).toEqual(['Founder', 'Moderator', '+1']);
        // the spoken list leads into the text with a comma only where the text follows it in the name
        expect(who.textContent).toMatch(/Top contributor,$/);
        expect(approved.querySelector('.notification-who')?.textContent).toMatch(/Top contributor$/);
        // an actor with none: the name alone
        const follows = within(await feed()).getByRole('article', { name: /^Eric ?follows you$/ });
        expect(follows.querySelector('.badges')).toBeNull();
    });

    it('shows only unread ones in the Unread tab, which is in the route', async () => {
        const { history, calls } = renderInbox();
        await feed();
        fireEvent.click(screen.getByRole('tab', { name: 'Unread' }));
        expect(routeToPath(history.current)).toBe('/notifications?filter=unread');
        const list = await screen.findByRole('feed', { name: 'Notifications, Unread' });
        await waitFor(() => expect(within(list).getAllByRole('article')).toHaveLength(2));
        expect(calls.some((c) => c.startsWith('GET /notifications?') && c.includes('unread_only=true'))).toBe(true);
        expect(screen.getByRole('tab', { name: 'Unread' }).getAttribute('aria-selected')).toBe('true');
    });
});

describe('a notification\'s two lines', () => {
    it('puts the actor on the first and the rest of the text on the second', () => {
        expect(splitNotificationText('Lily Carter liked your post', 'Lily Carter')).toEqual({ who: 'Lily Carter', what: 'liked your post' });
        // a text that does not start with the name keeps all of it
        expect(splitNotificationText('Your post was approved', 'Lily Carter')).toEqual({ who: 'Lily Carter', what: 'Your post was approved' });
        expect(splitNotificationText('Welcome to UNA Makers', null)).toEqual({ who: null, what: 'Welcome to UNA Makers' });
    });
});
