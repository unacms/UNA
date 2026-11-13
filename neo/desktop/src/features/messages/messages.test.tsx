import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { MenuHost } from '../../components/menu-popover';
import { AppContext, type AppContextValue } from '../../lib/context';
import { windowRoute } from '../../lib/native';
import { RouterProvider, useRoute } from '../../lib/navigation';
import { platform } from '../../lib/platform';
import { isWindowGesture, isWindowKey, opensInWindow } from '../../lib/open-in-window';
import { parseRoute, type Route, RouteHistory, routeToPath } from '../../lib/router';
import { appSettings } from '../../lib/settings';
import { photoUploader, type Picked, type Staging, type Uploader } from '../../lib/uploads';
import { Messages } from '../../screens/messages';
import { secondaryRoute } from '../../secondary';
import { DetailPane } from '../../shell/detail-pane';
import { captureAnchor, isAtBottom, nearTop, restoreScrollTop, type RowBox } from './anchor';
import { Conversation, NewConversation } from './conversation';
import { dayKey, withDays } from './days';
import { isSendKey, sendHint } from './message-composer';
import { offered } from './recipient-field';
import { chronological, firstUnreadAtOpen, firstUnreadId, type Message, messagesKey, type Thread, withHead, withOlder, withOlderAt, withSent } from './thread-cache';
import { richText, setRichText, typeRich } from '../../components/rich-editor/test-utils';

type Profile = Schema<'Profile'>;

