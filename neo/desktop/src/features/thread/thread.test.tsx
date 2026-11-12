import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { commentItems, type CommentsData, commentsKey, countReply, dropComment, repliesKey } from './cache';
import { type CommentTarget, CommentTree } from './comment-tree';
import { mediaSrc } from '../../lib/media';
import { appRealtime } from '../../lib/realtime';
import { photosOf } from '../feed/media';
import { Lightbox } from './lightbox';
import { richText, setRichText, typeRich } from '../../components/rich-editor/test-utils';

type Comment = Schema<'Comment'>;

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const mila: Schema<'Profile'> = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };

function comment(id: string, over: Partial<Comment> = {}): Comment {
    return {
        id,
        target_id: '100',
        parent_id: null,
        depth: 0,
        author: lily,
        body: `Comment ${id}`,
        body_html: `<p>Comment ${id}</p>`,
        replies: 0,
        pinned: false,
        created_at: '2026-11-01T00:00:00Z',
        viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true },
        ...over,
    };
}

const item = {
    id: '100',
    kind: 'feed_post',
    module: 'bx_timeline',
    author: lily,
    anonymous: false,
    audience: 'public',
    card: { text: 'A post' },
    media: [],
    links: [],
    stats: { comments: 2, reactions: 0, reposts: 0, views: 0 },
    published_at: '2026-11-01T00:00:00Z',
    viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
} as Schema<'Item'>;

