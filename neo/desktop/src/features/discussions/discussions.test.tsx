import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { MenuHost } from '../../components/menu-popover';
import { SAVE_ANSWER_MS } from '../../lib/api';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { draftKey, draftStore, setDraftStore } from '../../lib/drafts';
import { opensInWindow } from '../../lib/open-in-window';
import { parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { secondaryRoute } from '../../secondary';
import { DetailPane } from '../../shell/detail-pane';
import { Discussions } from './discussion-list';
import { repliesLine, startedLine, stateText } from './discussions';
import { richText, setRichText, typeRich } from '../../components/rich-editor/test-utils';

type Discussion = Schema<'Discussion'>;
type Summary = Schema<'Profile'>;

const andrey: Summary = { id: '65', kind: 'person', module: 'bx_persons', display_name: 'Andrey', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const lily: Summary = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '1', email: 'a@example.com' }, active_profile_id: '65', profiles: [{ ...andrey, about: '', created_at: '2026-01-01T00:00:00Z' }] };

function discussion(id: string, over: Partial<Discussion> = {}): Discussion {
    return {
        id,
        content_id: `90${id}`,
        title: `Discussion ${id}`,
        summary: 'What do you think?',
        body: 'What do you think?',
        body_html: '<p>What do you think?</p>',
        author: lily,
        anonymous: false,
        category: { id: '1', title: 'General' },
        audience: 'public',
        context_id: null,
        stats: { replies: 2, views: 5 },
        sticky: false,
        locked: false,
        resolved: null,
        last_reply_at: '2026-11-05T10:00:00Z',
        last_reply_by: andrey,
        url: 'https://community.example/view-discussion/x',
        created_at: '2026-11-04T10:00:00Z',
        updated_at: '2026-11-04T10:00:00Z',
        viewer: { can_edit: false, can_edit_text: false, can_delete: false, can_reply: true },
        ...over,
    };
}

function activity(itemId: string, comments = 1): Schema<'Activity'> {
    return {
        id: itemId,
        verb: 'posted',
        actor: lily,
        owner_id: '4',
        object: {
            id: itemId,
            kind: 'content',
            module: 'bx_forum',
            author: lily,
            anonymous: false,
            audience: 'public',
            context_id: null,
            card: { title: 'Discussion', text: 'What do you think?', body_html: null, url: null },
            media: [],
            links: [],
            stats: { comments, reactions: 0, reposts: 0, views: 0 },
            published_at: '2026-11-04T10:00:00Z',
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
        },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-04T10:00:00Z',
    } as Schema<'Activity'>;
}

const reply = (id: string, body: string): Schema<'Comment'> => ({
    id,
    target_id: '9015',
    parent_id: null,
    depth: 0,
    author: lily,
    body,
    body_html: `<p>${body}</p>`,
    replies: 0,
    pinned: false,
    created_at: '2026-11-05T10:00:00Z',
    viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
});

type Answer = { status: number; body?: unknown };
type Handler = (request: Request) => Answer | Promise<Answer>;
const notFound: Answer = { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'no_such_endpoint' } };

function fakeApi(routes: Record<string, Handler>, calls: string[]): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const handler = routes[`${request.method} ${path}`];
            // a request that is stopped fails as fetch has it, answered or not
            const stopped = new Promise<never>((_, reject) => request.signal.addEventListener('abort', () => reject(request.signal.reason as Error), { once: true }));
            stopped.catch(() => {});
            if (!handler) return stopped;
            const { status, body } = await Promise.race([handler(request), stopped]);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

function renderWith(route: Route, routes: Record<string, Handler>, ui: (history: RouteHistory) => ReactNode, prime?: (client: QueryClient) => void) {
    const calls: string[] = [];
    const api = fakeApi(routes, calls);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    prime?.(client);
    const history = new RouteHistory(route);
    const ctx = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} } as unknown as AppContextValue;
    render(
        <QueryClientProvider client={client}>
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    {ui(history)}
                    <MenuHost />
                </RouterProvider>
            </AppContext.Provider>
        </QueryClientProvider>,
    );
    return { calls, history, client };
}

const setup = (canCreate = true): Handler => () => ({ status: 200, body: { categories: [{ id: '1', title: 'General' }], can_create: canCreate } });

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    setDraftStore(null);
});

describe('a discussion row', () => {
    it('says who started it, where, and who replied last', () => {
        const mine = new Set(['65']);
        expect(startedLine(discussion('1'), 'Design Circle')).toBe('Lily Carter · General · in Design Circle');
        expect(startedLine(discussion('1', { anonymous: true, author: null, category: null }))).toBe('Anonymous');
        expect(repliesLine(discussion('1'), mine)).toBe('2 replies, last from you');
        expect(repliesLine(discussion('1', { last_reply_by: lily }), mine)).toBe('2 replies, last from Lily');
        expect(repliesLine(discussion('1', { stats: { replies: 0, views: 0 }, last_reply_by: null }), mine)).toBe('No replies');
        expect(stateText(discussion('1', { sticky: true, locked: true }))).toBe(', pinned, closed to replies');
        expect(stateText(discussion('1'))).toBe('');
    });
});

