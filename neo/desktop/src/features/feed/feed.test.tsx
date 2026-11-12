import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { appRealtime } from '../../lib/realtime';
import { RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { countNew, PAGE_SIZE } from './use-feed';
import { putActivity, withReaction } from './cache';
import { useAnnouncer } from './feed-list';
import { aspectRatio, mediaLabel } from './media';
import { setRichText } from '../../components/rich-editor/test-utils';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ ...lily, about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

function activity(id: string, overrides: Partial<Schema<'Item'>> = {}): Schema<'Activity'> {
    return {
        id,
        verb: 'posted',
        actor: lily,
        owner_id: '4',
        object: {
            id: `c${id}`,
            kind: 'feed_post',
            module: 'bx_timeline',
            author: lily,
            anonymous: false,
            audience: 'public',
            card: { text: `Post ${id}` },
            media: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-01T00:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: false, can_edit: false, can_delete: false },
            ...overrides,
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-01T00:00:00Z',
    } as Schema<'Activity'>;
}

const page = (items: Schema<'Activity'>[], next: string | null = null): Schema<'Page_Activity'> => ({ items, next_cursor: next }) as Schema<'Page_Activity'>;

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer | Promise<Answer>>;

function fakeApi(routes: Routes): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            const type = status >= 400 ? 'application/problem+json' : 'application/json';
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } });
        },
    });
}

const kinds: Schema<'ReactionKinds'> = {
    kinds: [
        { name: 'like', title: 'Like', emoji: '👍', icon: 'thumbs-up', color: '#616161' },
        { name: 'love', title: 'Love', emoji: '❤️', icon: 'heart', color: '#d80960' },
        { name: 'joy', title: 'Joy', emoji: '😂', icon: 'laugh', color: null },
    ],
    // UNA as installed: every reaction set to Emoji in Studio. The app still draws the icons, as
    // NEO's web client does (REACTION_LOOK)
    display: 'emoji',
    per_user: 1,
    any_emoji: false,
};

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

function renderFeed(routes: Routes, history = new RouteHistory(sectionRoute('home'))) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={fakeApi({ 'GET /reactions/details': () => ({ status: 200, body: kinds }), ...routes })} />
        </QueryClientProvider>,
    );
    return { client, history };
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
    // the compose sheet keeps its draft in localStorage outside the app
    localStorage.clear();
});

const articles = () => within(screen.getByRole('feed')).queryAllByRole('article');
const key = (k: string) => fireEvent.keyDown(document.activeElement ?? window, { key: k });