const lily: Profile = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const mila: Profile = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Profile = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const group: Profile = { id: '67', kind: 'group', module: 'bx_groups', display_name: 'Gardeners', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const badges: Schema<'ProfileBadge'>[] = [
    { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' },
    { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' },
    { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' },
];
/** The pills' text, in order, under `el`. */
const pills = (el: Element) => Array.from(el.querySelectorAll('.badges-pills .badge')).map((b) => b.textContent?.trim());

function msg(id: number, over: Partial<Message> = {}): Message {
    return { id: String(id), author: mila, mine: false, can_edit: false, body: `Message ${id}`, body_html: `<p>Message ${id}</p>`, media: [], created_at: `2026-11-05T10:${String(id % 60).padStart(2, '0')}:00Z`, ...over };
}

const page = (ids: number[], next: string | null): Schema<'Page_Message'> => ({ items: ids.map((i) => msg(i)), next_cursor: next });
const ids = (t: Thread) => t.items.map((m) => Number(m.id));

describe('the message cache', () => {
    it('keeps older pages under a new first page and the gap closed', () => {
        // pages of 3, newest first: 10 9 8, then 7 6 5
        let t = withHead(undefined, page([10, 9, 8], 'c8'));
        t = withOlder(t, page([7, 6, 5], 'c5'));
        expect(ids(t)).toEqual([10, 9, 8, 7, 6, 5]);
        // two new replies: the poll's first page overlaps what is loaded
        t = withHead(t, page([12, 11, 10], 'c10'));
        expect(ids(t)).toEqual([12, 11, 10, 9, 8, 7, 6, 5]);
        expect(t.older).toBe('c5');
    });

    it('starts over from a first page that does not reach the loaded ones', () => {
        const t = withHead(withHead(undefined, page([10, 9, 8], 'c8')), page([20, 19, 18], 'c18'));
        expect(ids(t)).toEqual([20, 19, 18]);
        expect(t.older).toBe('c18');
    });

    it('drops a reply the site deleted within the first page', () => {
        const t = withHead(withHead(undefined, page([10, 9, 8], 'c8')), page([10, 8, 7], 'c7'));
        expect(ids(t)).toEqual([10, 8, 7]);
    });

    it('takes a whole conversation from one page, and puts a sent reply at the end once', () => {
        let t = withHead(withHead(undefined, page([3, 2], 'c2')), page([4, 3, 2, 1], null));
        expect(t.older).toBeNull();
        t = withSent(t, msg(5, { mine: true }));
        t = withSent(t, msg(5, { mine: true }));
        expect(ids(t)).toEqual([5, 4, 3, 2, 1]);
        expect(chronological(t).map((m) => m.id)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('puts the New line before the oldest unread message', () => {
        expect(firstUnreadId(['first', '1', '2', '3'], 2)).toBe('2');
        expect(firstUnreadId(['first', '1', '2', '3'], 4)).toBe('first');
        expect(firstUnreadId(['2', '3'], 7)).toBe('2');
        expect(firstUnreadId(['1', '2'], 0)).toBeNull();
    });

    it('counts the unread back from the newest message when it opened, so later ones never move the line', () => {
        expect(firstUnreadAtOpen(['3', '4', '5'], '5', 2)).toBe('4');
        expect(firstUnreadAtOpen(['3', '4', '5', '6', '7'], '5', 2)).toBe('4');
        expect(firstUnreadAtOpen(['first', '1', '2', '3', '4', '5', '6'], '5', 2)).toBe('4');
        expect(firstUnreadAtOpen(['3', '4', '5'], null, 2)).toBeNull();
        expect(firstUnreadAtOpen(['3', '4', '5'], '5', 0)).toBeNull();
    });

    it('adds an older page only where the thread still ends', () => {
        const t = withHead(undefined, page([10, 9, 8], 'c8'));
        expect(ids(withOlderAt(t, 'c8', page([7, 6], null))!)).toEqual([10, 9, 8, 7, 6]);
        // a poll started over meanwhile: the old page would hide the replies between
        const reset = withHead(t, page([40, 39, 38], 'c38'));
        expect(withOlderAt(reset, 'c8', page([7, 6], null))).toBe(reset);
        expect(withOlderAt(undefined, 'c8', page([7], null))).toBeUndefined();
    });
});

describe('the scroll anchor', () => {
    // rows of 50 px, stacked from the top of the content
    const stack = (rowIds: string[], start = 0): RowBox[] => rowIds.map((id, i) => ({ id, top: start + i * 50, height: 50 }));

    it('keeps the message read in place when older ones go in above it', () => {
        const before = stack(['5', '6', '7', '8', '9']);
        // scrolled so that message 6 is 20 px above the top: 7 is the first one whole, 6 partly in view
        const scrollTop = 70;
        const anchor = captureAnchor(before, scrollTop);
        expect(anchor).toEqual({ id: '6', offset: -20 });

        // three older messages (and a taller day separator) go in above
        const after = stack(['2', '3', '4', '5', '6', '7', '8', '9'], 30);
        const top = restoreScrollTop(anchor!, after);
        const six = after.find((r) => r.id === '6')!;
        expect(top).toBe(six.top + 20);
        // where 6 is in the view is where it was
        expect(six.top - top!).toBe(anchor!.offset);
    });

    it('anchors to the last message when the view is past every row, and gives up when it is gone', () => {
        expect(captureAnchor(stack(['1', '2']), 500)).toEqual({ id: '2', offset: -450 });
        expect(captureAnchor([], 0)).toBeNull();
        expect(restoreScrollTop({ id: 'x', offset: 0 }, stack(['1']))).toBeNull();
        expect(restoreScrollTop({ id: '1', offset: 40 }, stack(['1']))).toBe(0);
    });

    it('knows the bottom and the top', () => {
        expect(isAtBottom(560, 400, 1000)).toBe(true);
        expect(isAtBottom(500, 400, 1000)).toBe(false);
        expect(nearTop(100)).toBe(true);
        expect(nearTop(1000)).toBe(false);
    });
});

describe('days and keys', () => {
    it('separates days and folds a run of one author', () => {
        const rows = withDays(
            [
                msg(1, { created_at: '2026-11-04T09:00:00Z' }),
                msg(2, { created_at: '2026-11-04T09:01:00Z' }),
                msg(3, { created_at: '2026-11-05T12:00:00Z', author: lily, mine: true }),
                msg(4, { created_at: '2026-11-05T12:01:00Z' }),
            ],
            new Date('2026-11-05T13:00:00Z'),
        );
        expect(rows.map((r) => (r.kind === 'day' ? `day:${r.key}` : `${r.message.id}${r.continued ? '+' : ''}`))).toEqual([
            `day:${dayKey('2026-11-04T09:00:00Z')}`,
            '1',
            '2+',
            `day:${dayKey('2026-11-05T12:00:00Z')}`,
            '3',
            '4',
        ]);
    });

    it('sends on Enter, not on Shift+Enter or while an IME composes', () => {
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false })).toBe(true);
        expect(isSendKey({ key: 'Enter', shiftKey: true, altKey: false })).toBe(false);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, isComposing: true })).toBe(false);
        // WebKit: the Enter that accepts a candidate comes after compositionend, with keyCode 229
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, isComposing: false, keyCode: 229 })).toBe(false);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, isComposing: false, keyCode: 13 })).toBe(true);
        expect(isSendKey({ key: 'a', shiftKey: false, altKey: false })).toBe(false);
        // Settings' "Send messages with Cmd+Enter": Enter starts a line, only Cmd (Ctrl elsewhere) with Enter sends
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false }, true, true)).toBe(false);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, metaKey: true }, true, true)).toBe(true);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, ctrlKey: true }, true, true)).toBe(false);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, ctrlKey: true }, true, false)).toBe(true);
        expect(isSendKey({ key: 'Enter', shiftKey: false, altKey: false, metaKey: true, keyCode: 229 }, true, true)).toBe(false);
        expect(sendHint(false)).toBe('Enter sends, Shift+Enter starts a new line');
        expect(sendHint(true, true)).toBe('⌘↩ sends, Enter starts a new line');
        expect(sendHint(true, false)).toBe('Ctrl+Enter sends, Enter starts a new line');
    });

    it('opens details in a window with Cmd (Ctrl elsewhere) only', () => {
        const none = { metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
        expect(isWindowGesture({ ...none, metaKey: true }, true)).toBe(true);
        expect(isWindowGesture({ ...none, ctrlKey: true }, true)).toBe(false);
        expect(isWindowGesture({ ...none, ctrlKey: true }, false)).toBe(true);
        expect(isWindowGesture({ ...none, metaKey: true, shiftKey: true }, true)).toBe(false);
        expect(isWindowKey({ ...none, metaKey: true, key: 'Enter' }, true)).toBe(true);
        expect(opensInWindow({ kind: 'conversation', id: '7' })).toBe(true);
        expect(opensInWindow({ kind: 'new-message' })).toBe(false);
    });

    it('reads a window’s route from its address and shows only details there', () => {
        const route: Route = { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } };
        const path = routeToPath(route);
        expect(windowRoute(`#window=${encodeURIComponent(path)}`)).toBe(path);
        expect(windowRoute('')).toBeNull();
        expect(windowRoute('#window=%2F%2Fevil.example')).toBeNull();
        expect(secondaryRoute(path)).toEqual(route);
        expect(secondaryRoute('/messages')).toBeNull();
    });

    it('has a new message with and without a first recipient', () => {
        expect(routeToPath({ list: { section: 'messages' }, detail: { kind: 'new-message' } })).toBe('/messages/new-message');
        expect(parseRoute('/messages/new-message')).toEqual({ list: { section: 'messages' }, detail: { kind: 'new-message' } });
        expect(parseRoute('/messages/new-message/8')).toEqual({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
    });

    it('offers people not chosen yet, and no groups', () => {
        expect(offered([lily, mila, eric, group], [mila], new Set(['4'])).map((p) => p.id)).toEqual(['6']);
    });
});