describe('the Discussions list', () => {
    it('lists them, latest reply first, and opens one in the detail pane', async () => {
        const { calls, history } = renderWith(
            sectionRoute('discussions'),
            {
                'GET /discussions/categories': setup(),
                'GET /discussions': (r) =>
                    new URL(r.url).searchParams.get('sort') === 'new'
                        ? { status: 200, body: { items: [discussion('16')], next_cursor: null } }
                        : { status: 200, body: { items: [discussion('15', { sticky: true }), discussion('14')], next_cursor: null } },
            },
            () => <Discussions />,
        );
        const list = await screen.findByRole('list', { name: 'Discussions, latest reply first' });
        const rows = within(list).getAllByRole('button');
        expect(rows.map((r) => r.querySelector('bdi')?.textContent)).toEqual(['Discussion 15', 'Discussion 14']);
        expect(rows[0]?.textContent).toContain('Lily Carter · General');
        expect(rows[0]?.textContent).toContain('2 replies, last from you');
        expect(rows[0]?.textContent).toContain(', pinned');
        // seen too: a pin after the title, hidden from screen readers (the name says it)
        const marks = rows[0]?.querySelector('.discussion-marks');
        expect(marks?.getAttribute('aria-hidden')).toBe('true');
        expect(marks?.querySelector('[data-mark="pin"]')).toBeTruthy();
        expect(rows[1]?.querySelector('.discussion-marks')).toBeNull();
        expect(calls).toContain('GET /discussions?sort=latest&limit=30');

        fireEvent.click(rows[1]!);
        expect(routeToPath(history.current)).toBe('/discussions/discussion/14');
        expect(rows[1]?.getAttribute('aria-current')).toBe('true');

        // New: the order is in the route, the open discussion stays open
        fireEvent.click(screen.getByRole('tab', { name: 'New' }));
        expect(routeToPath(history.current)).toBe('/discussions/discussion/14?feed=new');
        expect(await screen.findByRole('list', { name: 'Discussions, newest first' })).toBeTruthy();
        expect(calls).toContain('GET /discussions?sort=new&limit=30');
    });

    it('starts a new one from the toolbar, which says why when the viewer may not', async () => {
        const { history } = renderWith(sectionRoute('discussions'), { 'GET /discussions/categories': setup(), 'GET /discussions': () => ({ status: 200, body: { items: [], next_cursor: null } }) }, () => <Discussions />);
        expect(await screen.findByText('No discussions yet')).toBeTruthy();
        fireEvent.click(screen.getAllByRole('button', { name: 'New discussion' })[0]!);
        expect(routeToPath(history.current)).toBe('/discussions/new-discussion');
        cleanup();

        const second = renderWith(sectionRoute('discussions'), { 'GET /discussions/categories': setup(false), 'GET /discussions': () => ({ status: 200, body: { items: [], next_cursor: null } }) }, () => <Discussions />);
        const button = await screen.findByRole('button', { name: 'New discussion' });
        await waitFor(() => expect(button.getAttribute('aria-disabled')).toBe('true'));
        fireEvent.click(button);
        expect(routeToPath(second.history.current)).toBe('/discussions');
    });

    it('says so on a site without Discussions, and asks for no list', async () => {
        const { calls } = renderWith(sectionRoute('discussions'), { 'GET /discussions/categories': () => notFound }, () => <Discussions />);
        expect(await screen.findByText('This network has no discussions.')).toBeTruthy();
        expect(calls.some((c) => c.startsWith('GET /discussions?'))).toBe(false);
        expect(screen.queryByRole('button', { name: 'New discussion' })).toBeNull();
    });
});