describe('the feed list', () => {
    it('is a feed of articles with their position, and keeps few of them in the DOM', async () => {
        const many = Array.from({ length: 500 }, (_, i) => activity(String(1000 - i)));
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page(many) }) });

        const feed = await screen.findByRole('feed', { name: 'Home, Following' });
        await waitFor(() => expect(articles().length).toBeGreaterThan(0));
        const shown = articles();
        expect(shown.length).toBeLessThan(40);
        expect(shown[0]).toHaveProperty('ariaPosInSet', '1');
        expect(shown[0]?.getAttribute('aria-setsize')).toBe('500');
        expect(shown[0]?.getAttribute('aria-labelledby')).toBeTruthy();
        expect(feed.closest('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe('feed-tab-following');
    });

    it('shows the author\'s badges after the name: two pills, +N, and every badge in the row\'s name', async () => {
        const badges: Schema<'ProfileBadge'>[] = [
            { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' },
            { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' },
            { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' },
        ];
        const andrey: Schema<'Profile'> = { ...lily, id: '65', display_name: 'Andrey', badges };
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('2', { author: andrey }), activity('1')]) }) });

        const row = await screen.findByRole('article', { name: /^Andrey ?, Founder, Moderator, Top contributor\b/ });
        expect(within(row).getByRole('button', { name: 'Andrey' })).toBeTruthy();
        expect(Array.from(row.querySelectorAll('.badges-pills .badge')).map((b) => b.textContent?.trim())).toEqual(['Founder', 'Moderator', '+1']);
        // no badges, no pills, and the name alone
        const plain = await screen.findByRole('article', { name: /^Lily\b/ });
        expect(plain.querySelector('.badges')).toBeNull();
    });

    it('says the size is unknown while more pages may follow', async () => {
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('2'), activity('1')], 'next') }) });
        await waitFor(() => expect(articles().length).toBe(2));
        expect(articles()[1]?.getAttribute('aria-setsize')).toBe('-1');
    });

    it('moves with j and k from the list heading, and opens with Enter', async () => {
        const { history } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('3'), activity('2'), activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(3));

        document.getElementById('list-title')!.focus();
        key('j');
        expect(document.activeElement).toBe(articles()[0]);
        key('j');
        key('j');
        key('j');
        expect(document.activeElement).toBe(articles()[2]);
        key('k');
        expect(document.activeElement).toBe(articles()[1]);
        key('ArrowUp');
        expect(document.activeElement).toBe(articles()[0]);
        key('Enter');
        expect(routeToPath(history.current)).toBe('/home/post/3');
    });

    it('ignores j and k while focus is outside the list pane', async () => {
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        const nav = screen.getByRole('button', { name: /^Explore/ });
        nav.focus();
        key('j');
        expect(document.activeElement).toBe(nav);
    });

    it('switches feeds with the tabs', async () => {
        const { history } = renderFeed({
            'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }),
            'GET /feeds/hot': () => ({ status: 200, body: page([activity('9')]) }),
        });
        const hot = await screen.findByRole('tab', { name: 'Hot' });
        expect(screen.getByRole('tab', { name: 'Following' }).getAttribute('aria-selected')).toBe('true');
        fireEvent.click(hot);
        expect(routeToPath(history.current)).toBe('/home?feed=hot');
        await screen.findByRole('feed', { name: 'Home, Hot' });
        await waitFor(() => expect(articles()[0]?.textContent).toContain('Post 9'));

        fireEvent.keyDown(screen.getByRole('tab', { name: 'Hot' }), { key: 'ArrowLeft' });
        expect(routeToPath(history.current)).toBe('/home?feed=for-you');
        expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'For you' }));
    });

    it('keeps newer posts behind a pill until asked, without moving the list', async () => {
        let first = [activity('2'), activity('1')];
        const { client } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page(first) }) });
        await waitFor(() => expect(articles().length).toBe(2));

        first = [activity('3'), activity('2', { stats: { comments: 0, reactions: 5, reposts: 0, views: 0 } }), activity('1')];
        await act(() => client.refetchQueries(['feed-head']));

        const pill = await screen.findByRole('button', { name: /1 new post/ });
        // the shown posts stay put, but take the fresh counts
        expect(articles()[0]?.textContent).toContain('Post 2');
        expect(within(articles()[0]!).getByRole('button', { name: 'Like, 5 reactions' })).toBeTruthy();
        expect(screen.getByText(/1 new post\. Press period/)).toBeTruthy();

        document.getElementById('list-title')!.focus();
        key('.');
        await waitFor(() => expect(articles()[0]?.textContent).toContain('Post 3'));
        await waitFor(() => expect(document.activeElement).toBe(articles()[0]));
        expect(pill.isConnected).toBe(false);
    });

    it('checks for new posts when the site says one was added, and drops one it says was removed', async () => {
        let first = [activity('2'), activity('1')];
        let calls = 0;
        appRealtime.setStatus({ connected: true, channels: { activities: 'bx_timeline_0' } });
        try {
            renderFeed({
                'GET /feeds/home': () => {
                    calls++;
                    return { status: 200, body: page(first) };
                },
            });
            await waitFor(() => expect(articles().length).toBe(2));
            expect(calls).toBe(1);

            first = [activity('3'), activity('2'), activity('1')];
            act(() => appRealtime.receive({ channel: 'bx_timeline_0', event: 'added', data: { id: '3', author_id: 9 } }));
            expect(await screen.findByRole('button', { name: /1 new post/ })).toBeTruthy();
            expect(calls, 'one check of the first page, not the next poll').toBe(2);

            act(() => appRealtime.receive({ channel: 'bx_timeline_0', event: 'deleted', data: { id: '1' } }));
            await waitFor(() => expect(articles().map((a) => a.textContent).some((t) => t?.includes('Post 1'))).toBe(false));
        } finally {
            appRealtime.setStatus({ connected: false, channels: {} });
        }
    });

    it('asks for the first page once: the poll starts from the page just loaded', async () => {
        let calls = 0;
        renderFeed({
            'GET /feeds/home': () => {
                calls++;
                return { status: 200, body: page([activity('1')]) };
            },
        });
        await waitFor(() => expect(articles().length).toBe(1));
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
        expect(calls).toBe(1);
    });

    it('keeps a deleted post out of the new posts, and moves focus to the next post', async () => {
        const mine = { viewer: { reaction: null, favorited: false, can_react: true, can_comment: false, can_edit: false, can_delete: true } };
        let first = [activity('3', mine), activity('2', mine), activity('1', mine)];
        const confirm = window.confirm;
        window.confirm = () => true;
        try {
            const { client } = renderFeed({
                'GET /feeds/home': () => ({ status: 200, body: page(first) }),
                'DELETE /activities/2': () => ({ status: 204 }),
            });
            await waitFor(() => expect(articles().length).toBe(3));
            // a poll already holds the post that is about to go, and one new post
            first = [activity('4', mine), ...first];
            await act(() => client.refetchQueries(['feed-head']));
            await screen.findByRole('button', { name: /1 new post/ });

            // Delete is in the post's More menu; the menu gives focus back to its button first
            const more = within(articles()[1]!).getByRole('button', { name: /^More actions for / });
            more.focus();
            fireEvent.click(more);
            fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Post…' }));
            await waitFor(() => expect(articles().map((a) => a.dataset.id)).toEqual(['3', '1']));
            // focus went on to the post that took its place, so the list keys still work
            expect(document.activeElement).toBe(articles()[1]);
            expect(screen.getByRole('button', { name: /1 new post/ })).toBeTruthy();

            key('.');
            await waitFor(() => expect(articles().map((a) => a.dataset.id)).toEqual(['4', '3', '1']));
        } finally {
            window.confirm = confirm;
        }
    });

    it('keeps a post just written when the new posts are shown', async () => {
        let first = [activity('1')];
        const { client } = renderFeed({
            'GET /feeds/home': () => ({ status: 200, body: page(first) }),
            'POST /feed-posts': () => ({ status: 201, body: activity('5') }),
        });
        await waitFor(() => expect(articles().length).toBe(1));
        first = [activity('2'), activity('1')];
        await act(() => client.refetchQueries(['feed-head']));
        await screen.findByRole('button', { name: /1 new post/ });

        // the toolbar's New post opens the compose sheet (the composer card left the list)
        expect(screen.queryByRole('button', { name: "What's new?" })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'New post' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'Hello');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(articles()[0]?.dataset.id).toBe('5'));

        document.getElementById('list-title')!.focus();
        key('.');
        await waitFor(() => expect(articles().map((a) => a.dataset.id)).toEqual(['5', '2', '1']));
    });

    it('does not take back a reaction when the new posts are shown', async () => {
        let first = [activity('1')];
        const { client } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page(first) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        first = [activity('2'), activity('1')];
        await act(() => client.refetchQueries(['feed-head']));
        await screen.findByRole('button', { name: /1 new post/ });

        act(() => putActivity(client, activity('1', { stats: { comments: 0, reactions: 7, reposts: 0, views: 0 } })));
        document.getElementById('list-title')!.focus();
        key('.');
        await waitFor(() => expect(articles()[0]?.dataset.id).toBe('2'));
        expect(within(articles()[1]!).getByRole('button', { name: 'Like, 7 reactions' })).toBeTruthy();
    });

    it('shows a reaction at once and takes it back when the site refuses it', async () => {
        let answer: (a: Answer) => void = () => {};
        renderFeed({
            'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }),
            'PUT /content/c1/reaction': () => new Promise<Answer>((resolve) => (answer = resolve)),
        });
        const like = await screen.findByRole('button', { name: 'Like', pressed: false });
        fireEvent.click(like);
        // before the site answered
        expect(await screen.findByRole('button', { name: 'Like, 1 reaction', pressed: true })).toBeTruthy();

        await act(async () => answer({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'You may not react' } }));
        await screen.findByRole('alert');
        expect(screen.getByRole('alert').textContent).toContain('You may not react');
        expect(await screen.findByRole('button', { name: 'Like', pressed: false })).toBeTruthy();
    });

    it('draws the reactions as outline icons, the given one accented, and no chevron', async () => {
        const loved = { viewer: { reaction: 'love', favorited: false, can_react: true, can_comment: false, can_edit: false, can_delete: false }, stats: { comments: 0, reactions: 3, reposts: 0, views: 0 } };
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1'), activity('2', loved)]) }) });
        await waitFor(() => expect(articles().length).toBe(2));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        expect(like.querySelector('[data-icon="thumbs-up"]')).toBeTruthy();
        expect(like.textContent).not.toContain('👍');
        expect(within(articles()[0]!).queryByRole('button', { name: 'More reactions' })).toBeNull();
        // the given reaction: its own icon, pressed (.on draws it accented and filled)
        const love = within(articles()[1]!).getByRole('button', { name: 'Love, 3 reactions', pressed: true });
        expect(love.querySelector('[data-icon="heart"]')).toBeTruthy();
        expect(love.classList.contains('on')).toBe(true);
        // the keyboard way to the others is in the button's description
        expect(document.getElementById(like.getAttribute('aria-describedby')!)?.textContent).toBe('Shift+Enter or Up Arrow for more reactions');
        // the row of actions starts at the text's edge: no class pulls it to the left any more
        expect(like.closest('.activity-actions')).toBeTruthy();
    });

    it('draws a post\'s actions as capsules: the reaction toggle, Comment with its count; More a menu button at the card\'s top right', async () => {
        const loved = { viewer: { reaction: 'love', favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false }, stats: { comments: 2, reactions: 3, reposts: 0, views: 0 } };
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1'), activity('2', loved)]) }) });
        await waitFor(() => expect(articles().length).toBe(2));
        const row = articles()[1]!.querySelector<HTMLElement>('footer.activity-actions')!;
        await within(row).findByRole('button', { name: 'Love, 3 reactions' });
        const buttons = within(row).getAllByRole('button');
        // every action is a capsule (.act-btn); More is not in the row but at the card's top, after the author in reading order
        expect(buttons.map((b) => b.classList.contains('act-btn'))).toEqual([true, true]);
        const [react, comment] = buttons as [HTMLElement, HTMLElement];
        const more = articles()[1]!.querySelector<HTMLElement>('.act-more-top')!;
        expect(row.contains(more)).toBe(false);
        expect(articles()[1]!.querySelector('.activity-head')!.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(react.getAttribute('aria-pressed')).toBe('true');
        expect(react.getAttribute('aria-label')).toBe('Love, 3 reactions');
        expect(react.classList.contains('on')).toBe(true);
        expect(comment.getAttribute('aria-label')).toBe('2 comments, open the post');
        expect(comment.querySelector('[data-icon="message-square"]')).toBeTruthy();
        expect(comment.querySelector('.act-count')?.textContent).toBe('2');
        expect(more.classList.contains('act-more')).toBe(true);
        expect(more.getAttribute('aria-haspopup')).toBe('menu');
        expect(more.getAttribute('aria-expanded')).toBe('false');
        // not given: not pressed, no .on (the capsule is drawn tinted and ringed only when given)
        const like = within(articles()[0]!).getByRole('button', { name: 'Like', pressed: false });
        expect(like.classList.contains('on')).toBe(false);
    });

    it('draws the site\'s reactions as icons in the picker, and a reaction with only an emoji as its emoji', async () => {
        const custom: Schema<'ReactionKinds'> = { ...kinds, kinds: [...kinds.kinds, { name: 'party', title: 'Party', emoji: '🎉', icon: null, color: null }] };
        renderFeed({ 'GET /reactions/details': () => ({ status: 200, body: custom }), 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        like.focus();
        fireEvent.keyDown(like, { key: 'ArrowUp' });
        const options = within(screen.getByRole('menu', { name: 'Reactions' })).getAllByRole('menuitemradio');
        expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['Like', 'Love', 'Joy', 'Party']);
        expect(options.map((o) => o.querySelector('[data-icon]')?.getAttribute('data-icon') ?? o.textContent)).toEqual(['thumbs-up', 'heart', 'laugh', '🎉']);
        // the site's emoji are not drawn beside the icons
        expect(options.slice(0, 3).map((o) => o.textContent?.trim())).toEqual(['', '', '']);
    });

    it('shows an emoji the viewer picked (Many mode) as given, and a press takes it back', async () => {
        let deleted = false;
        const picked = { viewer: { reaction: 'e_1f98a', favorited: false, can_react: true, can_comment: false, can_edit: false, can_delete: false }, stats: { comments: 0, reactions: 1, reposts: 0, views: 0 } };
        renderFeed({
            'GET /reactions/details': () => ({ status: 200, body: { ...kinds, any_emoji: true } }),
            'GET /feeds/home': () => ({ status: 200, body: page([activity('1', picked)]) }),
            'DELETE /content/c1/reaction': () => {
                deleted = true;
                return { status: 204 };
            },
        });
        const toggle = await screen.findByRole('button', { name: '🦊 Reacted, 1 reaction', pressed: true });
        expect(toggle.textContent).toContain('🦊');
        fireEvent.click(toggle);
        await waitFor(() => expect(deleted).toBe(true));
        expect(await screen.findByRole('button', { name: 'Like', pressed: false })).toBeTruthy();
    });

    it('opens the reactions on hover after a pause, keeps them while the pointer is in them, and closes after it left', async () => {
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        const wrap = like.parentElement!;
        vi.useFakeTimers();
        try {
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(399));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
            act(() => vi.advanceTimersByTime(1));
            const menu = screen.getByRole('menu', { name: 'Reactions' });
            // a pointer opened it: focus stays where it was
            expect(menu.contains(document.activeElement)).toBe(false);
            expect(within(menu).getAllByRole('menuitemradio').map((b) => b.querySelector('[data-icon]')?.getAttribute('data-icon'))).toEqual(['thumbs-up', 'heart', 'laugh']);

            // into the capsule across the gap: it stays
            fireEvent.pointerLeave(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(200));
            fireEvent.pointerEnter(menu, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(1000));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBe(menu);

            // out of both: closed 300ms later
            fireEvent.pointerLeave(menu, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(299));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeTruthy();
            act(() => vi.advanceTimersByTime(1));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();

            // a touch is no hover; leaving before the pause opens nothing
            fireEvent.pointerEnter(wrap, { pointerType: 'touch' });
            act(() => vi.advanceTimersByTime(1000));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
            fireEvent.pointerLeave(wrap, { pointerType: 'touch' });
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(200));
            fireEvent.pointerLeave(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(1000));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();

            // Esc closes a capsule the pointer opened, and focus stays where it was
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(400));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBeTruthy();
            fireEvent.keyDown(document.body, { key: 'Escape' });
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('opens the reactions on a long press, and that press gives none', async () => {
        const put = vi.fn(() => ({ status: 204 }));
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }), 'PUT /content/c1/reaction': put });
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        vi.useFakeTimers();
        try {
            fireEvent.pointerDown(like, { button: 0, pointerType: 'touch' });
            act(() => vi.advanceTimersByTime(500));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBeTruthy();
            fireEvent.pointerUp(like, { button: 0, pointerType: 'touch' });
            fireEvent.click(like, { detail: 1 });
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBeTruthy();
            expect(like.getAttribute('aria-pressed')).toBe('false');
        } finally {
            vi.useRealTimers();
        }
        expect(put).not.toHaveBeenCalled();

        // a short press gives the default and opens nothing
        fireEvent.keyDown(document.body, { key: 'Escape' });
        fireEvent.pointerDown(like, { button: 0, pointerType: 'mouse' });
        fireEvent.pointerUp(like, { button: 0, pointerType: 'mouse' });
        fireEvent.click(like);
        expect(await screen.findByRole('button', { name: 'Like, 1 reaction', pressed: true })).toBeTruthy();
        expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
        await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    });

    it('gives the reaction from l or Enter after a long press that ended off the toggle', async () => {
        const put = vi.fn(() => ({ status: 204 }));
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }), 'PUT /content/c1/reaction': put });
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        vi.useFakeTimers();
        try {
            fireEvent.pointerDown(like, { button: 0, pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(500));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBeTruthy();
            // released over the capsule: the toggle gets no click
            fireEvent.pointerUp(document.body, { button: 0, pointerType: 'mouse' });
        } finally {
            vi.useRealTimers();
        }
        // a keyboard click (detail 0, as l and Enter send) still gives the default
        fireEvent.click(like, { detail: 0 });
        expect(await screen.findByRole('button', { name: 'Like, 1 reaction', pressed: true })).toBeTruthy();
        await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    });

    it('keeps a hover capsule open while focus is in it, and right-click does not open one under the post menu', async () => {
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        const wrap = like.parentElement!;
        vi.useFakeTimers();
        try {
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(400));
            const menu = screen.getByRole('menu', { name: 'Reactions' });
            // Tab from the toggle lands in the capsule; the pointer then leaves
            act(() => within(menu).getAllByRole('menuitemradio')[0]!.focus());
            fireEvent.pointerLeave(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(1000));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBe(menu);
            expect(menu.contains(document.activeElement)).toBe(true);
            fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
            expect(document.activeElement).toBe(like);

            // a right-click before the hover pause: the post menu, and no capsule after it
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(200));
            fireEvent.pointerDown(like, { button: 2, pointerType: 'mouse' });
            fireEvent.contextMenu(like);
            act(() => vi.advanceTimersByTime(1000));
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
            expect(screen.getByRole('menu', { name: 'Actions for Lily’s post' })).toBeTruthy();
            fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
            expect(screen.queryByRole('menu')).toBeNull();

            // a right-click on a hover capsule's toggle closes the capsule under the post menu
            fireEvent.pointerEnter(wrap, { pointerType: 'mouse' });
            act(() => vi.advanceTimersByTime(400));
            expect(screen.getByRole('menu', { name: 'Reactions' })).toBeTruthy();
            fireEvent.pointerDown(like, { button: 2, pointerType: 'mouse' });
            fireEvent.contextMenu(like);
            expect(screen.queryByRole('menu', { name: 'Reactions' })).toBeNull();
            // one Esc closes the post menu
            fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
            expect(screen.queryByRole('menu')).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('opens the reactions from the keyboard: arrows move, Enter gives one, Esc sends focus back', async () => {
        let sent: unknown;
        const history = new RouteHistory({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } });
        renderFeed(
            {
                'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }),
                'PUT /content/c1/reaction': async (r) => {
                    sent = await r.json();
                    return { status: 204 };
                },
            },
            history,
        );
        await waitFor(() => expect(articles().length).toBe(1));
        const like = await within(articles()[0]!).findByRole('button', { name: 'Like' });
        like.focus();
        fireEvent.keyDown(like, { key: 'Enter', shiftKey: true });

        const menu = screen.getByRole('menu', { name: 'Reactions' });
        const options = within(menu).getAllByRole('menuitemradio');
        expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['Like', 'Love', 'Joy']);
        expect(document.activeElement).toBe(options[0]);
        fireEvent.keyDown(options[0]!, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(options[1]);
        fireEvent.keyDown(options[1]!, { key: 'End' });
        expect(document.activeElement).toBe(options[2]);
        fireEvent.keyDown(options[2]!, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(options[0]);
        fireEvent.keyDown(options[0]!, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(document.activeElement).toBe(like);
        // Esc closed the menu only, not the detail pane under it
        expect(routeToPath(history.current)).toBe('/home/post/1');

        fireEvent.keyDown(like, { key: 'ArrowUp' });
        const again = within(screen.getByRole('menu', { name: 'Reactions' })).getAllByRole('menuitemradio');
        fireEvent.keyDown(again[0]!, { key: 'ArrowRight' });
        fireEvent.click(document.activeElement!);
        expect(screen.queryByRole('menu')).toBeNull();
        expect(document.activeElement).toBe(await within(articles()[0]!).findByRole('button', { name: 'Love, 1 reaction', pressed: true }));
        await waitFor(() => expect(sent).toEqual({ kind: 'love' }));
    });

    it('gives a reaction from the post menu, and takes it back when it is the one given', async () => {
        const put = vi.fn(() => ({ status: 204 }));
        const del = vi.fn(() => ({ status: 204 }));
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1')]) }), 'PUT /content/c1/reaction': put, 'DELETE /content/c1/reaction': del });
        await waitFor(() => expect(articles().length).toBe(1));
        const post = articles()[0]!;
        await within(post).findByRole('button', { name: 'Like' });
        fireEvent.contextMenu(within(post).getByText('Post 1'));
        let menu = screen.getByRole('menu', { name: 'Actions for Lily’s post' });
        fireEvent.click(within(menu).getByRole('menuitemradio', { name: 'Joy' }));
        expect(await within(post).findByRole('button', { name: 'Joy, 1 reaction', pressed: true })).toBeTruthy();
        await waitFor(() => expect(put).toHaveBeenCalledTimes(1));

        // right-click on the toggle is the post's menu too, with the given one checked
        fireEvent.contextMenu(within(post).getByRole('button', { name: 'Joy, 1 reaction' }));
        menu = screen.getByRole('menu', { name: 'Actions for Lily’s post' });
        expect(within(menu).getByRole('menuitemradio', { name: 'Joy' }).getAttribute('aria-checked')).toBe('true');
        fireEvent.click(within(menu).getByRole('menuitemradio', { name: 'Joy' }));
        expect(await within(post).findByRole('button', { name: 'Like', pressed: false })).toBeTruthy();
        await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    });
});