describe('photoUploader', () => {
    it('sends the purpose, picks photos only and refuses videos', async () => {
        const photo: Picked = { handle: 'a', name: 'a.png', size: 1, mime: 'image/png', kind: 'image' };
        const video: Picked = { handle: 'b', name: 'b.mp4', size: 1, mime: 'video/mp4', kind: 'video' };
        const base: Uploader = {
            pick: vi.fn(async () => ({ files: [photo, video], refused: [] })),
            fromFiles: vi.fn(async () => ({ files: [video], refused: ['notes.txt'] })),
            fromPaths: vi.fn(async () => ({ files: [], refused: [] })),
            upload: vi.fn(async () => ({}) as Schema<'Media'>),
            cancel: vi.fn(),
            release: vi.fn(),
        };
        const up = photoUploader(base, 'message');
        expect(await up.pick()).toEqual({ files: [photo], refused: ['b.mp4'] });
        expect(base.pick).toHaveBeenCalledWith({ photosOnly: true });
        expect(base.release).toHaveBeenCalledWith(video);
        expect(await up.fromFiles([])).toEqual({ files: [], refused: ['notes.txt', 'b.mp4'] });
        await up.upload(photo, () => {});
        expect(base.upload).toHaveBeenCalledWith(photo, expect.any(Function), 'message');
    });
});

/* The chat in the detail pane */

type Answer = { status: number; body?: unknown };
type Handler = (request: Request) => Answer | Promise<Answer>;

function fakeApi(routes: Record<string, Handler>, calls: string[] = []): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const path = url.pathname.replace(/^\/api\/v2/, '');
            calls.push(`${request.method} ${path}${url.search}`);
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const conversation: Schema<'Conversation'> = {
    id: '7',
    author: mila,
    participants: [mila, lily],
    body: 'Hi Lily',
    body_html: '<p>Hi Lily</p>',
    media: [],
    replies: 5,
    unread: 2,
    last_message: { text: 'See you at eight', has_media: false, media_kind: null, created_at: '2026-11-05T10:00:00Z', by: lily },
    created_at: '2026-11-05T09:00:00Z',
    can_add_participants: false,
    can_leave: true,
};

const me = { active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;

function renderIn(ui: React.ReactNode, api: UnaApi, route: Route) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchInterval: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    const ctx = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} } as unknown as AppContextValue;
    const history = new RouteHistory(route);
    render(
        <QueryClientProvider client={client}>
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>{ui}</RouterProvider>
            </AppContext.Provider>
        </QueryClientProvider>,
    );
    return { client, history };
}

const noUploads: Uploader = {
    pick: async () => ({ files: [], refused: [] }),
    fromFiles: async () => ({ files: [], refused: [] }),
    fromPaths: async () => ({ files: [], refused: [] }),
    upload: () => new Promise(() => {}),
    cancel: () => {},
    release: () => {},
};