/** The viewer: the docked box says "Commenting as Andrey". */
const me = { active_profile_id: '2', profiles: [{ id: '2', kind: 'person', module: 'bx_persons', display_name: 'Andrey', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' }] };

type Answer = { status: number; body?: unknown };
type Handler = (request: Request) => Answer | Promise<Answer>;

/** The typed client on a fake fetch; `calls` records "METHOD /path" of every request. */
function fakeApi(routes: Record<string, Handler>, calls: string[] = []): UnaApi {
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
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const page = (items: Comment[]) => ({ status: 200, body: { items, next_cursor: null } });

function renderTree(api: UnaApi, target?: CommentTarget, shown: Schema<'Item'> = item) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    const ctx = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} } as unknown as AppContextValue;
    render(
        <QueryClientProvider client={client}>
            <AppContext.Provider value={ctx}>
                <CommentTree item={shown} target={target} />
            </AppContext.Provider>
        </QueryClientProvider>,
    );
    return client;
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const badges: Schema<'ProfileBadge'>[] = [
    { id: '7', name: 'Founder', icon: 'crown', color: '#d97706' },
    { id: '8', name: 'Moderator', icon: 'shield-check', color: '#2563eb' },
    { id: '9', name: 'Top contributor', icon: 'star', color: '#059669' },
];
const andrey: Schema<'Profile'> = { id: '65', kind: 'person', module: 'bx_persons', display_name: 'Andrey', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges };

/** The pills' text, in order, under `el`. */
const pills = (el: Element) => Array.from(el.querySelectorAll('.badges-pills .badge')).map((b) => b.textContent?.trim());

describe('CommentTree', () => {
    it("loads the comments again when the site says one came, on the item's own channel", async () => {
        let list = [comment('1')];
        const calls: string[] = [];
        renderTree(fakeApi({ 'GET /content/100/comments': () => page(list) }, calls), undefined, { ...item, live: { comments: 'cmts_bx_timeline_100' } });
        await waitFor(() => expect(screen.getAllByRole('article').length).toBe(1));

        list = [comment('1'), comment('2')];
        act(() => appRealtime.receive({ channel: 'cmts_bx_timeline_100', event: 'comment_added', data: { id: 100, author_id: 9 } }));
        await waitFor(() => expect(screen.getAllByRole('article').length).toBe(2));
        // another item's comments are not this one's
        act(() => appRealtime.receive({ channel: 'cmts_bx_timeline_101', event: 'comment_added', data: { id: 101 } }));
        await act(() => new Promise((r) => setTimeout(r, 20)));
        expect(calls.filter((c) => c === 'GET /content/100/comments').length).toBe(2);
    });

    it('shows the author\'s badges after the name, in comments and their replies: two pills, +N, and every badge in the comment\'s name', async () => {
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1', { author: andrey, replies: 1 }), comment('2')]),
            'GET /comments/1/replies': () => page([comment('3', { parent_id: '1', depth: 1, author: andrey })]),
        });
        renderTree(api);
        const top = await screen.findByRole('article', { name: /^Andrey ?, Founder, Moderator, Top contributor$/ });
        // no router here: the name is text (a button that opens the profile elsewhere)
        const by = within(top).getByText('Andrey', { selector: 'strong' });
        // after the name, on its line, before the time
        const shown = top.querySelector('.comment-meta .badges') as HTMLElement;
        expect(shown.previousElementSibling).toBe(by);
        expect(by.compareDocumentPosition(top.querySelector('.comment-time')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(pills(top)).toEqual(['Founder', 'Moderator', '+1']);
        expect(shown.querySelector('.badges-pills')?.getAttribute('aria-hidden')).toBe('true');
        // the buttons still name only the person
        expect(screen.getByRole('button', { name: 'Leave a reply to Andrey' })).toBeTruthy();
        // none: no pills, the name alone
        const plain = screen.getByRole('article', { name: 'Lily' });
        expect(plain.querySelector('.badges')).toBeNull();

        await waitFor(() => expect(screen.getAllByRole('article', { name: /^Andrey ?, Founder, Moderator, Top contributor$/ })).toHaveLength(2));
        const reply = screen.getAllByRole('article', { name: /^Andrey ?, Founder, Moderator, Top contributor$/ })[1]!;
        expect(reply.closest('.replies')).toBeTruthy();
        expect(pills(reply)).toEqual(['Founder', 'Moderator', '+1']);
    });

    it('opened for a reply (a notification), opens its thread and focuses it', async () => {
        const calls: string[] = [];
        const api = fakeApi(
            { 'GET /content/100/comments': () => page([comment('1', { replies: 1 }), comment('2')]), 'GET /comments/1/replies': () => page([comment('3', { parent_id: '1', depth: 1, author: mila })]) },
            calls,
        );
        renderTree(api, { id: '3', thread: '1' });
        const reply = await screen.findByRole('article', { name: 'Mila' });
        expect(calls).toContain('GET /comments/1/replies');
        await waitFor(() => expect(document.activeElement).toBe(reply));
        expect(reply.hasAttribute('data-target')).toBe(true);
    });

    it('opened for a top-level comment, focuses it', async () => {
        const api = fakeApi({ 'GET /content/100/comments': () => page([comment('1', { replies: 1 }), comment('2', { author: mila })]), 'GET /comments/1/replies': () => page([]) });
        renderTree(api, { id: '2' });
        const target = await screen.findByRole('article', { name: 'Mila' });
        await waitFor(() => expect(document.activeElement).toBe(target));
    });

    it('loads pages until the comment it was opened for is there', async () => {
        const calls: string[] = [];
        const api = fakeApi(
            {
                'GET /content/100/comments': (r) =>
                    new URL(r.url).searchParams.get('cursor') === 'p2' ? page([comment('21', { author: mila })]) : { status: 200, body: { items: [comment('1'), comment('2')], next_cursor: 'p2' } },
            },
            calls,
        );
        renderTree(api, { id: '21' });
        const target = await screen.findByRole('article', { name: 'Mila' });
        await waitFor(() => expect(document.activeElement).toBe(target));
        expect(calls.filter((c) => c === 'GET /content/100/comments')).toHaveLength(2);
    });

    it('says so when the comment it was opened for is gone, and focuses the comments heading', async () => {
        const api = fakeApi({ 'GET /content/100/comments': () => page([comment('1'), comment('2')]) });
        renderTree(api, { id: '404' });
        const heading = await screen.findByRole('heading', { name: /Comments/ });
        await waitFor(() => expect(document.activeElement).toBe(heading));
        expect(await screen.findByText('That comment can’t be shown here. It may have been deleted.')).toBeTruthy();
    });

    it('opens another thread when the target changes on the open post', async () => {
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1', { replies: 1 }), comment('2', { replies: 1 })]),
            'GET /comments/1/replies': () => page([comment('3', { parent_id: '1', depth: 1 })]),
            'GET /comments/2/replies': () => page([comment('4', { parent_id: '2', depth: 1, author: mila })]),
        });
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
        const ctx = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} } as unknown as AppContextValue;
        const tree = (target: CommentTarget) => (
            <QueryClientProvider client={client}>
                <AppContext.Provider value={ctx}>
                    <CommentTree item={item} target={target} />
                </AppContext.Provider>
            </QueryClientProvider>
        );
        const { rerender } = render(tree({ id: '3', thread: '1' }));
        await waitFor(() => expect((document.activeElement as HTMLElement).id).toBe('comment-3'));
        rerender(tree({ id: '4', thread: '2' }));
        const reply = await screen.findByRole('article', { name: 'Mila' });
        await waitFor(() => expect(document.activeElement).toBe(reply));
    });

    it('draws each thread as one card: the comment, its replies, then the thread\'s reply row; a site\'s own line stands apart', async () => {
        const calls: string[] = [];
        const api = fakeApi(
            {
                'GET /content/100/comments': () =>
                    page([
                        comment('1', { replies: 1 }),
                        comment('6', { author: null, automated: true, body: 'Eric completed the task', body_html: 'Eric completed the task', viewer: null }),
                        comment('2'),
                    ]),
                'GET /comments/1/replies': () => page([comment('3', { parent_id: '1', depth: 1, author: mila }), comment('4', { parent_id: '3', depth: 2 })]),
            },
            calls,
        );
        renderTree(api);

        const replies = await screen.findByRole('list', { name: 'Replies to Lily' });
        expect(within(replies).getAllByRole('article')).toHaveLength(2);
        expect(within(replies).getByText('replying to Mila')).toBeTruthy();
        // only threads with replies ask for them
        expect(calls).toContain('GET /comments/1/replies');
        expect(calls).not.toContain('GET /comments/2/replies');

        const card = replies.closest('.comment-thread') as HTMLElement;
        const parts = Array.from(card.children).map((el) => el.className);
        expect(parts).toEqual(['comment', 'replies', 'thread-reply']);
        // one reply row per thread, none per reply
        expect(within(card).getAllByRole('button', { name: /Leave a reply/ })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: /Leave a reply/ })).toHaveLength(2);
        expect(screen.getByText('Eric completed the task').closest('.comment-thread')).toBeNull();
    });

    it('replies under a comment with its id as parent_id, opens the thread and counts the reply', async () => {
        let sent: unknown = null;
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1')]),
            // the thread's first reply: its replies load once it has one, and then hold it
            'GET /comments/1/replies': () => page(sent ? [comment('5', { parent_id: '1', depth: 1, body: 'Thanks', body_html: '<p>Thanks</p>' })] : []),
            'POST /content/100/comments': async (request) => {
                sent = await request.json();
                return { status: 201, body: comment('5', { parent_id: '1', depth: 1, body: 'Thanks', body_html: '<p>Thanks</p>' }) };
            },
        });
        const client = renderTree(api);

        fireEvent.click(await screen.findByRole('button', { name: 'Leave a reply to Lily' }));
        const box = screen.getByRole('textbox', { name: 'Reply to Lily' });
        expect(document.activeElement).toBe(box);
        setRichText(box, 'Thanks');
        fireEvent.keyDown(box, { key: 'Enter', metaKey: true });

        await waitFor(() => expect(sent).toEqual({ body_html: '<p>Thanks</p>', parent_id: '1' }));
        expect(await screen.findByText('Thanks')).toBeTruthy();
        expect(screen.queryByRole('textbox', { name: 'Reply to Lily' })).toBeNull();
        // focus goes back to the thread's reply row
        expect(document.activeElement?.id).toBe('comment-1-reply');
        const top = commentItems(client.getQueryData<CommentsData>(commentsKey('100')));
        expect(top[0]?.replies).toBe(1);
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Reply posted'));
    });

    it('edits in place; Esc puts the edit away and focus goes back to Edit', async () => {
        let sent: unknown = null;
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1')]),
            'PATCH /comments/1': async (request) => {
                sent = await request.json();
                return { status: 200, body: comment('1', { body: 'Fixed', body_html: '<p>Fixed</p>' }) };
            },
        });
        renderTree(api);

        const edit = await screen.findByRole('button', { name: 'Edit the comment by Lily' });
        fireEvent.click(edit);
        let box = screen.getByRole('textbox', { name: 'Edit the comment by Lily' });
        expect(richText(box)).toBe('Comment 1');
        fireEvent.keyDown(box, { key: 'Escape' });
        expect(screen.queryByRole('textbox', { name: 'Edit the comment by Lily' })).toBeNull();
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit the comment by Lily' }));

        fireEvent.click(screen.getByRole('button', { name: 'Edit the comment by Lily' }));
        box = screen.getByRole('textbox', { name: 'Edit the comment by Lily' });
        expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
        setRichText(box, 'Fixed');
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Fixed')).toBeTruthy();
        expect(sent).toEqual({ body_html: '<p>Fixed</p>' });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit the comment by Lily' }));
    });

    it('edits a comment with a mention as HTML, keeping the mention', async () => {
        let sent: unknown = null;
        const mention = '<a class="bx-mention-link" data-profile-id="8" href="https://community.example/u/mila">Mila</a>';
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1', { body: 'Hi Mila', body_html: `<p>Hi ${mention}</p>` })]),
            'PATCH /comments/1': async (request) => {
                sent = await request.json();
                return { status: 200, body: comment('1', { body: 'Hi Mila again', body_html: '<p>Hi again</p>' }) };
            },
        });
        renderTree(api);
        fireEvent.click(await screen.findByRole('button', { name: 'Edit the comment by Lily' }));
        const box = screen.getByRole('textbox', { name: 'Edit the comment by Lily' });
        expect(richText(box)).toBe('Hi @Mila');
        // nothing changed yet: the stored HTML as the editor writes it back is no edit
        expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
        typeRich(box, ' again');
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(sent).toEqual({ body_html: '<p>Hi <a href="https://community.example/u/mila" title="Mila" dchar="@" data-profile-id="8" class="bx-mention-link">@Mila</a> again</p>' }));
    });

    it('deletes after asking, and keeps the comment when the answer is no', async () => {
        const calls: string[] = [];
        const api = fakeApi({ 'GET /content/100/comments': () => page([comment('1'), comment('2')]), 'DELETE /comments/2': () => ({ status: 204 }) }, calls);
        renderTree(api);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

        const del = await screen.findAllByRole('button', { name: 'Delete the comment by Lily' });
        fireEvent.click(del[1] as HTMLElement);
        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        expect(calls).not.toContain('DELETE /comments/2');
        expect(screen.getByText('Comment 2')).toBeTruthy();

        confirm.mockReturnValue(true);
        fireEvent.click(del[1] as HTMLElement);
        await waitFor(() => expect(screen.queryByText('Comment 2')).toBeNull());
        expect(calls).toContain('DELETE /comments/2');
        expect(document.activeElement?.textContent).toMatch(/^Comments/);
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Comment deleted'));
    });

    it('keeps what was typed in a box when another one opens, and asks before Cancel throws it away', async () => {
        const api = fakeApi({ 'GET /content/100/comments': () => page([comment('1'), comment('2', { author: mila })]) });
        renderTree(api);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

        fireEvent.click(await screen.findByRole('button', { name: 'Leave a reply to Mila' }));
        setRichText(screen.getByRole('textbox', { name: 'Reply to Mila' }), 'Half a reply');
        // another box: the reply is put away, not lost
        fireEvent.click(screen.getByRole('button', { name: 'Edit the comment by Lily' }));
        expect(screen.queryByRole('textbox', { name: 'Reply to Mila' })).toBeNull();
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Reply draft kept'));
        fireEvent.click(screen.getByRole('button', { name: 'Leave a reply to Mila' }));
        const box = screen.getByRole('textbox', { name: 'Reply to Mila' });
        expect(richText(box)).toBe('Half a reply');

        // Esc asks; no keeps the box open with the text
        fireEvent.keyDown(box, { key: 'Escape' });
        await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
        expect(richText(screen.getByRole('textbox', { name: 'Reply to Mila' }))).toBe('Half a reply');

        confirm.mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Reply to Mila' })).toBeNull());
        expect(document.activeElement?.id).toBe('comment-2-reply');
        fireEvent.click(screen.getByRole('button', { name: 'Leave a reply to Mila' }));
        expect(richText(screen.getByRole('textbox', { name: 'Reply to Mila' }))).toBe('');

        // an empty box closes without asking
        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Reply to Mila' }), { key: 'Escape' });
        expect(confirm).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Reply to Mila' })).toBeNull());
    });

    it('refreshes only the comment count of the post, so a reaction on its way is not undone', async () => {
        const api = fakeApi({
            'GET /content/100/comments': () => page([]),
            'POST /content/100/comments': () => ({ status: 201, body: comment('9') }),
            // read before the reaction was saved
            'GET /content/100': () => ({ status: 200, body: { ...item, stats: { ...item.stats, comments: 3 } } }),
        });
        const client = renderTree(api);
        const activity = {
            id: '50',
            verb: 'posted',
            object: { ...item, viewer: { ...item.viewer, reaction: 'like' }, stats: { ...item.stats, reactions: 1 } },
            pinned: false,
            sticky: false,
            promoted: false,
            version: 'v1',
            created_at: item.published_at,
        };
        client.setQueryData(['activity', '50'], activity);

        const box = await screen.findByRole('textbox', { name: 'Write a comment' });
        setRichText(box, 'Hi');
        fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
        await waitFor(() => expect(client.getQueryData<Schema<'Activity'>>(['activity', '50'])?.object.stats.comments).toBe(3));
        const after = client.getQueryData<Schema<'Activity'>>(['activity', '50'])?.object;
        expect(after?.viewer?.reaction).toBe('like');
        expect(after?.stats.reactions).toBe(1);
    });

    it('docks the post’s own box: says who writes, keeps Send focusable while empty and says why, sends with Cmd+Enter', async () => {
        const calls: string[] = [];
        const api = fakeApi({ 'GET /content/100/comments': () => page([]), 'POST /content/100/comments': () => ({ status: 201, body: comment('9') }) }, calls);
        renderTree(api);
        const box = await screen.findByRole('textbox', { name: 'Write a comment' });
        const form = box.closest('form');
        expect(form?.classList.contains('docked')).toBe(true);
        // outside the comments section, so it can stick to the pane's bottom
        expect(form?.closest('section.comments')).toBeNull();
        expect(within(form as HTMLElement).getByText('Commenting as Andrey')).toBeTruthy();

        const send = screen.getByRole('button', { name: 'Send comment' });
        expect(send.hasAttribute('disabled')).toBe(false);
        expect(send.getAttribute('aria-disabled')).toBe('true');
        const reason = document.getElementById(send.getAttribute('aria-describedby') ?? '');
        expect(reason?.textContent).toMatch(/Write something to send/);
        send.focus();
        fireEvent.click(send);
        expect(calls).not.toContain('POST /content/100/comments');
        expect(document.activeElement).toBe(send);

        setRichText(box, 'Hello');
        expect(send.hasAttribute('aria-disabled')).toBe(false);
        fireEvent.keyDown(box, { key: 'Enter', metaKey: true });
        await waitFor(() => expect(calls).toContain('POST /content/100/comments'));
        await waitFor(() => expect(richText(box)).toBe(''));
    });

    it('a reply box does not say who writes', async () => {
        const api = fakeApi({ 'GET /content/100/comments': () => page([comment('1')]) });
        renderTree(api);
        fireEvent.click(await screen.findByRole('button', { name: 'Leave a reply to Lily' }));
        const reply = await screen.findByRole('textbox', { name: /Reply to Lily/ });
        expect(reply.closest('form')?.classList.contains('docked')).toBe(false);
        expect(screen.getAllByText(/Commenting as/)).toHaveLength(1);
    });

    it('shows why the site refused a delete', async () => {
        const api = fakeApi({
            'GET /content/100/comments': () => page([comment('1', { replies: 2 })]),
            'DELETE /comments/1': () => ({ status: 409, body: { type: 'about:blank', title: 'Conflict', status: 409, code: 'has_replies', detail: 'Cannot delete comments with replies' } }),
        });
        renderTree(api);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fireEvent.click(await screen.findByRole('button', { name: 'Delete the comment by Lily' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Cannot delete comments with replies');
        expect(screen.getByText('Comment 1')).toBeTruthy();
    });
});

describe('comment cache', () => {
    it('drops a deleted reply and counts one reply less on its parent', () => {
        const client = new QueryClient();
        client.setQueryData<CommentsData>(commentsKey('100'), { pages: [{ items: [comment('1', { replies: 2 })], next_cursor: null }], pageParams: [undefined] });
        client.setQueryData<CommentsData>(repliesKey('1'), { pages: [{ items: [comment('3', { parent_id: '1' }), comment('4', { parent_id: '1' })], next_cursor: null }], pageParams: [undefined] });

        dropComment(client, comment('3', { parent_id: '1' }));
        expect(commentItems(client.getQueryData(repliesKey('1'))).map((c) => c.id)).toEqual(['4']);
        expect(commentItems(client.getQueryData(commentsKey('100')))[0]?.replies).toBe(1);

        countReply(client, '1');
        expect(commentItems(client.getQueryData(commentsKey('100')))[0]?.replies).toBe(2);
    });

    it('drops the replies a deleted reply takes along, and reloads a list with more pages', () => {
        const client = new QueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        client.setQueryData<CommentsData>(commentsKey('100'), { pages: [{ items: [comment('1', { replies: 1 }), comment('2')], next_cursor: 'b2Zmc2V0OjI' }], pageParams: [undefined] });
        client.setQueryData<CommentsData>(repliesKey('1'), {
            pages: [{ items: [comment('3', { parent_id: '1', replies: 1 }), comment('4', { parent_id: '3', replies: 1 }), comment('5', { parent_id: '4' }), comment('6', { parent_id: '1' })], next_cursor: null }],
            pageParams: [undefined],
        });

        dropComment(client, comment('3', { parent_id: '1', replies: 1 }));
        expect(commentItems(client.getQueryData(repliesKey('1'))).map((c) => c.id)).toEqual(['6']);
        expect(commentItems(client.getQueryData(commentsKey('100')))[0]?.replies).toBe(0);
        // the replies list was loaded to its end: nothing to reload
        expect(invalidate).not.toHaveBeenCalled();

        dropComment(client, comment('2'));
        expect(commentItems(client.getQueryData(commentsKey('100'))).map((c) => c.id)).toEqual(['1']);
        // its next page starts one comment later than it should now
        expect(invalidate).toHaveBeenCalledWith(commentsKey('100'), { exact: true });
    });
});

describe('Lightbox', () => {
    const photos = ['a', 'b', 'c'].map((id) => ({
        id,
        kind: 'image',
        url: `https://x/${id}.jpg`,
        variants: { large: { url: `https://x/${id}-large.jpg`, width: 400, height: 300 } },
        width: 400,
        height: 300,
    })) as unknown as Schema<'Media'>[];

    function Harness() {
        const [index, setIndex] = useState<number | null>(null);
        return (
            <>
                <button type="button" onClick={() => setIndex(1)}>
                    Open
                </button>
                <Lightbox images={photos} index={index} onIndex={setIndex} onClose={() => setIndex(null)} label="Lily’s post" />
            </>
        );
    }

    it('goes through the photos with the arrow keys and gives focus back on close', () => {
        render(<Harness />);
        const opener = screen.getByRole('button', { name: 'Open' });
        opener.focus();
        fireEvent.click(opener);
        const dialog = screen.getByRole('dialog', { hidden: true });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 2 of 3, Lily’s post');
        expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://x/b-large.jpg');

        fireEvent.keyDown(dialog, { key: 'ArrowRight' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 3 of 3, Lily’s post');
        fireEvent.keyDown(dialog, { key: 'ArrowRight' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 1 of 3, Lily’s post');
        fireEvent.keyDown(dialog, { key: 'End' });
        expect(dialog.getAttribute('aria-label')).toBe('Photo 3 of 3, Lily’s post');

        act(() => {
            fireEvent.click(within(dialog).getByRole('button', { name: 'Close', hidden: true }));
        });
        expect(dialog.hasAttribute('open')).toBe(false);
        expect(document.activeElement).toBe(opener);
    });

    it('counts only the photos the page may show, and keeps Close for one it cannot', () => {
        const mixed = [...photos.slice(0, 2), { id: 'x', kind: 'image', url: 'http://community.example/x.jpg' } as Schema<'Media'>];
        // a plain-http picture of a remote host is refused (no signed-in app here: https only)
        expect(photosOf(mixed, (url) => mediaSrc(url, null)).map((m) => m.id)).toEqual(['a', 'b']);

        render(<Lightbox images={mixed} index={2} onIndex={() => undefined} onClose={() => undefined} label="Lily’s post" />);
        const dialog = screen.getByRole('dialog', { hidden: true });
        expect(dialog.querySelector('img')).toBeNull();
        expect(within(dialog).getByText('This photo can’t be shown here.')).toBeTruthy();
        expect(within(dialog).getByRole('button', { name: 'Close', hidden: true })).toBeTruthy();
    });
});