describe('the post menu', () => {
    it('draws no detail pane until a post opens, and gives the width back when it closes', async () => {
        const { history } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('3'), activity('2'), activity('1')]) }) });
        await waitFor(() => expect(articles().length).toBe(3));
        const panes = document.querySelector<HTMLElement>('.panes')!;
        const shell = document.querySelector<HTMLElement>('.shell')!;
        expect(panes.getAttribute('data-detail')).toBe('closed');
        expect(screen.queryByRole('region', { name: 'Details' })).toBeNull();
        expect(screen.queryByRole('separator', { name: 'Resize list' })).toBeNull();
        // the single column is the stylesheet's: no inline list width over it
        expect(shell.style.getPropertyValue('--list-width')).toBe('');

        articles()[1]!.focus();
        key('Enter');
        expect(routeToPath(history.current)).toBe('/home/post/2');
        expect(panes.getAttribute('data-detail')).toBe('open');
        expect(screen.getByRole('region', { name: 'Post' })).toBeTruthy();
        expect(screen.getByRole('separator', { name: 'Resize list' })).toBeTruthy();
        expect(shell.style.getPropertyValue('--list-width')).toBe('420px');

        key('Escape');
        expect(routeToPath(history.current)).toBe('/home');
        expect(panes.getAttribute('data-detail')).toBe('closed');
        expect(screen.queryByRole('region', { name: 'Post' })).toBeNull();
        expect(screen.queryByRole('separator', { name: 'Resize list' })).toBeNull();
    });

    it('closes a post opened from the middle of a scrolled feed: focus back on its row, the scroll where it was', async () => {
        const many = Array.from({ length: 60 }, (_, i) => activity(String(100 - i)));
        const { history } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page(many) }) });
        await waitFor(() => expect(articles().length).toBeGreaterThan(0));
        const body = screen.getByRole('feed').closest<HTMLElement>('.pane-body')!;
        act(() => {
            body.scrollTop = 4000;
            fireEvent.scroll(body);
        });
        // a post at 4000px and below: the 21st on (200px each)
        await waitFor(() => expect(articles().some((a) => a.dataset.id === '78')).toBe(true));
        const row = () => articles().find((a) => a.dataset.id === '78')!;
        row().focus();
        key('Enter');
        expect(routeToPath(history.current)).toBe('/home/post/78');
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Post', level: 2 }));

        key('Escape');
        expect(routeToPath(history.current)).toBe('/home');
        expect(document.activeElement).toBe(row());
        expect(body.scrollTop).toBe(4000);
    });

    it('opens a post in a window of its own on a double-click on its row, not on its buttons', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        try {
            const { history } = renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('3')]) }) });
            await waitFor(() => expect(articles().length).toBe(1));
            const post = articles()[0]!;
            fireEvent.doubleClick(within(post).getByRole('button', { name: /More actions/ }));
            expect(open).not.toHaveBeenCalled();
            fireEvent.doubleClick(within(post).getByText('Post 3'));
            expect(open).toHaveBeenCalledTimes(1);
            expect(open.mock.calls[0]?.[0]).toContain(encodeURIComponent('/home/post/3'));
            // the main window stays where it was
            expect(routeToPath(history.current)).toBe('/home');
        } finally {
            open.mockRestore();
        }
    });

    it('opens on right-click and Shift+F10 on a post, with the items the viewer may use', async () => {
        const items = { viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true }, card: { text: 'Post 1', url: 'https://community.example/p/1' } };
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1', items)]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        const post = articles()[0]!;
        // React presses the toggle, so it is offered once the site's kinds are known
        await waitFor(() => expect(within(post).getByRole('button', { name: 'Like' })).toBeTruthy());

        fireEvent.contextMenu(within(post).getByText('Post 1'));
        let menu = screen.getByRole('menu', { name: 'Actions for Lily’s post' });
        const names = within(menu).getAllByRole('menuitem').map((i) => i.querySelector('.menu-text')?.textContent ?? '');
        // the reactions' section has a greyed React heading
        expect(names).toEqual(['Open Post', 'Comment', 'React', 'Open Author', 'Copy Link', 'Open in New Window', 'Edit Post', 'Delete Post…']);
        expect(within(menu).getAllByRole('menuitem')[2]?.getAttribute('aria-disabled')).toBe('true');
        // the reactions, a section of their own: the default first with l beside it
        const reactions = within(menu).getAllByRole('menuitemradio');
        expect(reactions.map((i) => i.querySelector('.menu-text')?.textContent)).toEqual(['Like', 'Love', 'Joy']);
        expect(reactions.map((i) => i.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
        expect(reactions[0]?.getAttribute('aria-keyshortcuts')).toBe('l');
        // one's own post: no Message
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();

        post.focus();
        fireEvent.keyDown(post, { key: 'F10', shiftKey: true });
        menu = screen.getByRole('menu', { name: 'Actions for Lily’s post' });
        expect(menu).toBeTruthy();
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
        expect(document.activeElement).toBe(post);
    });

    it('no longer shows Message, Edit or Delete as buttons in the head', async () => {
        const mine = { viewer: { reaction: null, favorited: false, can_react: true, can_comment: false, can_edit: true, can_delete: true } };
        renderFeed({ 'GET /feeds/home': () => ({ status: 200, body: page([activity('1', mine)]) }) });
        await waitFor(() => expect(articles().length).toBe(1));
        for (const name of ['Message', 'Edit', 'Delete']) expect(within(articles()[0]!).queryByRole('button', { name })).toBeNull();
        expect(within(articles()[0]!).getByRole('button', { name: 'More actions for Lily’s post' }).getAttribute('aria-haspopup')).toBe('menu');
    });
});