beforeEach(() => {
    try {
        localStorage.clear();
    } catch {
        // no storage: drafts are not kept
    }
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('Conversation', () => {
    it('is a log with the newest message last, the New line, and older messages loaded above', async () => {
        const calls: string[] = [];
        const api = fakeApi(
            {
                'GET /conversations/7': () => ({ status: 200, body: conversation }),
                'POST /conversations/7/read': () => ({ status: 204 }),
                'GET /conversations/7/messages': (r) =>
                    new URL(r.url).searchParams.get('cursor')
                        ? { status: 200, body: { items: [msg(2), msg(1)], next_cursor: null } }
                        : { status: 200, body: { items: [msg(5, { author: lily, mine: true }), msg(4), msg(3)], next_cursor: 'older' } },
            },
            calls,
        );
        renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });

        const log = await screen.findByRole('log', { name: 'Messages with Mila' });
        await within(log).findByText('Message 5');
        const order = () => Array.from(log.querySelectorAll('[data-message-id]')).map((el) => (el as HTMLElement).dataset.messageId);
        expect(order()).toEqual(['3', '4', '5']);
        expect(log.querySelector('[data-message-id="5"]')?.classList.contains('mine')).toBe(true);
        expect(within(log).getByRole('heading', { level: 3 })).toBeTruthy();
        // two unread when it opened: the New line is before 4, and it was read
        const line = within(log).getByRole('separator', { name: 'New messages' });
        expect(line.nextElementSibling?.getAttribute('data-message-id')).toBe('4');
        await waitFor(() => expect(calls).toContain('POST /conversations/7/read'));

        // a page going in is not read out as new; replies that come are
        await waitFor(() => expect(log.getAttribute('aria-live')).toBe('polite'));
        const older = within(log).getByRole('button', { name: 'Load older messages' });
        older.focus();
        fireEvent.click(older);
        expect(log.getAttribute('aria-live')).toBe('off');
        await waitFor(() => expect(order()).toEqual(['first', '1', '2', '3', '4', '5']));
        // the button went with the last page: focus is in the chat, not on the page
        expect(document.activeElement).toBe(log);
        expect(calls.some((c) => c.startsWith('GET /conversations/7/messages?') && c.includes('cursor=older'))).toBe(true);
        expect(within(log).getByText('The start of the conversation')).toBeTruthy();
        expect(within(log).getByText('Hi Lily')).toBeTruthy();
    });

    it('edits one’s own reply in place where the site lets one, with its HTML', async () => {
        const patched: unknown[] = [];
        const mention = '<a class="bx-mention-link" data-profile-id="8" href="https://community.example/u/mila">Mila</a>';
        const mine = msg(4, { author: lily, mine: true, can_edit: true, body: 'Hi Mila', body_html: `<p>Hi ${mention}</p>` });
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0 } }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: [mine, msg(3)], next_cursor: null } }),
            'PATCH /conversations/7/messages/4': async (r) => {
                const body = (await r.json()) as { body: string };
                patched.push(body);
                return { status: 200, body: { ...mine, body: 'Hi Mila, see you', body_html: body.body } };
            },
        });
        renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        // only what the site lets one edit has the button
        const edit = await screen.findByRole('button', { name: 'Edit your message' });
        expect(screen.getAllByRole('button', { name: 'Edit your message' })).toHaveLength(1);
        fireEvent.click(edit);
        const box = await screen.findByRole('textbox', { name: 'Message text' });
        expect(richText(box)).toBe('Hi @Mila');
        typeRich(box, ', see you');
        // ⌘↩ (Ctrl+Enter) saves, not Enter: Enter is a new line here
        fireEvent.keyDown(box, { key: 'Enter', metaKey: platform.mac, ctrlKey: !platform.mac });
        await waitFor(() => expect(patched).toEqual([{ body: '<p>Hi <a href="https://community.example/u/mila" title="Mila" dchar="@" data-profile-id="8" class="bx-mention-link">@Mila</a>, see you</p>' }]));
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Message text' })).toBeNull());
        expect(screen.getByText(/see you/)).toBeTruthy();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit your message' })));
    });

    it('sends with Enter, keeps a new line with Shift+Enter, and puts the reply at the end', async () => {
        const sent: unknown[] = [];
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0 } }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(3)], next_cursor: null } }),
            'POST /conversations/7/messages': async (r) => {
                sent.push(await r.json());
                return { status: 201, body: msg(9, { author: lily, mine: true, body: 'Hello', body_html: '<p>Hello<br>again</p>' }) };
            },
        });
        renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const box = await screen.findByRole('textbox', { name: 'Write a message' });
        setRichText(box, 'Hello');
        fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
        expect(sent).toHaveLength(0);
        typeRich(box, 'again');
        expect(richText(box)).toBe('Hello\nagain');
        await act(async () => {
            fireEvent.keyDown(box, { key: 'Enter' });
        });
        await waitFor(() => expect(sent).toHaveLength(1));
        expect(sent[0]).toEqual({ body: '<p>Hello<br>again</p>' });
        const log = screen.getByRole('log');
        await waitFor(() => expect(Array.from(log.querySelectorAll('[data-message-id]')).pop()?.getAttribute('data-message-id')).toBe('9'));
        expect(richText(box)).toBe('');
    });

    it('keeps the New line where it was when replies are sent and come', async () => {
        let head = [msg(5), msg(4), msg(3)];
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: conversation }),
            'POST /conversations/7/read': () => ({ status: 204 }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: head, next_cursor: 'older' } }),
            'POST /conversations/7/messages': () => ({ status: 201, body: msg(9, { author: lily, mine: true }) }),
        });
        const { client } = renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const log = await screen.findByRole('log');
        await within(log).findByText('Message 5');
        const lineBefore = () => within(log).getByRole('separator', { name: 'New messages' }).nextElementSibling?.getAttribute('data-message-id');
        expect(lineBefore()).toBe('4');

        const box = screen.getByRole('textbox', { name: 'Write a message' });
        setRichText(box, 'Hi');
        await act(async () => {
            fireEvent.keyDown(box, { key: 'Enter' });
        });
        await within(log).findByText('Message 9');
        expect(lineBefore()).toBe('4');

        head = [msg(10), msg(9, { author: lily, mine: true }), msg(5), msg(4), msg(3)];
        await act(async () => {
            await client.invalidateQueries(messagesKey('7'));
        });
        await within(log).findByText('Message 10');
        expect(lineBefore()).toBe('4');
    });

    it('keeps a reply just sent when a poll that asked before it answers after', async () => {
        let answerPoll: ((a: Answer) => void) | null = null;
        let gets = 0;
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0 } }),
            'GET /conversations/7/messages': () => {
                gets += 1;
                if (gets === 1) return { status: 200, body: { items: [msg(3)], next_cursor: null } };
                return new Promise<Answer>((resolve) => {
                    answerPoll = resolve;
                });
            },
            'POST /conversations/7/messages': () => ({ status: 201, body: msg(9, { author: lily, mine: true }) }),
        });
        const { client } = renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const log = await screen.findByRole('log');
        await within(log).findByText('Message 3');
        // a poll asks, and the reply is sent before it answers
        void client.invalidateQueries(messagesKey('7'));
        await waitFor(() => expect(answerPoll).not.toBeNull());

        const box = screen.getByRole('textbox', { name: 'Write a message' });
        setRichText(box, 'Hi');
        const send = screen.getByRole('button', { name: 'Send' });
        send.focus();
        await act(async () => {
            fireEvent.click(send);
        });
        await within(log).findByText('Message 9');
        // sent from the button: never disabled meanwhile, and the next message is typed in the box
        expect(send.hasAttribute('disabled')).toBe(false);
        await waitFor(() => expect(document.activeElement).toBe(box));

        await act(async () => {
            answerPoll?.({ status: 200, body: { items: [msg(3)], next_cursor: null } });
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
        expect(within(log).getByText('Message 9')).toBeTruthy();
    });

    it('is gone for one no longer in it', async () => {
        const api = fakeApi({ 'GET /conversations/7': () => ({ status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' } }) });
        const { history } = renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        await waitFor(() => expect(screen.getAllByRole('status').some((s) => /This conversation isn’t available/.test(s.textContent ?? ''))).toBe(true));
        expect(screen.getByText('You may have left it, or it was removed.')).toBeTruthy();
        // one live region, the empty state's own: no alert around it
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.queryByRole('log')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(history.current.detail).toBeNull();
    });

    it('sends only with Cmd+Enter (Ctrl+Enter) when Settings say so, and the hint says which', async () => {
        await appSettings.set('sendWithCmdEnter', true);
        try {
            const sent: unknown[] = [];
            const api = fakeApi({
                'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0 } }),
                'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(3)], next_cursor: null } }),
                'POST /conversations/7/messages': async (r) => {
                    sent.push(await r.json());
                    return { status: 201, body: msg(9, { author: lily, mine: true }) };
                },
            });
            renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
            const box = await screen.findByRole('textbox', { name: 'Write a message' });
            const hint = document.getElementById(box.getAttribute('aria-describedby') ?? '');
            expect(hint?.textContent).toBe(sendHint(true));
            setRichText(box, 'Hello');
            fireEvent.keyDown(box, { key: 'Enter' });
            await new Promise((resolve) => setTimeout(resolve, 20));
            expect(sent).toHaveLength(0);
            await act(async () => {
                fireEvent.keyDown(box, { key: 'Enter', metaKey: platform.mac, ctrlKey: !platform.mac });
            });
            await waitFor(() => expect(sent).toHaveLength(1));
            // the send circle keeps the accessible name Send
            expect(screen.getByRole('button', { name: 'Send' }).classList.contains('send-circle')).toBe(true);
        } finally {
            await appSettings.set('sendWithCmdEnter', false);
        }
    });

    // photos on their way into the tray (being made ready): a message sent now would go without them
    const WAIT = 'Wait until the uploads are done';
    const beach: Picked = { handle: 'h-beach', name: 'beach.png', size: 3, mime: 'image/png', kind: 'image' };
    /** A conversation with "Hello" typed, whose uploader makes files ready, and uploads them, when the test says so. */
    async function typedWithSlowUploads() {
        const sent: unknown[] = [];
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0 } }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(3)], next_cursor: null } }),
            'POST /conversations/7/messages': async (r) => {
                sent.push(await r.json());
                return { status: 201, body: msg(9, { author: lily, mine: true }) };
            },
        });
        const made: ((staging: Staging) => void)[] = [];
        const uploaded: ((media: Schema<'Media'>) => void)[] = [];
        const make = () => new Promise<Staging>((resolve) => made.push(resolve));
        const uploader: Uploader = { ...noUploads, pick: make, fromFiles: make, fromPaths: make, upload: () => new Promise((resolve) => uploaded.push(resolve)) };
        renderIn(<Conversation id="7" uploader={uploader} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const box = await screen.findByRole('textbox', { name: 'Write a message' });
        setRichText(box, 'Hello');
        return {
            sent,
            box,
            hint: () => document.getElementById(box.getAttribute('aria-describedby') ?? '')?.textContent,
            enter: () => act(async () => void fireEvent.keyDown(box, { key: 'Enter' })),
            ready: (files: Picked[]) => act(async () => made.shift()?.({ files, refused: [] })),
            finish: (id: string) => act(async () => uploaded.shift()?.({ id, kind: 'image', mime: 'image/png', size: 3, state: 'ready', original_name: 'beach.png', url: '', download_url: '', variants: {}, width: 4, height: 3 })),
        };
    }

    for (const way of ['picked in the dialog', 'pasted in the box'] as const)
        it(`does not send while a photo ${way} is on its way into the tray, says to wait, and sends with it once it is up`, async () => {
            const { sent, box, hint, enter, ready, finish } = await typedWithSlowUploads();
            if (way === 'picked in the dialog') fireEvent.click(screen.getByRole('button', { name: 'Add photos' }));
            else fireEvent.paste(box, { clipboardData: { files: [new File([new Uint8Array([1, 2, 3])], 'beach.png', { type: 'image/png' })], getData: () => '' } });
            // the keyboard, then the button: neither sends, and the line under the box says why
            await enter();
            expect(sent).toHaveLength(0);
            expect(hint()).toBe(WAIT);
            await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Send' })));
            expect(sent).toHaveLength(0);
            expect(richText(box)).toBe('Hello');

            // made ready: the tray shows it, and Send waits for its upload as for any other
            await ready([beach]);
            expect(await screen.findByRole('list', { name: '1 attachment' })).toBeTruthy();
            expect(hint()).toBe(WAIT);
            await enter();
            expect(sent).toHaveLength(0);
            await finish('77');
            await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-disabled')).toBeNull());
            expect(hint()).toBe(sendHint(false));
            await enter();
            await waitFor(() => expect(sent).toHaveLength(1));
            expect(sent[0]).toEqual({ body: '<p>Hello</p>', media_ids: ['77'] });
        });

    it('stops saying to wait when nothing came of the photos on their way (the dialog closed with none), and sends then', async () => {
        const { sent, hint, enter, ready } = await typedWithSlowUploads();
        fireEvent.click(screen.getByRole('button', { name: 'Add photos' }));
        await enter();
        expect(sent).toHaveLength(0);
        expect(hint()).toBe(WAIT);
        // nothing was chosen: the tray does not change, and there is nothing to wait for
        await ready([]);
        expect(hint()).toBe(sendHint(false));
        await enter();
        await waitFor(() => expect(sent).toHaveLength(1));
        expect(sent[0]).toEqual({ body: '<p>Hello</p>' });
    });

    it('shows badges after the sender\'s name over a run, and in the People panel', async () => {
        const badgedMila = { ...mila, badges };
        const three = { ...conversation, author: badgedMila, participants: [badgedMila, eric, lily], unread: 0 };
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: three }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(4, { author: eric }), msg(3, { author: badgedMila })], next_cursor: null } }),
        });
        renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const log = await screen.findByRole('log', { name: 'Messages with Mila, Eric' });
        await within(log).findByText('Message 3');
        // the conversation's first message, Mila's, starts her run (3 continues it)
        const author = log.querySelector('[data-message-id="first"] .bubble-author') as HTMLElement;
        expect(log.querySelector('[data-message-id="3"] .bubble-author')).toBeNull();
        expect(within(author).getByRole('button', { name: 'Mila' }).nextElementSibling?.classList.contains('badges')).toBe(true);
        expect(pills(author)).toEqual(['Founder', 'Moderator', '+1']);
        expect(author.textContent).toContain(', Founder, Moderator, Top contributor');
        // Eric has none: his name alone
        expect(log.querySelector('[data-message-id="4"] .bubble-author .badges')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'People, 3' }));
        const panel = await screen.findByRole('region', { name: 'People in this conversation' });
        const row = within(panel).getByRole('button', { name: 'Mila' }).closest('.people-row') as HTMLElement;
        expect(pills(row)).toEqual(['Founder', 'Moderator', '+1']);
    });

    it('closes the People panel with Esc and gives focus back to its button, but not while the field lists people', async () => {
        const api = fakeApi({
            'GET /conversations/7': () => ({ status: 200, body: { ...conversation, unread: 0, can_add_participants: true } }),
            'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(3)], next_cursor: null } }),
        });
        renderIn(<Conversation id="7" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });
        const people = await screen.findByRole('button', { name: 'People, 2' });
        fireEvent.click(people);
        expect(people.getAttribute('aria-expanded')).toBe('true');
        const panel = document.getElementById(people.getAttribute('aria-controls') ?? '') as HTMLElement;
        const remove = within(panel).getByRole('button', { name: 'Remove Mila' });
        remove.focus();
        // a combobox with its list open keeps Esc for itself
        const combo = within(panel).queryByRole('combobox');
        if (combo) {
            combo.setAttribute('aria-expanded', 'true');
            fireEvent.keyDown(combo, { key: 'Escape' });
            expect(people.getAttribute('aria-expanded')).toBe('true');
            combo.setAttribute('aria-expanded', 'false');
        }
        fireEvent.keyDown(remove, { key: 'Escape' });
        expect(people.getAttribute('aria-expanded')).toBe('false');
        await waitFor(() => expect(document.activeElement).toBe(people));
    });

    it('marks it unread from More, says so, and does not read it again until another reply comes', async () => {
        const calls: string[] = [];
        let replies = 5;
        let unread = 2;
        const api = fakeApi(
            {
                'GET /conversations/7': () => ({ status: 200, body: { ...conversation, replies, unread } }),
                'POST /conversations/7/read': () => {
                    unread = 0;
                    return { status: 204 };
                },
                'DELETE /conversations/7/read': () => {
                    unread = 1;
                    return { status: 204 };
                },
                'GET /conversations/7/messages': () => ({ status: 200, body: { items: [msg(3)], next_cursor: null } }),
            },
            calls,
        );
        const { client } = renderIn(
            <>
                <Conversation id="7" uploader={noUploads} />
                <MenuHost />
            </>,
            api,
            { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } },
        );
        await waitFor(() => expect(calls.filter((c) => c === 'POST /conversations/7/read')).toHaveLength(1));
        await waitFor(() => expect(client.getQueryData<Schema<'Conversation'>>(['conversation', '7'])?.unread ?? 0).toBe(0));

        fireEvent.click(await screen.findByRole('button', { name: 'More for the conversation' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Mark as Unread' }));
        await waitFor(() => expect(calls).toContain('DELETE /conversations/7/read'));
        await waitFor(() => expect(screen.getAllByRole('status').some((s) => s.textContent === 'Marked as unread')).toBe(true));
        // the conversation comes back unread: still open, it is not read again
        await act(async () => {
            await client.refetchQueries({ queryKey: ['conversation', '7'] });
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(calls.filter((c) => c === 'POST /conversations/7/read')).toHaveLength(1);
        // a new reply: it is read again
        replies = 6;
        await act(async () => {
            await client.refetchQueries({ queryKey: ['conversation', '7'] });
        });
        await waitFor(() => expect(calls.filter((c) => c === 'POST /conversations/7/read')).toHaveLength(2));
    });
});

describe('NewConversation', () => {
    it('finds people as one types, adds chips and sends to them', async () => {
        const sent: unknown[] = [];
        const api = fakeApi({
            'GET /search/profiles': (r) => ({ status: 200, body: new URL(r.url).searchParams.get('q') === 'mi' ? [mila, lily, group] : [] }),
            'POST /conversations': async (r) => {
                sent.push(await r.json());
                return { status: 201, body: { ...conversation, id: '12', unread: 0 } };
            },
        });
        const { history } = renderIn(<NewConversation uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'new-message' } });

        const field = screen.getByRole('combobox', { name: 'To' });
        expect(document.activeElement).toBe(field);
        const send = screen.getByRole('button', { name: 'Send' });
        expect(send.getAttribute('aria-disabled')).toBe('true');

        fireEvent.change(field, { target: { value: 'mi' } });
        const list = await screen.findByRole('listbox', { name: 'People found', hidden: false });
        // the viewer and groups are not offered
        await waitFor(() =>
            expect(
                within(list)
                    .getAllByRole('option')
                    .map((o) => o.querySelector('.truncate')?.textContent),
            ).toEqual(['Mila']),
        );
        expect(field.getAttribute('aria-expanded')).toBe('true');
        fireEvent.keyDown(field, { key: 'Enter' });
        expect(screen.getByRole('button', { name: 'Remove Mila' })).toBeTruthy();
        expect((field as HTMLInputElement).value).toBe('');

        const box = screen.getByRole('textbox', { name: 'Message Mila' });
        setRichText(box, 'Coffee?');
        await act(async () => {
            fireEvent.keyDown(box, { key: 'Enter' });
        });
        await waitFor(() => expect(sent).toEqual([{ recipients: ['8'], body: '<p>Coffee?</p>' }]));
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'conversation', id: '12' }));
    });

    it('hands focus to the reply box of the conversation it becomes', async () => {
        const api = fakeApi({ 'GET /profiles/8': () => ({ status: 200, body: mila }), 'POST /conversations': () => ({ status: 201, body: { ...conversation, id: '12', unread: 0 } }) });
        function Detail() {
            return <DetailPane route={useRoute()} />;
        }
        const { history } = renderIn(<Detail />, api, { list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
        await screen.findByRole('button', { name: 'Remove Mila' });
        const box = screen.getByRole('textbox', { name: 'Message Mila' });
        setRichText(box, 'Coffee?');
        await act(async () => {
            fireEvent.keyDown(box, { key: 'Enter' });
        });
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'conversation', id: '12' }));
        const reply = await screen.findByRole('textbox', { name: 'Write a message' });
        expect(document.activeElement).toBe(reply);
    });

    it('takes the last chip off with Backspace in the empty field', async () => {
        const api = fakeApi({ 'GET /profiles/8': () => ({ status: 200, body: mila }) });
        renderIn(<NewConversation profileId="8" uploader={noUploads} />, api, { list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
        await screen.findByRole('button', { name: 'Remove Mila' });
        fireEvent.keyDown(screen.getByRole('combobox', { name: 'To' }), { key: 'Backspace' });
        expect(screen.queryByRole('button', { name: 'Remove Mila' })).toBeNull();
    });
});

