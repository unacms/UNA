import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { type Route, RouteHistory, routeToPath, searchRoute, sectionRoute } from '../../lib/router';
import { type CommandHandler, Shell } from '../../shell/shell';
import { setSiteModules } from '../../lib/site-modules';
import type { NavItem } from '../../shell/sidebar';
import { foundText, tabLabel } from './search-view';

type Profile = Schema<'Profile'>;

const lily: Profile = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const studio: Profile = { id: '9', kind: 'organization', module: 'bx_organizations', display_name: 'Lily Studio', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

const activity = (id: string, text: string) =>
    ({
        id,
        verb: 'posted',
        actor: lily,
        owner_id: '4',
        object: {
            id,
            kind: 'feed_post',
            module: 'bx_timeline',
            author: lily,
            anonymous: false,
            audience: 'public',
            context_id: null,
            card: { title: null, text, body_html: `<p>${text}</p>`, url: null },
            media: [],
            links: [],
            stats: { comments: 0, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-06T10:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-06T10:00:00Z',
    }) as Schema<'Activity'>;

const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [{ ...lily, about: '', created_at: '2026-01-01T00:00:00Z' }],
} as unknown as Schema<'Me'>;

const discussionHit = {
    id: '15',
    content_id: '1793',
    title: 'Lily’s reading list',
    summary: 'Books for the winter',
    body: 'Books for the winter',
    body_html: '<p>Books for the winter</p>',
    author: lily,
    anonymous: false,
    category: { id: '1', title: 'General' },
    audience: 'public',
    context_id: null,
    stats: { replies: 2, views: 9 },
    sticky: false,
    locked: false,
    resolved: null,
    last_reply_at: '2026-11-05T10:00:00Z',
    last_reply_by: studio,
    url: null,
    created_at: '2026-11-04T10:00:00Z',
    updated_at: '2026-11-04T10:00:00Z',
    viewer: null,
} as unknown as Schema<'Discussion'>;

function fakeApi(calls: string[], groups: 'none' | 'some'): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const json = (status: number, body: unknown) =>
                new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
            switch (path) {
                case '/':
                    // the discovery document: Groups, Discussions and Spaces come and go together here
                    return json(200, {
                        name: 'Network',
                        api_version: '2',
                        modules:
                            groups === 'none'
                                ? []
                                : [
                                      { module: 'bx_groups', tag: 'groups', title: 'Groups', kind: 'group' },
                                      { module: 'bx_spaces', tag: 'spaces', title: 'Spaces', kind: 'space' },
                                      { module: 'bx_forum', tag: 'discussions', title: 'Discussions', kind: 'discussion' },
                                  ],
                    });
                case '/search/spaces':
                    return json(200, [{ ...lily, id: '725', kind: 'group', module: 'bx_spaces', display_name: 'Lily Makers Guild' }]);
                case '/search/profiles':
                    return json(200, url.searchParams.get('q') === 'nobody' ? [] : [lily, studio]);
                case '/search/groups':
                    return groups === 'none' ? json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' }) : json(200, [{ ...lily, id: '13', kind: 'group', module: 'bx_groups', display_name: 'Lily Gardeners' }]);
                case '/search/discussions':
                    // the same site: the Discussions module comes and goes with Groups here
                    return groups === 'none'
                        ? json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' })
                        : json(200, { items: [discussionHit], next_cursor: null });
                case '/discussions/categories':
                    return groups === 'none'
                        ? json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' })
                        : json(200, { categories: [{ id: '1', title: 'General' }], can_create: true });
                case '/me/groups':
                    // the sidebar's groups: the same site, so the same Groups module (or none)
                    return groups === 'none' ? json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' }) : json(200, []);
                case '/navigation':
                    // a site without the sidebar of its own: the fixed one
                    return json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' });
                case '/agents':
                    // nor agents: no agent chats in the bottom bar
                    return json(404, { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' });
                case '/search/content': {
                    const second = url.searchParams.get('cursor') === 'p2';
                    // the newest matches are hidden from this viewer: an empty first page with more
                    if (url.searchParams.get('q') === 'hidden')
                        return json(200, second ? { items: [hit('bx_posts', activity('60', 'An older one'))], next_cursor: null } : { items: [], next_cursor: 'p2' });
                    return json(200, {
                        items: second ? [hit('bx_posts', activity('60', 'An older one'))] : [hit('bx_timeline', activity('68', 'Lily went to the lake'))],
                        next_cursor: second ? null : 'p2',
                    });
                }
                default:
                    return new Promise<Response>(() => {});
            }
        },
    });
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'search', label: 'Search', command: 'go-search' },
];