describe('feed helpers', () => {
    it('counts the first page\'s posts that are not shown', () => {
        expect(countNew([activity('3'), activity('2')], [activity('2'), activity('1')])).toBe(1);
        expect(countNew([activity('2')], [activity('2')])).toBe(0);
    });

    it('in a ranked feed, counts only posts newer than the newest shown', () => {
        const at = (id: string, created_at: string) => ({ ...activity(id), created_at });
        const shown = [at('5', '2026-11-03T00:00:00Z'), at('4', '2026-11-02T00:00:00Z')];
        // an older post that moved up, and one written after everything shown
        const head = [at('1', '2026-10-01T00:00:00Z'), at('9', '2026-11-04T00:00:00Z'), ...shown];
        expect(countNew(head, shown)).toBe(2);
        expect(countNew(head, shown, true)).toBe(1);
    });

    it('reads each message, the same words twice included, and joins messages of one commit', async () => {
        const { result } = renderHook(() => useAnnouncer());
        // each act() ends a task, as separate events do
        await act(async () => result.current[1]('Loaded 20 more posts'));
        const firstSeq = result.current[0].seq;
        await act(async () => result.current[1]('Loaded 20 more posts'));
        expect(result.current[0]).toEqual({ text: 'Loaded 20 more posts', seq: firstSeq + 1 });
        await act(async () => {
            result.current[1]('Loaded 20 more posts.');
            result.current[1]('1 new post.');
        });
        expect(result.current[0].text).toBe('Loaded 20 more posts. 1 new post.');
    });

    it('changes the reaction count only when a reaction is added or taken back', () => {
        const item = activity('1').object;
        const liked = withReaction(item, 'like');
        expect([liked.viewer?.reaction, liked.stats.reactions]).toEqual(['like', 1]);
        const loved = withReaction(liked, 'love');
        expect([loved.viewer?.reaction, loved.stats.reactions]).toEqual(['love', 1]);
        expect(withReaction(loved, null).stats.reactions).toBe(0);
        expect(withReaction(item, null)).toBe(item);
    });

    it('reserves the media box from the size the site sends', () => {
        expect(aspectRatio({ width: 640, height: 480 })).toBe('640 / 480');
        expect(aspectRatio({ width: null, height: null })).toBe('4 / 3');
        expect(mediaLabel([{ id: '1', kind: 'image', mime: 'image/png', size: 1, state: 'ready', original_name: 'a.png', url: 'u', download_url: 'u', variants: {}, width: 1, height: 1 }])).toBe('1 photo');
        expect(PAGE_SIZE).toBe(20);
    });
});