describe('the inbox', () => {
    it('opens a conversation in place on a click, and in a window of its own with Cmd (Ctrl) held', async () => {
        const api = fakeApi({ 'GET /conversations': () => ({ status: 200, body: { items: [conversation], next_cursor: null } }) });
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const { history } = renderIn(<Messages />, api, { list: { section: 'messages' }, detail: null });
        const row = await screen.findByRole('button', { name: /Mila/ });
        const mod = platform.mac ? { metaKey: true } : { ctrlKey: true };
        const path = routeToPath({ list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } });

        fireEvent.keyDown(row, { key: 'Enter', ...mod });
        expect(open).toHaveBeenCalledWith(expect.stringContaining(`#window=${encodeURIComponent(path)}`), '_blank', 'noopener');
        fireEvent.click(row, mod);
        expect(open).toHaveBeenCalledTimes(2);
        expect(history.current.detail).toBeNull();

        fireEvent.click(row);
        expect(history.current.detail).toEqual({ kind: 'conversation', id: '7' });
        expect(open).toHaveBeenCalledTimes(2);
    });

    it('shows the other person\'s badges after their name, and none beside a group\'s names', async () => {
        const badgedMila = { ...mila, badges };
        const one = { ...conversation, author: badgedMila, participants: [badgedMila, lily] };
        const several = { ...conversation, id: '9', author: badgedMila, participants: [badgedMila, { ...eric, badges }, lily], unread: 0 };
        const api = fakeApi({ 'GET /conversations': () => ({ status: 200, body: { items: [one, several], next_cursor: null } }) });
        renderIn(<Messages />, api, { list: { section: 'messages' }, detail: null });
        const row = await screen.findByRole('button', { name: /^Mila ?, Founder, Moderator, Top contributor, 2 unread/ });
        const line = row.querySelector('.conv-line') as HTMLElement;
        // on the first line: the name, then the pills (two and +N), then the time
        expect(line.querySelector('.conv-names bdi')?.textContent).toBe('Mila');
        expect(line.querySelector('.conv-names bdi')?.nextElementSibling?.classList.contains('badges')).toBe(true);
        expect(pills(line)).toEqual(['Founder', 'Moderator', '+1']);
        expect(line.querySelector('.badges-pills')?.getAttribute('aria-hidden')).toBe('true');
        expect(line.lastElementChild?.tagName).toBe('TIME');
        // several people: their names only
        const group = screen.getByRole('button', { name: /^Mila, Eric/ });
        expect(group.querySelector('.badges')).toBeNull();
        expect(group.textContent).not.toContain('Founder');
    });

    it('shows two lines like a notification: the names and time, then the newest message in one line', async () => {
        const photo = { ...conversation, id: '8', unread: 0, last_message: { text: '', has_media: true, media_kind: 'photo' as const, created_at: '2026-11-05T11:00:00Z', by: mila } };
        const api = fakeApi({ 'GET /conversations': () => ({ status: 200, body: { items: [conversation, photo], next_cursor: null } }) });
        renderIn(<Messages />, api, { list: { section: 'messages' }, detail: null });
        const rows = await screen.findAllByRole('button', { name: /Mila/ });
        const [mine, theirs] = [rows.find((r) => r.textContent?.includes('See you'))!, rows.find((r) => r.textContent?.includes('Photo'))!];
        // one's own last message, without "You:", and no "Last reply from" line
        const snippet = mine.querySelector('.conv-sub > .conv-snippet') as HTMLElement;
        expect(snippet.textContent).toBe('See you at eight');
        expect(snippet.classList.contains('media')).toBe(false);
        expect(mine.textContent).not.toMatch(/You:|Last reply/);
        expect(mine.querySelectorAll('.conv-main > *')).toHaveLength(2);
        // a photo without text: a stand-in in secondary text
        const stand = theirs.querySelector('.conv-snippet') as HTMLElement;
        expect(stand.textContent).toBe('Photo');
        expect(stand.classList.contains('media')).toBe(true);
    });

    it('gives a row the time of the message it shows, not a deleted last reply\'s', async () => {
        // the last reply (11:00) was deleted: last_reply_at keeps its time, last_message is the one before
        const fell = { ...conversation, last_reply_at: '2026-11-05T11:00:00Z', last_message: { ...conversation.last_message, created_at: '2026-11-05T10:00:00Z' } };
        const api = fakeApi({ 'GET /conversations': () => ({ status: 200, body: { items: [fell], next_cursor: null } }) });
        renderIn(<Messages />, api, { list: { section: 'messages' }, detail: null });
        const row = await screen.findByRole('button', { name: /Mila/ });
        expect(row.querySelector('time')?.getAttribute('dateTime')).toBe('2026-11-05T10:00:00Z');
    });

    it('shows the unread count beside the preview, under the time, and says it in the row name only', async () => {
        const many = { ...conversation, id: '8', unread: 120 };
        const api = fakeApi({ 'GET /conversations': () => ({ status: 200, body: { items: [conversation, many], next_cursor: null } }) });
        renderIn(<Messages />, api, { list: { section: 'messages' }, detail: null });
        const rows = await screen.findAllByRole('button', { name: /Mila/ });
        const counts = rows.map((r) => r.querySelector('.conv-sub > .conv-count'));
        expect(counts.map((c) => c?.textContent)).toEqual(['2', '99+']);
        expect(counts.every((c) => c?.getAttribute('aria-hidden') === 'true')).toBe(true);
        expect(rows[1]!.textContent).toContain(', 120 unread');
        expect(rows.every((r) => !r.querySelector('.unread-dot'))).toBe(true);
    });
});