function renderSearch(route: Route, groups: 'none' | 'some' = 'some') {
    const calls: string[] = [];
    const api = fakeApi(calls, groups);
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
        const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
        return (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    <Shell siteUrl="https://community.example" items={items} commands={commands} profile={lily} />
                </RouterProvider>
            </AppContext.Provider>
        );
    }
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { history, calls };
}

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
afterEach(() => {
    cleanup();
    setSiteModules(null);
});

const box = () => screen.getByRole('searchbox', { name: 'Search people, posts and groups' }) as HTMLInputElement;

/** A search hit as the API sends it: a Hit (from the Item) with `module` and the activity. */
const hit = (module: string, a: Schema<'Activity'>): Schema<'Hit'> => ({
    id: a.object.id,
    kind: a.object.kind,
    author: a.object.author ?? null,
    card: a.object.card,
    published_at: a.object.published_at,
    module,
    content_id: a.object.id,
    activity: a,
});

describe('Search labels', () => {
    it('counts results in the tabs once they are known', () => {
        expect(tabLabel('people', undefined)).toBe('People');
        expect(tabLabel('people', 3)).toBe('People 3');
        expect(tabLabel('posts', 20, true)).toBe('Posts 20+');
        expect(foundText('people', 1)).toBe('1 person found');
        expect(foundText('posts', 20, true)).toBe('20 or more posts found');
        expect(foundText('groups', 0)).toBe('No groups found');
    });
});