describe('a discussion in the detail pane', () => {
    const route: Route = { list: { section: 'discussions' }, detail: { kind: 'discussion', id: '15' } };

    it('shows it with its replies, and a reply goes to its Item’s comments', async () => {
        const posted: unknown[] = [];
        const { calls } = renderWith(
            route,
            {
                'GET /discussions/15': () => ({ status: 200, body: discussion('15') }),
                'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
                'GET /content/9015/comments': () => ({ status: 200, body: { items: [reply('501', 'Rye, one spoonful')], next_cursor: null } }),
                'POST /content/9015/comments': async (r) => {
                    posted.push(await r.json());
                    return { status: 201, body: reply('502', 'Thanks') };
                },
                'GET /content/9015': () => ({ status: 200, body: activity('9015', 2).object }),
                'GET /discussions/categories': setup(),
            },
            (history) => <DetailPane route={history.current} />,
        );
        expect(await screen.findByRole('heading', { name: 'Discussion 15', level: 2 })).toBeTruthy();
        expect(screen.getByText('What do you think?')).toBeTruthy();
        expect(screen.getByText(/2 replies/)).toBeTruthy();
        expect(await screen.findByRole('heading', { name: /Replies/ })).toBeTruthy();
        expect(await screen.findByText('Rye, one spoonful')).toBeTruthy();
        expect(screen.getByText('Replying as Andrey')).toBeTruthy();

        const box = screen.getByRole('textbox', { name: 'Write a reply' });
        setRichText(box, 'Thanks');
        fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
        await waitFor(() => expect(posted).toEqual([{ body_html: '<p>Thanks</p>' }]));
        expect(await screen.findByText('Reply posted')).toBeTruthy();
        expect(calls).toContain('GET /discussions/15');
        // only what the viewer may do: someone else's discussion has no Edit or Delete
        fireEvent.click(screen.getByRole('button', { name: 'More for the discussion' }));
        expect(screen.getByRole('menuitem', { name: 'Copy Link' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Edit Discussion' })).toBeNull();
        expect(screen.queryByRole('menuitem', { name: /Delete Discussion/ })).toBeNull();
    });

    it('shows badges after the names of who started it and who replied', async () => {
        const badges: Schema<'ProfileBadge'>[] = [
            { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' },
            { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' },
            { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' },
        ];
        const badged = { ...lily, badges };
        renderWith(
            route,
            {
                'GET /discussions/15': () => ({ status: 200, body: discussion('15', { author: badged }) }),
                'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
                'GET /content/9015/comments': () => ({ status: 200, body: { items: [{ ...reply('501', 'Rye, one spoonful'), author: badged }], next_cursor: null } }),
                'GET /discussions/categories': setup(),
            },
            (history) => <DetailPane route={history.current} />,
        );
        const pills = (el: Element) => Array.from(el.querySelectorAll('.badges-pills .badge')).map((b) => b.textContent?.trim());
        await screen.findByRole('heading', { name: 'Discussion 15', level: 2 });
        const head = document.querySelector('.discussion-by') as HTMLElement;
        const name = within(head).getByRole('button', { name: 'Lily Carter' });
        expect(name.nextElementSibling?.classList.contains('badges')).toBe(true);
        expect(pills(head)).toEqual(['Founder', 'Moderator', '+1']);
        expect(head.textContent).toContain(', Founder, Moderator, Top contributor');
        const answer = await screen.findByRole('article', { name: /^Lily Carter ?, Founder, Moderator, Top contributor$/ });
        expect(pills(answer)).toEqual(['Founder', 'Moderator', '+1']);
    });

    it('is edited in place and deleted from its More menu by its author', async () => {
        const own = discussion('15', { author: andrey, body: 'Old text', body_html: '<p>Old text</p>', viewer: { can_edit: true, can_edit_text: true, can_delete: true, can_reply: true } });
        const patched: unknown[] = [];
        let deleted = false;
        const { history } = renderWith(
            route,
            {
                'GET /discussions/15': () => ({ status: 200, body: own }),
                'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
                'GET /content/9015/comments': () => ({ status: 200, body: { items: [], next_cursor: null } }),
                'GET /discussions/categories': setup(),
                'PATCH /discussions/15': async (r) => {
                    const body = (await r.json()) as { title?: string; body?: string; body_html?: string };
                    patched.push(body);
                    return { status: 200, body: { ...own, title: body.title ?? own.title, body: body.body ?? own.body, body_html: body.body_html ?? `<p>${body.body ?? own.body}</p>` } };
                },
                'DELETE /discussions/15': () => {
                    deleted = true;
                    return { status: 204 };
                },
            },
            (history) => <DetailPane route={history.current} />,
        );
        fireEvent.click(await screen.findByRole('button', { name: 'More for the discussion' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Discussion' }));
        const title = await screen.findByRole('textbox', { name: 'Title' });
        await waitFor(() => expect(document.activeElement).toBe(title));
        fireEvent.change(title, { target: { value: 'A better title' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'New text');
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(patched).toEqual([{ title: 'A better title', body_html: '<p>New text</p>' }]));
        expect(await screen.findByText('Discussion saved')).toBeTruthy();
        expect(screen.getByText('New text')).toBeTruthy();

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'More for the discussion' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Discussion…' }));
        await waitFor(() => expect(deleted).toBe(true));
        // gone from the route and from Back and Forward
        await waitFor(() => expect(routeToPath(history.current)).toBe('/discussions'));
    });

    it('says so when it is gone, with a way out', async () => {
        const { history } = renderWith(route, { 'GET /discussions/15': () => notFound }, (h) => <DetailPane route={h.current} />);
        expect(await screen.findByText('This discussion is gone')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(routeToPath(history.current)).toBe('/discussions');
    });
});

describe('a new discussion', () => {
    it('is started with its title and text, and becomes the discussion', async () => {
        const sent: unknown[] = [];
        const { history } = renderWith(
            { list: { section: 'discussions' }, detail: { kind: 'new-discussion' } },
            {
                'GET /discussions/categories': setup(),
                'GET /me/groups': () => ({ status: 200, body: [] }),
                'POST /discussions': async (r) => {
                    sent.push(await r.json());
                    return { status: 201, body: discussion('21', { title: 'Hike pace', author: andrey }) };
                },
            },
            (h) => <DetailPane route={h.current} />,
        );
        const title = await screen.findByRole('textbox', { name: 'Title' });
        fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
        expect(await screen.findByText('Give it a title.')).toBeTruthy();
        expect(document.activeElement).toBe(title);
        expect(sent).toEqual([]);

        fireEvent.change(title, { target: { value: ' Hike pace ' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'How fast is too fast?');
        fireEvent.change(screen.getByRole('combobox', { name: 'Who can see it' }), { target: { value: 'members' } });
        fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
        await waitFor(() => expect(sent).toEqual([{ title: 'Hike pace', body_html: '<p>How fast is too fast?</p>', category_id: '1', audience: 'members' }]));
        await waitFor(() => expect(routeToPath(history.current)).toBe('/discussions/discussion/21'));
        // the form is replaced, not added to: Back does not return to it
        expect(history.snapshot().paths).toEqual(['/discussions/discussion/21']);
    });

    it('in a group goes into the group, with no audience of its own', async () => {
        const sent: unknown[] = [];
        renderWith(
            { list: { section: 'discussions' }, detail: { kind: 'new-discussion', groupId: '67' } },
            {
                'GET /discussions/categories': setup(),
                'GET /me/groups': () => ({ status: 200, body: [] }),
                'POST /discussions': async (r) => {
                    sent.push(await r.json());
                    return { status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'The viewer may not start discussions in this group' } };
                },
            },
            (h) => <DetailPane route={h.current} />,
        );
        fireEvent.change(await screen.findByRole('textbox', { name: 'Title' }), { target: { value: 'In the group' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'Text');
        expect(screen.queryByRole('combobox', { name: 'Who can see it' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
        expect(await screen.findByText('The viewer may not start discussions in this group')).toBeTruthy();
        expect(sent).toEqual([{ title: 'In the group', body_html: '<p>Text</p>', category_id: '1', context_id: '67' }]);
    });
});

describe('a discussion in a window of its own', () => {
    it('is a detail route that opens in a window, with a reply to show in it', () => {
        expect(opensInWindow({ kind: 'discussion', id: '15' })).toBe(true);
        expect(opensInWindow({ kind: 'new-discussion' })).toBe(false);
        const path = routeToPath({ list: { section: 'discussions', feed: 'new' }, detail: { kind: 'discussion', id: '15', comment: '99', thread: '55' } });
        expect(path).toBe('/discussions/discussion/15/comment-99-in-55?feed=new');
        expect(parseRoute(path)?.detail).toEqual({ kind: 'discussion', id: '15', comment: '99', thread: '55' });
        expect(secondaryRoute('/discussions/discussion/15')?.detail).toEqual({ kind: 'discussion', id: '15' });
        expect(parseRoute('/discussions/new-discussion/67')?.detail).toEqual({ kind: 'new-discussion', groupId: '67' });
        expect(parseRoute('/discussions/new-discussion/x')).toBeNull();
        expect(parseRoute('/discussions?feed=hot')).toBeNull();
    });

    it('can’t be seen, says why and closes', async () => {
        const history = { current: null as RouteHistory | null };
        renderWith({ list: { section: 'discussions' }, detail: { kind: 'discussion', id: '15' } }, { 'GET /discussions/15': () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden' } }) }, (h) => {
            history.current = h;
            return <DetailPane route={h.current} />;
        });
        expect(await screen.findByText('You can’t see this discussion')).toBeTruthy();
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        });
        expect(history.current?.current.detail).toBeNull();
    });
});

describe('discussion review fixes', () => {
    const route: Route = { list: { section: 'discussions' }, detail: { kind: 'discussion', id: '15' } };
    const own = () => discussion('15', { author: andrey, body: 'Old text', body_html: '<p>Old text</p>', viewer: { can_edit: true, can_edit_text: true, can_delete: true, can_reply: true } });
    const routesFor = (d: Discussion, extra: Record<string, Handler> = {}): Record<string, Handler> => ({
        'GET /discussions/15': () => ({ status: 200, body: d }),
        'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
        'GET /content/9015/comments': () => ({ status: 200, body: { items: [], next_cursor: null } }),
        'GET /discussions/categories': setup(),
        ...extra,
    });
    const openEditor = async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'More for the discussion' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Discussion' }));
        return screen.findByRole('textbox', { name: 'Title' });
    };

    it('asks before Esc or Cancel throw away changes, and keeps them when told no', async () => {
        renderWith(route, routesFor(own()), (h) => <DetailPane route={h.current} />);
        const title = await openEditor();
        // the toolbar's title shows while the hero's is replaced by the form
        expect(document.querySelector('.pane-title-hero')).toBeNull();
        // Cancel comes before Save
        const buttons = within(title.closest('form')!)
            .getAllByRole('button')
            .map((b) => b.textContent);
        expect(buttons.slice(-2)).toEqual(['Cancel', 'Save']);

        fireEvent.change(title, { target: { value: 'Changed' } });
        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.keyDown(title, { key: 'Escape' });
        await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
        expect(ask.mock.calls[0]?.[0]).toContain('Discard your changes?');
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeTruthy();

        ask.mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull());
        expect(ask).toHaveBeenCalledTimes(2);
    });

    it('closes an unchanged editor at once, and saves with Cmd+Enter', async () => {
        const patched: unknown[] = [];
        renderWith(
            route,
            routesFor(own(), {
                'PATCH /discussions/15': async (r) => {
                    patched.push(await r.json());
                    return { status: 200, body: { ...own(), title: 'Saved by keys' } };
                },
            }),
            (h) => <DetailPane route={h.current} />,
        );
        let title = await openEditor();
        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.keyDown(title, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull());
        expect(ask).not.toHaveBeenCalled();

        title = await openEditor();
        fireEvent.change(title, { target: { value: 'Saved by keys' } });
        fireEvent.keyDown(title, { key: 'Enter', metaKey: true, ctrlKey: true });
        await waitFor(() => expect(patched).toEqual([{ title: 'Saved by keys' }]));
    });

    it('marks the field it refused and says why in its description', async () => {
        renderWith(route, routesFor(own()), (h) => <DetailPane route={h.current} />);
        const title = await openEditor();
        fireEvent.change(title, { target: { value: '  ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        const error = await screen.findByText('Give it a title.');
        expect(title.getAttribute('aria-invalid')).toBe('true');
        expect(title.getAttribute('aria-describedby')).toBe(error.id);
        expect(document.activeElement).toBe(title);
        // the text has no error and keeps its hint
        const text = screen.getByRole('textbox', { name: 'Text' });
        expect(text.getAttribute('aria-invalid')).toBeNull();
        expect(text.getAttribute('aria-describedby')).toMatch(/-body-hint$/);
    });

    it('edits a formatted text as HTML, with the full toolbar', async () => {
        const patched: unknown[] = [];
        const formatted = discussion('15', { author: andrey, body_html: '<p>A <a href="https://una.io">link</a> and <strong>bold</strong></p>', viewer: { can_edit: true, can_edit_text: false, can_delete: false, can_reply: true } });
        renderWith(
            route,
            routesFor(formatted, {
                'PATCH /discussions/15': async (r) => {
                    patched.push(await r.json());
                    return { status: 200, body: formatted };
                },
            }),
            (h) => <DetailPane route={h.current} />,
        );
        await openEditor();
        const box = screen.getByRole('textbox', { name: 'Text' });
        expect(richText(box)).toBe('A link and bold');
        expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeTruthy();
        typeRich(box, ' more');
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(patched).toEqual([{ body_html: '<p>A <a href="https://una.io">link</a> and <strong>bold more</strong></p>' }]));
    });

    it('has Reply and Copy link under it, and calls its replies replies', async () => {
        const mine = { ...reply('501', 'Mine'), author: andrey, viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true } };
        renderWith(route, routesFor(discussion('15'), { 'GET /content/9015/comments': () => ({ status: 200, body: { items: [mine], next_cursor: null } }) }), (h) => <DetailPane route={h.current} />);
        await screen.findByText('Mine');
        fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Write a reply' }));
        expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Edit the reply by Andrey' })).toBeTruthy();

        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(screen.getByRole('button', { name: 'Delete the reply by Andrey' }));
        await waitFor(() => expect(ask).toHaveBeenCalled());
        expect(ask.mock.calls[0]?.[0]).toContain('Delete this reply?');
    });

    it('says it is closed to replies where the reply box would be', async () => {
        const closed = activity('9015');
        closed.object.viewer!.can_comment = false;
        const locked = discussion('15', { locked: true, viewer: { can_edit: false, can_edit_text: false, can_delete: false, can_reply: false } });
        renderWith(route, routesFor(locked, { 'GET /activities/9015': () => ({ status: 200, body: closed }) }), (h) => <DetailPane route={h.current} />);
        expect(await screen.findByText('Closed to replies.')).toBeTruthy();
        expect(screen.queryByRole('textbox', { name: 'Write a reply' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull();
    });

    it('gives a 403 a neutral reason unless a list showed it in a group', async () => {
        const forbidden: Handler = () => ({ status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden' } });
        renderWith(route, { 'GET /discussions/15': forbidden }, (h) => <DetailPane route={h.current} />);
        expect(await screen.findByText('Its author shares it with some people only.')).toBeTruthy();
        cleanup();

        const inGroup = discussion('15', { audience: 'context', context_id: '67' });
        renderWith(route, { 'GET /discussions/15': forbidden }, (h) => <DetailPane route={h.current} />, (client) =>
            client.setQueryData(['discussions', 'list', 'latest', ''], { pages: [{ items: [inGroup], next_cursor: null }], pageParams: [undefined] }),
        );
        expect(await screen.findByText('It is in a group you are not in.')).toBeTruthy();
    });
});

describe('a new discussion’s draft', () => {
    const newRoute: Route = { list: { section: 'discussions' }, detail: { kind: 'new-discussion' } };
    const key = draftKey('https://community.example', '65', 'discussion-new');

    it('is kept when the form closes and comes back with it', async () => {
        const routes: Record<string, Handler> = { 'GET /discussions/categories': setup(), 'GET /me/groups': () => ({ status: 200, body: [] }) };
        renderWith(newRoute, routes, (h) => <DetailPane route={h.current} />);
        const title = await screen.findByRole('textbox', { name: 'Title' });
        // the (empty) draft is read before typing counts
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        fireEvent.change(title, { target: { value: 'Half written' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'Some of it');
        cleanup();
        await waitFor(async () => expect((await draftStore().get(key))?.title).toBe('Half written'));

        renderWith(newRoute, routes, (h) => <DetailPane route={h.current} />);
        await waitFor(() => expect((screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement).value).toBe('Half written'));
        expect(richText(screen.getByRole('textbox', { name: 'Text' }))).toBe('Some of it');
    });

    it('marks an empty text as the reason, and is gone once started', async () => {
        const routes: Record<string, Handler> = {
            'GET /discussions/categories': setup(),
            'GET /me/groups': () => ({ status: 200, body: [] }),
            'POST /discussions': () => ({ status: 201, body: discussion('21', { title: 'Started', author: andrey }) }),
        };
        const { history } = renderWith(newRoute, routes, (h) => <DetailPane route={h.current} />);
        const title = await screen.findByRole('textbox', { name: 'Title' });
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        fireEvent.change(title, { target: { value: 'Started' } });
        const text = screen.getByRole('textbox', { name: 'Text' });
        fireEvent.keyDown(text, { key: 'Enter', metaKey: true, ctrlKey: true });
        const error = await screen.findByText('Write what it is about.');
        expect(text.getAttribute('aria-invalid')).toBe('true');
        expect(text.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
        setRichText(text, 'Now with text');
        fireEvent.keyDown(text, { key: 'Enter', metaKey: true, ctrlKey: true });
        await waitFor(() => expect(routeToPath(history.current)).toBe('/discussions/discussion/21'));
        await waitFor(async () => expect(await draftStore().get(key)).toBeUndefined());
    });
});

describe('a picture of a discussion’s text that is still uploading', () => {
    const PICTURE = 'https://community.example/image_transcoder.php?o=sys_images_editor&h=7&s=abc';
    const PICTURE_ANSWER: Answer = { status: 201, body: { url: PICTURE, width: 640, height: 480, mime_type: 'image/png' } };
    const HOLD = 'Wait until the uploads are done.';
    const later = () => {
        let give: (answer: Answer) => void = () => {};
        const answer = new Promise<Answer>((resolve) => (give = resolve));
        return { answer, give };
    };
    const pastePicture = (box: HTMLElement) => fireEvent.paste(box, { clipboardData: { files: [new File([new Uint8Array([137, 80, 78, 71])], 'map.png', { type: 'image/png' })], getData: () => '' } });
    /** What a held button says of itself: the words its aria-describedby points to. */
    const heldFor = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-describedby') ?? '')?.textContent ?? null;
    /** Presses the button the moment the picture is in the text: the form is not drawn with it yet. */
    const pressWhenPictured = (text: HTMLElement, button: HTMLElement) => {
        const state = { pressed: false };
        const seen = new MutationObserver(() => {
            if (state.pressed || !text.querySelector('img')) return;
            state.pressed = true;
            fireEvent.click(button);
        });
        seen.observe(text, { childList: true, subtree: true });
        return { state, stop: () => seen.disconnect() };
    };

    const newRoute: Route = { list: { section: 'discussions' }, detail: { kind: 'new-discussion' } };
    const newRoutes = (upload: Promise<Answer>, sent: { title: string; body_html?: string }[]): Record<string, Handler> => ({
        'GET /discussions/categories': setup(),
        'GET /me/groups': () => ({ status: 200, body: [] }),
        'POST /uploads/inline': () => upload,
        'POST /discussions': async (r) => {
            sent.push((await r.json()) as { title: string; body_html?: string });
            return { status: 201, body: discussion('21', { title: 'With a map', author: andrey }) };
        },
    });

    it('holds Start discussion from the paste until it is in the text, and starts it with the picture', async () => {
        const upload = later();
        const sent: { title: string; body_html?: string }[] = [];
        const { calls } = renderWith(newRoute, newRoutes(upload.answer, sent), (h) => <DetailPane route={h.current} />);
        const title = await screen.findByRole('textbox', { name: 'Title' });
        fireEvent.change(title, { target: { value: 'With a map' } });
        const text = screen.getByRole('textbox', { name: 'Text' });
        setRichText(text, 'See the map');
        const start = screen.getByRole('button', { name: 'Start discussion' });
        expect(start.getAttribute('aria-disabled')).toBeNull();
        expect(heldFor(start)).toMatch(/^What you type is kept/);
        const look = start.className;
        pastePicture(text);
        // from the paste on, not only once the upload has started
        await waitFor(() => expect(start.getAttribute('aria-disabled')).toBe('true'));
        expect(heldFor(start)).toBe(HOLD);
        // the same button, as it was: a real one that still takes focus and the press
        expect((start as HTMLButtonElement).disabled).toBe(false);
        expect(start.className).toBe(look);
        await waitFor(() => expect(calls).toContain('POST /uploads/inline'));
        expect(start.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(start);
        fireEvent.keyDown(title, { key: 'Enter', metaKey: true, ctrlKey: true });
        await act(async () => {});
        expect(sent).toEqual([]);
        upload.give(PICTURE_ANSWER);
        await waitFor(() => expect(start.getAttribute('aria-disabled')).toBeNull());
        expect(heldFor(start)).toMatch(/^What you type is kept/);
        expect(text.querySelector('img')).toBeTruthy();
        fireEvent.click(start);
        await waitFor(() => expect(sent).toHaveLength(1));
        expect(sent[0]?.body_html).toContain('<img src=');
    });

    it('holds a Start discussion pressed when the picture has come and the form is not drawn with it yet', async () => {
        const upload = later();
        const sent: { title: string; body_html?: string }[] = [];
        const { calls } = renderWith(newRoute, newRoutes(upload.answer, sent), (h) => <DetailPane route={h.current} />);
        fireEvent.change(await screen.findByRole('textbox', { name: 'Title' }), { target: { value: 'With a map' } });
        const text = screen.getByRole('textbox', { name: 'Text' });
        setRichText(text, 'See the map');
        const start = screen.getByRole('button', { name: 'Start discussion' });
        pastePicture(text);
        await waitFor(() => expect(calls).toContain('POST /uploads/inline'));
        const press = pressWhenPictured(text, start);
        upload.give(PICTURE_ANSWER);
        await waitFor(() => expect(press.state.pressed).toBe(true));
        press.stop();
        await waitFor(() => expect(start.getAttribute('aria-disabled')).toBeNull());
        // not started with the text as it was before the picture
        expect(sent).toEqual([]);
        fireEvent.click(start);
        await waitFor(() => expect(sent).toHaveLength(1));
        expect(sent[0]?.body_html).toContain('<img src=');
    });

    const route: Route = { list: { section: 'discussions' }, detail: { kind: 'discussion', id: '15' } };
    const own = discussion('15', { author: andrey, body: 'Old text', body_html: '<p>Old text</p>', viewer: { can_edit: true, can_edit_text: true, can_delete: true, can_reply: true } });
    const editRoutes = (upload: () => Promise<Answer>, patched: { title?: string; body_html?: string }[]): Record<string, Handler> => ({
        'GET /discussions/15': () => ({ status: 200, body: own }),
        'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
        'GET /content/9015/comments': () => ({ status: 200, body: { items: [], next_cursor: null } }),
        'GET /discussions/categories': setup(),
        'POST /uploads/inline': upload,
        'PATCH /discussions/15': async (r) => {
            const body = (await r.json()) as { title?: string; body_html?: string };
            patched.push(body);
            return { status: 200, body: { ...own, body_html: body.body_html ?? own.body_html } };
        },
    });
    const openEditor = async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'More for the discussion' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Discussion' }));
        return screen.findByRole('textbox', { name: 'Title' });
    };

    it('holds Save while it uploads, counts it as a change for Esc and Cancel, and saves the text with it', async () => {
        const uploads = [later(), later()];
        let asked = 0;
        const patched: { title?: string; body_html?: string }[] = [];
        const { calls } = renderWith(
            route,
            editRoutes(() => uploads[asked++]!.answer, patched),
            (h) => <DetailPane route={h.current} />,
        );
        const title = await openEditor();
        const save = screen.getByRole('button', { name: 'Save' });
        const text = screen.getByRole('textbox', { name: 'Text' });
        expect(save.getAttribute('aria-disabled')).toBeNull();
        expect(save.getAttribute('aria-describedby')).toBeNull();
        pastePicture(text);
        await waitFor(() => expect(save.getAttribute('aria-disabled')).toBe('true'));
        expect(heldFor(save)).toBe(HOLD);
        expect((save as HTMLButtonElement).disabled).toBe(false);
        await waitFor(() => expect(calls).toContain('POST /uploads/inline'));
        // nothing else changed: Esc and Cancel still ask, for the picture on its way
        const ask = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.keyDown(title, { key: 'Escape' });
        await waitFor(() => expect(ask).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(ask).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('form', { name: 'Edit the discussion' })).toBeTruthy();
        // an upload the site refuses holds nothing any longer
        uploads[0]?.give({ status: 413, body: { type: 'urn:una:problem:too_large', title: 'Too large', status: 413, code: 'too_large' } });
        await waitFor(() => expect(save.getAttribute('aria-disabled')).toBeNull());
        pastePicture(text);
        await waitFor(() => expect(calls.filter((c) => c === 'POST /uploads/inline')).toHaveLength(2));
        expect(save.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(save);
        fireEvent.keyDown(title, { key: 'Enter', metaKey: true, ctrlKey: true });
        await act(async () => {});
        // not closed as unchanged, with the picture lost
        expect(patched).toEqual([]);
        expect(screen.getByRole('form', { name: 'Edit the discussion' })).toBeTruthy();
        uploads[1]?.give(PICTURE_ANSWER);
        await waitFor(() => expect(save.getAttribute('aria-disabled')).toBeNull());
        expect(save.getAttribute('aria-describedby')).toBeNull();
        fireEvent.click(save);
        expect(await screen.findByText('Discussion saved')).toBeTruthy();
        expect(patched).toHaveLength(1);
        expect(patched[0]?.body_html).toContain('<img src=');
    });

    it('holds a Save pressed when the picture has come and the form is not drawn with it yet', async () => {
        const upload = later();
        const patched: { title?: string; body_html?: string }[] = [];
        const { calls } = renderWith(
            route,
            editRoutes(() => upload.answer, patched),
            (h) => <DetailPane route={h.current} />,
        );
        await openEditor();
        const save = screen.getByRole('button', { name: 'Save' });
        const text = screen.getByRole('textbox', { name: 'Text' });
        pastePicture(text);
        await waitFor(() => expect(calls).toContain('POST /uploads/inline'));
        const press = pressWhenPictured(text, save);
        upload.give(PICTURE_ANSWER);
        await waitFor(() => expect(press.state.pressed).toBe(true));
        press.stop();
        // not closed as unchanged, with the picture lost
        expect(screen.getByRole('form', { name: 'Edit the discussion' })).toBeTruthy();
        expect(patched).toEqual([]);
        await waitFor(() => expect(save.getAttribute('aria-disabled')).toBeNull());
        fireEvent.click(save);
        expect(await screen.findByText('Discussion saved')).toBeTruthy();
        expect(patched).toHaveLength(1);
        expect(patched[0]?.body_html).toContain('<img src=');
    });
});

describe('a discussion form that is being sent', () => {
    const TWO: Handler = () => ({ status: 200, body: { categories: [{ id: '1', title: 'General' }, { id: '2', title: 'Hikes' }], can_create: true } });
    /** An answer the test gives when it chooses, or fails as a request that got none. */
    const later = () => {
        let give: (answer: Answer) => void = () => {};
        let lose: () => void = () => {};
        const answer = new Promise<Answer>((resolve, reject) => {
            give = resolve;
            lose = () => reject(new TypeError('Load failed'));
        });
        return { answer, give, lose };
    };
    const pastePicture = (box: HTMLElement) => fireEvent.paste(box, { clipboardData: { files: [new File([new Uint8Array([137, 80, 78, 71])], 'map.png', { type: 'image/png' })], getData: () => '' } });
    /** The fields take no change, and the lists keep the keyboard: disabled would drop focus to the page. */
    const expectHeld = (title: HTMLInputElement, text: HTMLElement, lists: HTMLSelectElement[]) => {
        expect(title.readOnly).toBe(true);
        expect(text.getAttribute('aria-readonly')).toBe('true');
        for (const list of lists) {
            expect(list.getAttribute('aria-disabled')).toBe('true');
            expect(list.disabled).toBe(false);
            expect(fireEvent.mouseDown(list)).toBe(false);
            expect(fireEvent.keyDown(list, { key: 'ArrowDown' })).toBe(false);
            expect(fireEvent.keyDown(list, { key: 'Tab' })).toBe(true);
        }
    };
    const expectFree = (title: HTMLInputElement, text: HTMLElement, lists: HTMLSelectElement[]) => {
        expect(title.readOnly).toBe(false);
        expect(text.getAttribute('aria-readonly')).toBeNull();
        for (const list of lists) expect(list.getAttribute('aria-disabled')).toBeNull();
    };

    const newRoute: Route = { list: { section: 'discussions' }, detail: { kind: 'new-discussion' } };
    type Sent = { key: string | null; body: unknown };
    const newRoutes = (sent: Sent[], first: Promise<Answer>): Record<string, Handler> => ({
        'GET /discussions/categories': TWO,
        'GET /me/groups': () => ({ status: 200, body: [] }),
        'POST /discussions': async (r) => {
            sent.push({ key: r.headers.get('Idempotency-Key'), body: await r.json() });
            return sent.length === 1 ? first : { status: 201, body: discussion('21', { title: 'Hike pace', author: andrey }) };
        },
    });
    const fillNew = async () => {
        const title = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement;
        // the (empty) draft is read before typing counts
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });
        fireEvent.change(title, { target: { value: 'Hike pace' } });
        const text = screen.getByRole('textbox', { name: 'Text' });
        setRichText(text, 'How fast is too fast?');
        const category = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        const who = screen.getByRole('combobox', { name: 'Who can see it' }) as HTMLSelectElement;
        fireEvent.change(category, { target: { value: '2' } });
        fireEvent.change(who, { target: { value: 'members' } });
        return { title, text, category, who, start: screen.getByRole('button', { name: 'Start discussion' }) };
    };
    const BODY = { title: 'Hike pace', body_html: '<p>How fast is too fast?</p>', category_id: '2', audience: 'members' };

    it('takes no change while a new one is being started, and takes them again with what was typed when it was not started', async () => {
        const first = later();
        const sent: Sent[] = [];
        const { history, calls } = renderWith(newRoute, newRoutes(sent, first.answer), (h) => <DetailPane route={h.current} />);
        const { title, text, category, who, start } = await fillNew();
        fireEvent.click(start);
        await waitFor(() => expect(start.getAttribute('aria-busy')).toBe('true'));
        expectHeld(title, text, [category, who]);
        fireEvent.change(title, { target: { value: 'Typed while it was sent' } });
        fireEvent.change(category, { target: { value: '1' } });
        fireEvent.change(who, { target: { value: 'friends' } });
        typeRich(text, ' Typed while it was sent');
        pastePicture(text);
        fireEvent.click(start);
        await act(async () => {});
        expect(title.value).toBe('Hike pace');
        expect(category.value).toBe('2');
        expect(who.value).toBe('members');
        expect(richText(text)).toBe('How fast is too fast?');
        expect(calls).not.toContain('POST /uploads/inline');
        expect(sent).toHaveLength(1);
        // it was not started: the form stays, with what was typed, and takes changes again
        first.lose();
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('The discussion was not started: Load failed'));
        expect(start.getAttribute('aria-busy')).toBeNull();
        expectFree(title, text, [category, who]);
        expect(title.value).toBe('Hike pace');
        expect(richText(text)).toBe('How fast is too fast?');
        fireEvent.click(start);
        await waitFor(() => expect(routeToPath(history.current)).toBe('/discussions/discussion/21'));
        expect(sent.map((s) => s.body)).toEqual([BODY, BODY]);
        expect(sent[0]?.key).toBeTruthy();
        expect(sent[1]?.key).toBe(sent[0]?.key);
    });

    it('waits for an answer that takes longer than a save may: the discussion is not said to be unstarted, is sent once, and opens', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            const first = later();
            const sent: Sent[] = [];
            const { history } = renderWith(newRoute, newRoutes(sent, first.answer), (h) => <DetailPane route={h.current} />);
            const { title, text, category, who, start } = await fillNew();
            fireEvent.click(start);
            await waitFor(() => expect(start.getAttribute('aria-busy')).toBe('true'));
            // the site is still making it: stopped here and started again changed, it would be there twice
            await act(async () => vi.advanceTimersByTimeAsync(SAVE_ANSWER_MS + 5000));
            expect(screen.queryByRole('alert')).toBeNull();
            expect(start.getAttribute('aria-busy')).toBe('true');
            expectHeld(title, text, [category, who]);
            fireEvent.click(start);
            first.give({ status: 201, body: discussion('21', { title: 'Hike pace', author: andrey }) });
            await waitFor(() => expect(routeToPath(history.current)).toBe('/discussions/discussion/21'));
            expect(sent).toHaveLength(1);
        } finally {
            vi.useRealTimers();
        }
    });

    const route: Route = { list: { section: 'discussions' }, detail: { kind: 'discussion', id: '15' } };
    const own = discussion('15', { author: andrey, body: 'Old text', body_html: '<p>Old text</p>', viewer: { can_edit: true, can_edit_text: true, can_delete: true, can_reply: true } });
    const editRoutes = (sent: Sent[], first: Promise<Answer>): Record<string, Handler> => ({
        'GET /discussions/15': () => ({ status: 200, body: own }),
        'GET /activities/9015': () => ({ status: 200, body: activity('9015') }),
        'GET /content/9015/comments': () => ({ status: 200, body: { items: [], next_cursor: null } }),
        'GET /discussions/categories': TWO,
        'PATCH /discussions/15': async (r) => {
            sent.push({ key: r.headers.get('Idempotency-Key'), body: await r.json() });
            return sent.length === 1 ? first : { status: 200, body: { ...own, title: 'A better title' } };
        },
    });
    const openEditor = async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'More for the discussion' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Discussion' }));
        const title = (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement;
        fireEvent.change(title, { target: { value: 'A better title' } });
        return { title, text: screen.getByRole('textbox', { name: 'Text' }), category: (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement, save: screen.getByRole('button', { name: 'Save' }) };
    };

    it('takes no change while one is being saved, and takes them again with what was typed when it was not saved', async () => {
        const first = later();
        const sent: Sent[] = [];
        const { calls } = renderWith(route, editRoutes(sent, first.answer), (h) => <DetailPane route={h.current} />);
        const { title, text, category, save } = await openEditor();
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        expectHeld(title, text, [category]);
        fireEvent.change(title, { target: { value: 'Typed while it saved' } });
        fireEvent.change(category, { target: { value: '2' } });
        typeRich(text, ' Typed while it saved');
        pastePicture(text);
        fireEvent.click(save);
        await act(async () => {});
        expect(title.value).toBe('A better title');
        expect(category.value).toBe('1');
        expect(richText(text)).toBe('Old text');
        expect(calls).not.toContain('POST /uploads/inline');
        expect(sent).toHaveLength(1);
        // it was not saved: the form stays, with what was typed, and takes changes again
        first.lose();
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        expect(save.getAttribute('aria-busy')).toBeNull();
        expectFree(title, text, [category]);
        expect(title.value).toBe('A better title');
        fireEvent.click(save);
        expect(await screen.findByText('Discussion saved')).toBeTruthy();
        expect(sent.map((s) => s.body)).toEqual([{ title: 'A better title' }, { title: 'A better title' }]);
        expect(sent[0]?.key).toBeTruthy();
        expect(sent[1]?.key).toBe(sent[0]?.key);
    });

    it('stops a save of one the site never answers: it was not saved, and saving it again goes with the same key', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            const sent: Sent[] = [];
            renderWith(route, editRoutes(sent, new Promise<Answer>(() => {})), (h) => <DetailPane route={h.current} />);
            const { title, text, category, save } = await openEditor();
            fireEvent.click(save);
            await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
            await act(async () => vi.advanceTimersByTimeAsync(SAVE_ANSWER_MS - 1000));
            expect(save.getAttribute('aria-busy')).toBe('true');
            expectHeld(title, text, [category]);
            await act(async () => vi.advanceTimersByTimeAsync(1000));
            await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: the site did not answer in time'));
            expect(save.getAttribute('aria-busy')).toBeNull();
            expectFree(title, text, [category]);
            expect(title.value).toBe('A better title');
            fireEvent.click(save);
            expect(await screen.findByText('Discussion saved')).toBeTruthy();
            expect(sent).toHaveLength(2);
            expect(sent[1]?.key).toBe(sent[0]?.key);
        } finally {
            vi.useRealTimers();
        }
    });

    it('asks before anything else takes a changed edit form away: the pane closing, another discussion, the sidebar', async () => {
        const sent: Sent[] = [];
        const { history } = renderWith(route, editRoutes(sent, new Promise<Answer>(() => {})), (h) => <DetailPane route={h.current} />);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { title } = await openEditor();
        const leaves: Route[] = [{ list: route.list, detail: null }, { list: route.list, detail: { kind: 'discussion', id: '16' } }, { list: { section: 'home' }, detail: null }];
        for (const [i, leave] of leaves.entries()) {
            act(() => history.push(leave));
            await waitFor(() => expect(confirm).toHaveBeenCalledTimes(i + 1));
            await act(async () => {});
            expect(confirm.mock.calls[i]?.[0]).toContain('Discard your changes?');
            expect(history.current).toEqual(route);
            expect(title.value).toBe('A better title');
        }
        // a browser tab warns before it unloads while the changes are there
        const unload = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(unload);
        expect(unload.defaultPrevented).toBe(true);
        // nothing changed any more: leaving asks nothing
        fireEvent.change(title, { target: { value: own.title } });
        const quiet = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(quiet);
        expect(quiet.defaultPrevented).toBe(false);
        act(() => history.push(leaves[0]!));
        await act(async () => {});
        expect(confirm).toHaveBeenCalledTimes(leaves.length);
        expect(history.current).toEqual(leaves[0]);
        expect(sent).toHaveLength(0);
    });

    it('holds a leave while one is being saved, without a question: it leaves once it was saved and stays when it was not', async () => {
        const first = later();
        const second = later();
        const sent: Sent[] = [];
        const routes = editRoutes(sent, first.answer);
        const patch = routes['PATCH /discussions/15']!;
        // the second save is answered when the test says so, too
        routes['PATCH /discussions/15'] = async (r) => (sent.length ? (sent.push({ key: r.headers.get('Idempotency-Key'), body: await r.json() }), second.answer) : patch(r));
        const { history } = renderWith(route, routes, (h) => <DetailPane route={h.current} />);
        const other: Route = { list: route.list, detail: null };
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { title, save } = await openEditor();
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        // the site has not answered: the leave waits, and nobody is told the discussion stays as it was
        act(() => history.push(other));
        await act(async () => {});
        expect(confirm).not.toHaveBeenCalled();
        expect(history.current).toEqual(route);
        // it was not saved: the leave is dropped, the form stays with why
        first.lose();
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        await act(async () => {});
        expect(confirm).not.toHaveBeenCalled();
        expect(history.current).toEqual(route);
        expect(title.value).toBe('A better title');
        // saved while a leave waited: the leave happens, still without a question
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        act(() => history.push(other));
        await act(async () => {});
        expect(history.current).toEqual(route);
        second.give({ status: 200, body: { ...own, title: 'A better title' } });
        await waitFor(() => expect(history.current).toEqual(other));
        expect(confirm).not.toHaveBeenCalled();
        expect(sent).toHaveLength(2);
    });
});