describe('the Search view', () => {
    it('searches as you type, replacing the route, and lists people first', async () => {
        const { history } = renderSearch({ list: searchRoute(''), detail: null });
        expect(screen.getByText(/Type a name, a handle or words from a post/)).toBeTruthy();
        const before = history.snapshot().paths.length;
        fireEvent.change(box(), { target: { value: 'lily ' } });
        await waitFor(() => expect(routeToPath(history.current)).toBe('/search?q=lily'));
        expect(history.snapshot().paths).toHaveLength(before);
        // the space being typed stays in the field
        expect(box().value).toBe('lily ');
        const people = await screen.findByRole('list', { name: 'People matching “lily”' });
        expect(within(people).getAllByRole('button').map((b) => b.textContent)).toEqual(['Lily Carter', 'Lily Studio']);
        expect(screen.getByRole('tab', { name: 'People 2' }).getAttribute('aria-selected')).toBe('true');
        await waitFor(() => expect(screen.getByText('2 people found')).toBeTruthy());
    });

    it('opens a person’s page in the content pane, and Back returns to the results', async () => {
        const { history } = renderSearch({ list: searchRoute('lily'), detail: null });
        const people = await screen.findByRole('list', { name: 'People matching “lily”' });
        fireEvent.click(within(people).getByRole('button', { name: 'Lily Studio' }));
        expect(routeToPath(history.current)).toBe('/profile?id=9');
        act(() => void history.back());
        expect(routeToPath(history.current)).toBe('/search?q=lily');
        expect(await screen.findByRole('list', { name: 'People matching “lily”' })).toBeTruthy();
    });

    it('shows posts a page at a time on their tab, which is in the route', async () => {
        const { history, calls } = renderSearch({ list: searchRoute('lily'), detail: null });
        fireEvent.click(await screen.findByRole('tab', { name: /^Posts/ }));
        expect(routeToPath(history.current)).toBe('/search?q=lily&tab=posts');
        const feed = await screen.findByRole('feed', { name: 'Posts matching “lily”' });
        await waitFor(() => expect(within(feed).getAllByRole('article').length).toBe(2));
        expect(calls).toContain('GET /search/content?q=lily&cursor=p2&limit=20');
        await waitFor(() => expect(screen.getByRole('tab', { name: 'Posts 2' })).toBeTruthy());
        // Back goes to People
        history.back();
        await screen.findByRole('list', { name: 'People matching “lily”' });
    });

    it('finds discussions on their tab, which open in the detail pane', async () => {
        const { history } = renderSearch({ list: searchRoute('lily', 'discussions'), detail: null });
        const list = await screen.findByRole('list', { name: 'Discussions matching “lily”' });
        const row = within(list).getByRole('button', { name: /Lily’s reading list/ });
        expect(row.textContent).toContain('2 replies, last from Lily');
        expect(screen.getByRole('tab', { name: 'Discussions 1' }).getAttribute('aria-selected')).toBe('true');
        fireEvent.click(row);
        expect(routeToPath(history.current)).toBe('/search/discussion/15?q=lily&tab=discussions');
    });

    it('says when a site has no discussions', async () => {
        renderSearch({ list: searchRoute('lily', 'discussions'), detail: null }, 'none');
        expect(await screen.findByText('This network has no discussions.')).toBeTruthy();
        // and no Discussions tab, as the sidebar has no row for it
        await waitFor(() => expect(screen.queryByRole('tab', { name: /^Discussions/ })).toBeNull());
        expect(screen.getByRole('tab', { name: /^Groups/ })).toBeTruthy();
    });

    it('learns whether the site has discussions from its module list, not by asking for their categories', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null }, 'none');
        await screen.findByRole('list', { name: 'People matching “lily”' });
        await waitFor(() => expect(calls).toContain('GET /'));
        await waitFor(() => expect(screen.queryByRole('tab', { name: /^Discussions/ })).toBeNull());
        expect(calls.some((c) => c.startsWith('GET /discussions/categories'))).toBe(false);
    });

    it('finds spaces on their tab where the site has them, and opens one as a space', async () => {
        const { history, calls } = renderSearch({ list: searchRoute('lily', 'spaces'), detail: null });
        const list = await screen.findByRole('list', { name: 'Spaces matching “lily”' });
        expect(within(list).getByText('Space')).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Spaces 1' }).getAttribute('aria-selected')).toBe('true');
        expect(calls).toContain('GET /search/spaces?q=lily&limit=50');
        fireEvent.click(within(list).getByRole('button', { name: 'Lily Makers Guild' }));
        // a space is a page of its own, at /spaces, not a group
        expect(routeToPath(history.current)).toBe('/spaces?space=725');
    });

    it('has no Spaces tab where the site has no Spaces', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null }, 'none');
        await screen.findByRole('list', { name: 'People matching “lily”' });
        await waitFor(() => expect(calls).toContain('GET /'));
        await waitFor(() => expect(screen.queryByRole('tab', { name: /^Spaces/ })).toBeNull());
        expect(calls.some((c) => c.startsWith('GET /search/spaces'))).toBe(false);
    });

    it('says when a site has no groups', async () => {
        renderSearch({ list: searchRoute('lily', 'groups'), detail: null }, 'none');
        expect(await screen.findByText('This network has no groups.')).toBeTruthy();
    });

    it('refreshes a search on a site without groups without failing', async () => {
        const { calls } = renderSearch({ list: searchRoute('lily'), detail: null }, 'none');
        await screen.findByRole('list', { name: 'People matching “lily”' });
        await waitFor(() => expect(calls.filter((c) => c.startsWith('GET /search/groups'))).toHaveLength(1));
        fireEvent.keyDown(document.body, { key: 'r', code: 'KeyR', ctrlKey: true });
        expect(await screen.findByText('Up to date')).toBeTruthy();
        expect(screen.queryByText('Could not refresh')).toBeNull();
        expect(screen.getByRole('tab', { name: 'Groups 0' })).toBeTruthy();
    });

    it('does not say no posts were found while later pages may hold some', async () => {
        renderSearch({ list: searchRoute('hidden', 'posts'), detail: null });
        const feed = await screen.findByRole('feed', { name: 'Posts matching “hidden”' });
        await waitFor(() => expect(within(feed).getAllByRole('article')).toHaveLength(1));
        await waitFor(() => expect(screen.getByText('1 post found')).toBeTruthy());
        expect(screen.queryByText('No posts found')).toBeNull();
    });

    it('lists groups where the site has them', async () => {
        renderSearch({ list: searchRoute('lily', 'groups'), detail: null });
        const list = await screen.findByRole('list', { name: 'Groups matching “lily”' });
        expect(within(list).getByText('Group')).toBeTruthy();
    });

    it('says when nobody matches', async () => {
        renderSearch({ list: searchRoute('nobody'), detail: null });
        expect(await screen.findByText('Nobody matches “nobody”.')).toBeTruthy();
    });

    it('Ctrl+F opens Search with focus in the field, and again selects its words', async () => {
        const { history } = renderSearch(sectionRoute('home'));
        fireEvent.keyDown(document.body, { key: 'f', code: 'KeyF', ctrlKey: true });
        await waitFor(() => expect(document.activeElement).toBe(box()));
        expect(routeToPath(history.current)).toBe('/search');
        fireEvent.change(box(), { target: { value: 'lily' } });
        await waitFor(() => expect(routeToPath(history.current)).toBe('/search?q=lily'));
        (document.activeElement as HTMLElement).blur();
        fireEvent.keyDown(document.body, { key: 'f', code: 'KeyF', ctrlKey: true });
        expect(document.activeElement).toBe(box());
        expect(box().selectionStart).toBe(0);
        expect(box().selectionEnd).toBe(4);
    });
});
