import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { ActivityCard, audienceText } from '../../components/activity-card';
import { MY_GROUPS_KEY } from '../groups/groups';
import { MenuHost } from '../../components/menu-popover';
import { AppContext, type AppContextValue } from '../../lib/context';
import { draftKey, draftStore, setDraftStore } from '../../lib/drafts';
import { RouterProvider } from '../../lib/navigation';
import { RouteHistory } from '../../lib/router';
import type { Picked, Uploader } from '../../lib/uploads';
import { UploadError } from '../../lib/uploads';
import { type Attachment, attachmentsReducer, fromDraft, mediaIds, POLL_FIRST_MS, postBlocker, useAttachments } from './attachments';
import { ComposeProvider, NEW_POST_FIELD, useCompose } from './compose-sheet';
import { postChanges } from './post-editor';
import { isEditableHtml } from './post-text';
import { richText, setRichText, typeRich } from '../../components/rich-editor/test-utils';

type Media = Schema<'Media'>;

const SITE = 'https://community.example';
const media = (id: string, extra: Partial<Media> = {}): Media => ({ id, kind: 'image', mime: 'image/png', size: 0, state: 'ready', original_name: '', url: '', download_url: '', variants: {}, width: 4, height: 3, ...extra });
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>;

type Call = { method: string; path: string; body: unknown };

type Answer = { status: number; body?: unknown };
function fakeApi(calls: Call[], answer: (c: Call) => Answer | Promise<Answer> = () => ({ status: 204 })): UnaApi {
    return createUnaApi({
        siteUrl: SITE,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const text = await request.text();
            const call = { method: request.method, path: new URL(request.url).pathname.replace(/^\/api\/v2/, ''), body: text ? (JSON.parse(text) as unknown) : null };
            calls.push(call);
            const { status, body } = await answer(call);
            return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

/** Uploads that finish when the test says so. */
function fakeUploader() {
    const pending = new Map<string, { resolve: (m: Media) => void; reject: (e: unknown) => void; progress: (s: number, t: number) => void }>();
    const released: string[] = [];
    const cancelled: string[] = [];
    const uploader: Uploader = {
        pick: async () => ({ files: [{ handle: 'h-picked', name: 'picked.jpg', size: 100, mime: 'image/jpeg', kind: 'image' }], refused: [] }),
        fromFiles: async (files) => ({
            files: files.filter((f) => f.type.startsWith('image/')).map((f) => ({ handle: `h-${f.name}`, file: f, name: f.name, size: f.size, mime: f.type, kind: 'image' as const })),
            refused: files.filter((f) => !f.type.startsWith('image/')).map((f) => f.name),
        }),
        fromPaths: async () => ({ files: [], refused: [] }),
        upload: (file: Picked, progress) =>
            new Promise<Media>((resolve, reject) => {
                pending.set(file.handle ?? file.name, { resolve, reject, progress });
            }),
        cancel: (file) => {
            cancelled.push(file.handle ?? '');
            pending.get(file.handle ?? '')?.reject(new UploadError('stopped', 0, 'cancelled'));
        },
        release: (file) => released.push(file.handle ?? ''),
    };
    return { uploader, pending, released, cancelled };
}

function wrapper(api: UnaApi, client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } })) {
    const ctx: AppContextValue = { api, siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>
                <AppContext.Provider value={ctx}>
                    {children}
                    <MenuHost />
                </AppContext.Provider>
            </QueryClientProvider>
        );
    };
}

/** Edit is in the post's More menu (outside the app, the page's own menu). */
function chooseEdit() {
    fireEvent.click(screen.getByRole('button', { name: /^More actions for / }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Post' }));
}

function Opener() {
    const compose = useCompose();
    return (
        <button type="button" onClick={() => compose?.open()}>
            Write
        </button>
    );
}

const created = (id: string, mediaList: Media[] = []): Schema<'Activity'> =>
    ({
        id,
        verb: 'posted',
        object: { id: `c${id}`, kind: 'feed_post', module: 'bx_timeline', anonymous: false, audience: 'public', card: { text: 'x' }, media: mediaList, stats: { comments: 0, reactions: 0, reposts: 0, views: 0 }, published_at: '2026-11-06T00:00:00Z', viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true } },
        pinned: false,
        sticky: false,
        promoted: false,
        version: 'v1',
        created_at: '2026-11-06T00:00:00Z',
    }) as unknown as Schema<'Activity'>;

afterEach(() => {
    cleanup();
    localStorage.clear();
    setDraftStore(null);
});

describe('the attachment tray', () => {
    const one = (status: Attachment['status'], id = '1'): Attachment => ({ key: id, name: `${id}.png`, kind: 'image', size: 10, status, sent: 0, total: 10, media: status === 'done' ? media(`m${id}`) : undefined, picked: { handle: id, name: `${id}.png`, size: 10, mime: 'image/png', kind: 'image' } });

    it('posts only once every upload is done', () => {
        expect(postBlocker([one('done'), one('uploading', '2')])).toMatch(/Wait/);
        expect(postBlocker([one('failed')])).toMatch(/Remove or retry/);
        expect(postBlocker([one('done'), one('done', '2')])).toBeNull();
        expect(mediaIds([one('done', '2'), one('done', '1')])).toEqual(['m2', 'm1']);
    });

    it('never moves a finished upload back with a late progress message', () => {
        let s = attachmentsReducer([], { type: 'add', items: [one('uploading')] });
        s = attachmentsReducer(s, { type: 'progress', key: '1', sent: 5, total: 10 });
        expect(s[0]?.sent).toBe(5);
        s = attachmentsReducer(s, { type: 'done', key: '1', media: media('m1'), at: 1 });
        s = attachmentsReducer(s, { type: 'progress', key: '1', sent: 7, total: 10 });
        expect(s[0]).toMatchObject({ status: 'done', sent: 10 });
        expect(s[0]?.picked).toBeUndefined();
    });

    it('uploads as files are added, retries a failed one and deletes an unused upload on the site', async () => {
        const calls: Call[] = [];
        const api = fakeApi(calls);
        const { uploader, pending, released } = fakeUploader();
        const said: string[] = [];
        const { result } = renderHook(() => useAttachments({ uploader, api, announce: (t) => said.push(t) }), { wrapper: wrapper(api) });

        act(() => void result.current.add({ files: [{ handle: 'a', name: 'a.png', size: 10, mime: 'image/png', kind: 'image' }], refused: ['notes.txt'] }));
        expect(result.current.items).toHaveLength(1);
        expect(said.at(-1)).toContain('Not a photo or video: notes.txt');

        act(() => pending.get('a')?.progress(4, 10));
        expect(result.current.items[0]?.sent).toBe(4);
        await act(async () => pending.get('a')?.reject(new UploadError('Too large', 413, 'file_too_big')));
        expect(result.current.items[0]).toMatchObject({ status: 'failed', error: 'Too large' });

        act(() => result.current.retry(result.current.items[0]!.key));
        expect(result.current.items[0]?.status).toBe('uploading');
        await act(async () => pending.get('a')?.resolve(media('42')));
        expect(result.current.items[0]).toMatchObject({ status: 'done' });
        expect(released).toContain('a');

        act(() => result.current.remove(result.current.items[0]!.key));
        expect(result.current.items).toHaveLength(0);
        await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/uploads/42')).toBe(true));
    });

    // a file made ready is kept by the app until it is uploaded or let go
    const file = (handle: string): Picked => ({ handle, name: `${handle}.png`, size: 10, mime: 'image/png', kind: 'image' });

    it('lets go files made ready after the tray went away, and starts no upload', () => {
        const api = fakeApi([]);
        const { uploader, pending, released } = fakeUploader();
        const { result, unmount } = renderHook(() => useAttachments({ uploader, api, announce: () => {} }), { wrapper: wrapper(api) });
        const { add } = result.current;
        unmount();
        // a paste or a drop that was still being made ready when the composer closed
        expect(add({ files: [file('a'), file('b')], refused: [] })).toBe(0);
        expect(released).toEqual(['a', 'b']);
        expect(pending.size).toBe(0);
    });

    it('lets go a file added the moment the tray goes away, before it was drawn', () => {
        const api = fakeApi([]);
        const { uploader, released, cancelled } = fakeUploader();
        const { result, unmount } = renderHook(() => useAttachments({ uploader, api, announce: () => {} }), { wrapper: wrapper(api) });
        act(() => {
            result.current.add({ files: [file('a')], refused: [] });
            unmount();
        });
        expect(cancelled).toEqual(['a']);
        expect(released).toEqual(['a']);
    });

    it('lets go a failed or unfinished upload when the tray starts over, and keeps those that stay', async () => {
        const api = fakeApi([]);
        const { uploader, pending, released, cancelled } = fakeUploader();
        const { result } = renderHook(() => useAttachments({ uploader, api, announce: () => {} }), { wrapper: wrapper(api) });
        act(() => void result.current.add({ files: [file('a'), file('b'), file('c')], refused: [] }));
        await act(async () => pending.get('a')?.reject(new UploadError('Too large', 413, 'file_too_big')));
        expect(result.current.items.map((a) => a.status)).toEqual(['failed', 'uploading', 'uploading']);
        // the third stays (a request that took the others): nothing of it is stopped or let go
        act(() => result.current.reset([result.current.items[2]!]));
        expect(cancelled).toEqual(['b']);
        expect(released).toEqual(['a', 'b']);
        expect(result.current.items.map((a) => a.name)).toEqual(['c.png']);
    });
});

describe('post text', () => {
    it('edits a post whose markup the editor keeps', () => {
        expect(isEditableHtml('<p>a</p><p>b<br />c</p>', 'mini')).toBe(true);
        expect(isEditableHtml('<p>see <a href="https://x">this</a> <a class="bx-mention-link" data-profile-id="4" href="https://x/u">Lily</a></p>', 'mini')).toBe(true);
        expect(isEditableHtml('<p><b>bold</b></p>', 'mini')).toBe(false);
        expect(isEditableHtml('<p><b>bold</b></p><ul><li>x</li></ul><div class="bx-embed-link" source="https://v">https://v</div>', 'full')).toBe(true);
        expect(isEditableHtml('<table><tr><td>x</td></tr></table>', 'full')).toBe(false);
        expect(isEditableHtml('<div>loose</div>', 'full')).toBe(false);
    });

    it('says who can see a post in words, not the API value', () => {
        expect(audienceText('public')).toBeNull();
        expect(audienceText('friends')).toBe('Visible to friends');
        expect(audienceText('members')).toBe('Visible to members');
        expect(audienceText('private')).toBe('Only me');
        // a post in a group: the group decides, and the row does not say 'context'
        expect(audienceText('context')).toBeNull();
    });

    it('sends only what the editor changed', () => {
        const post = created('9');
        post.object.card.body_html = '<p>Hello</p>';
        expect(postChanges(post, { html: '<p>Hello</p>', audience: 'public' })).toEqual({});
        expect(postChanges(post, { html: '<p>Hello there</p>', audience: 'public' })).toEqual({ body_html: '<p>Hello there</p>' });
        expect(postChanges(post, { html: null, audience: 'friends' })).toEqual({ audience: 'friends' });
        expect(postChanges(post, { html: '<p><br></p>', audience: null })).toEqual({});
        // a text the site wrote another way, untouched, is no change
        post.object.card.body_html = '<p>Hi <a class="bx-mention-link" data-profile-id="4" href="https://community.example/u/lily">Lily</a></p>';
        expect(postChanges(post, { html: '<p>Hi <a href="https://community.example/u/lily" title="Lily" dchar="@" data-profile-id="4" class="bx-mention-link">@Lily</a></p>', audience: null })).toEqual({});
    });
});

describe('editing one\'s own post in the thread pane', () => {
    it('saves the new text and audience, says so and gives focus back to the More button', async () => {
        const calls: Call[] = [];
        const post = created('9');
        post.object.card.body_html = '<p>Before</p>';
        const api = fakeApi(calls, (c) => {
            if (c.method !== 'PATCH') return { status: 204 };
            const after = created('9');
            after.object.card.body_html = '<p>After</p>';
            after.object.audience = 'members';
            return { status: 200, body: after };
        });
        const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
        client.setQueryData(['activity', '9'], post);
        function Detail() {
            const data = useQuery<Schema<'Activity'>>({ queryKey: ['activity', '9'], enabled: false });
            return data.data ? <ActivityCard activity={data.data} variant="detail" /> : null;
        }
        render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: { kind: 'post', id: '9' } })}>
                <Detail />
            </RouterProvider>,
            { wrapper: wrapper(api, client) },
        );

        chooseEdit();
        const editor = screen.getByRole('form', { name: 'Edit the post' });
        const text = within(editor).getByRole('textbox', { name: 'Post text' });
        expect(richText(text)).toBe('Before');
        // the editor keeps the focus it takes: the menu's return to More comes before it
        expect(document.activeElement).toBe(text);
        // a right-click in the editor is the system's (paste, spelling), not the post's menu
        expect(fireEvent.contextMenu(text)).toBe(true);
        expect(screen.queryByRole('menu')).toBeNull();
        setRichText(text, 'After');
        fireEvent.change(within(editor).getByRole('combobox', { name: 'Who can see it' }), { target: { value: 'members' } });
        fireEvent.keyDown(text, { key: 'Enter', ctrlKey: true });

        await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull());
        expect(calls.find((c) => c.method === 'PATCH')).toEqual({ method: 'PATCH', path: '/feed-posts/9', body: { body_html: '<p>After</p>', audience: 'members' } });
        expect(screen.getByText('After')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toBe('Post saved');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: /^More actions for / }));
    });

    it('keeps a post’s mentions and links when its text is edited', async () => {
        const calls: Call[] = [];
        const post = created('9');
        post.object.card.body_html = '<p>Hi <a class="bx-mention-link" data-profile-id="4" href="https://community.example/u/lily">Lily</a>, see <a href="https://example.com">this</a></p>';
        const api = fakeApi(calls, (c) => (c.method === 'PATCH' ? { status: 200, body: post } : { status: 204 }));
        render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                <ActivityCard activity={post} variant="detail" />
            </RouterProvider>,
            { wrapper: wrapper(api, new QueryClient()) },
        );
        chooseEdit();
        const editor = screen.getByRole('form', { name: 'Edit the post' });
        const text = within(editor).getByRole('textbox', { name: 'Post text' });
        expect(richText(text)).toBe('Hi @Lily, see this');
        typeRich(text, ' today');
        fireEvent.keyDown(text, { key: 'Enter', ctrlKey: true });
        await waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(true));
        expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({
            body_html: '<p>Hi <a href="https://community.example/u/lily" title="Lily" dchar="@" data-profile-id="4" class="bx-mention-link">@Lily</a>, see <a href="https://example.com">this</a> today</p>',
        });
    });

    it('changes only the audience of a post with markup the editor would lose', () => {
        const post = created('9');
        post.object.card.body_html = '<p>See</p><table><tr><td>this</td></tr></table>';
        const client = new QueryClient();
        render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                <ActivityCard activity={post} variant="detail" />
            </RouterProvider>,
            { wrapper: wrapper(fakeApi([]), client) },
        );
        chooseEdit();
        const editor = screen.getByRole('form', { name: 'Edit the post' });
        expect(within(editor).queryByRole('textbox')).toBeNull();
        expect(within(editor).getByText(/Edit its text on the site/)).toBeTruthy();
    });
});

describe('a post in a group, in a list', () => {
    it('names its group from one\'s own groups once they load, without asking for the group', async () => {
        const calls: Call[] = [];
        // GET /groups/{id} never answers: only the cached /me/groups can name it
        const api = fakeApi(calls, () => new Promise<Answer>(() => {}));
        const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
        const post = created('51');
        post.object.viewer!.can_react = false;
        post.object.audience = 'context';
        post.object.context_id = 'g5';
        render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                <ActivityCard activity={post} />
            </RouterProvider>,
            { wrapper: wrapper(api, client) },
        );
        expect(screen.queryByText('Makers Guild')).toBeNull();
        act(() => {
            client.setQueryData(MY_GROUPS_KEY, [{ id: 'g5', kind: 'group', display_name: 'Makers Guild' }]);
        });
        expect(screen.getByText('Makers Guild')).toBeTruthy();
    });
});

describe('a post\'s reactions', () => {
    it('keeps the count while the site\'s reactions are on their way', () => {
        const post = created('61');
        post.object.stats.reactions = 12;
        render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                <ActivityCard activity={post} />
            </RouterProvider>,
            { wrapper: wrapper(fakeApi([], () => new Promise<Answer>(() => {}))) },
        );
        const post61 = screen.getByRole('article');
        expect(within(post61).getByText('12 reactions')).toBeTruthy();
    });
});

describe('a long post in a list', () => {
    it('keeps its Show more control as Show less, so focus stays on it, and stays expanded when it mounts again', () => {
        const scroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
        const client = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 600 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 240 });
        try {
            const post = created('41');
            post.object.viewer!.can_react = false;
            const view = () => (
                <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                    <ActivityCard activity={post} />
                </RouterProvider>
            );
            const { unmount } = render(view(), { wrapper: wrapper(fakeApi([])) });
            const more = screen.getByRole('button', { name: 'Show more' });
            expect(more.getAttribute('aria-expanded')).toBe('false');
            expect(document.getElementById(more.getAttribute('aria-controls') ?? '')?.dataset.clamped).toBe('true');
            more.focus();
            fireEvent.click(more);
            expect(more.isConnected).toBe(true);
            expect(more.textContent).toBe('Show less');
            expect(more.getAttribute('aria-expanded')).toBe('true');
            expect(document.activeElement).toBe(more);
            // a virtualized row that scrolls away and back keeps its height
            unmount();
            render(view(), { wrapper: wrapper(fakeApi([])) });
            const again = screen.getByRole('button', { name: 'Show less' });
            fireEvent.click(again);
            expect(screen.getByRole('button', { name: 'Show more' })).toBe(again);
        } finally {
            if (scroll) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scroll);
            if (client) Object.defineProperty(HTMLElement.prototype, 'clientHeight', client);
        }
    });
});

describe('the compose sheet', () => {
    function renderSheet(api: UnaApi, uploader: Uploader) {
        return render(
            <ComposeProvider uploader={uploader}>
                <Opener />
            </ComposeProvider>,
            { wrapper: wrapper(api) },
        );
    }

    it('keeps what was typed as a lasting draft, back after a restart and gone once posted', async () => {
        const calls: Call[] = [];
        const api = fakeApi(calls, (c) => (c.method === 'POST' && c.path === '/feed-posts' ? { status: 201, body: created('5', [media('77')]) } : { status: 204 }));
        const { uploader, pending } = fakeUploader();
        const first = renderSheet(api, uploader);

        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        const box = within(sheet).getByRole('textbox', { name: "What's new?" });
        expect(document.activeElement).toBe(box);
        setRichText(box, 'Holiday photos');
        fireEvent.change(within(sheet).getByRole('combobox', { name: 'Who can see it' }), { target: { value: 'friends' } });

        const key = draftKey(SITE, '4', 'feed');
        await waitFor(async () => expect((await draftStore().get(key))?.text).toBe('Holiday photos'));
        first.unmount();

        // the app again: the draft is back, audience and all
        renderSheet(api, uploader);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const again = screen.getByRole('dialog', { name: 'New post' });
        await waitFor(() => expect(richText(within(again).getByRole('textbox', { name: "What's new?" }))).toBe('Holiday photos'));
        expect(within(again).getByRole('combobox', { name: 'Who can see it' })).toHaveProperty('value', 'friends');

        // a pasted photo goes up; Post waits for it
        const photo = new File([new Uint8Array([1, 2, 3])], 'beach.png', { type: 'image/png' });
        fireEvent.paste(within(again).getByRole('textbox', { name: "What's new?" }), { clipboardData: { files: [photo], getData: () => '' } });
        const tray = await within(again).findByRole('list', { name: '1 attachment' });
        expect(within(tray).getByRole('progressbar', { name: 'Uploading beach.png' })).toBeTruthy();
        expect(within(again).getByRole('button', { name: 'Post' })).toHaveProperty('disabled', true);
        await act(async () => pending.get('h-beach.png')?.resolve(media('77')));
        await waitFor(() => expect(within(again).getByRole('button', { name: 'Post' })).toHaveProperty('disabled', false));

        // Cmd+Enter posts the text, the audience and the upload
        fireEvent.keyDown(within(again).getByRole('textbox', { name: "What's new?" }), { key: 'Enter', metaKey: true });
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/feed-posts')).toBe(true));
        const post = calls.find((c) => c.method === 'POST' && c.path === '/feed-posts');
        expect(post?.body).toEqual({ audience: 'friends', body_html: '<p>Holiday photos</p>', media_ids: ['77'] });
        // the sheet closes, empty, and the draft is gone
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(richText(document.getElementById(NEW_POST_FIELD)!)).toBe('');
        await waitFor(async () => expect(await draftStore().get(key)).toBeUndefined());
    });

    it('attaches previews of the text’s links, as the site’s post form does', async () => {
        const calls: Call[] = [];
        const api = fakeApi(calls, (c) => (c.method === 'POST' && c.path === '/feed-posts' ? { status: 201, body: created('6') } : { status: 204 }));
        const { uploader } = fakeUploader();
        renderSheet(api, uploader);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        const box = within(sheet).getByRole('textbox', { name: "What's new?" });
        setRichText(box, 'Read example.com and https://una.io/blog, and example.com again');
        const note = within(sheet).getByText(/Previews of these links are added/);
        expect(note.textContent).toBe('Previews of these links are added: example.com, una.io');
        expect(box.getAttribute('aria-describedby')).toBe('compose-hint compose-links');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/feed-posts')).toBe(true));
        expect((calls.find((c) => c.path === '/feed-posts')?.body as { links?: string[] }).links).toEqual(['https://example.com', 'https://una.io/blog']);
    });

    it('stops an upload that is taken off, and moves focus on', async () => {
        const api = fakeApi([]);
        const { uploader, cancelled, pending } = fakeUploader();
        renderSheet(api, uploader);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        fireEvent.click(within(sheet).getByRole('button', { name: 'Add photos or videos' }));
        const remove = await within(sheet).findByRole('button', { name: 'Remove Photo picked.jpg' });
        // the row is drawn a moment before its upload starts; one that has not started has nothing to stop
        await waitFor(() => expect(pending.has('h-picked')).toBe(true));
        fireEvent.click(remove);
        expect(cancelled).toEqual(['h-picked']);
        expect(within(sheet).queryByRole('list')).toBeNull();
        expect(document.activeElement).toBe(within(sheet).getByRole('button', { name: 'Add photos or videos' }));
        expect(document.getElementById(NEW_POST_FIELD)).toBeTruthy();
    });

    it('shows the site refusing the post and keeps the text', async () => {
        const api = fakeApi([], (c) => (c.path === '/feed-posts' ? { status: 403, body: { type: 'about:blank', title: 'Forbidden', status: 403, code: 'forbidden', detail: 'You may not post' } } : { status: 204 }));
        const { uploader } = fakeUploader();
        renderSheet(api, uploader);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'Hi');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        expect((await within(sheet).findByRole('alert')).textContent).toBe('You may not post');
        expect(richText(within(sheet).getByRole('textbox', { name: "What's new?" }))).toBe('Hi');
    });

    it('stays open while the post is sent, so a refusal is seen there', async () => {
        let answer: (a: Answer) => void = () => {};
        const api = fakeApi([], (c) => (c.path === '/feed-posts' ? new Promise<Answer>((resolve) => (answer = resolve)) : { status: 204 }));
        const { uploader } = fakeUploader();
        renderSheet(api, uploader);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'Hi');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Post' }).getAttribute('aria-busy')).toBe('true'));

        // Close and Esc (the dialog's cancel) do nothing while it sends
        fireEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
        const esc = new Event('cancel', { cancelable: true });
        sheet.dispatchEvent(esc);
        expect(esc.defaultPrevented).toBe(true);
        expect(screen.getByRole('dialog', { name: 'New post' })).toBe(sheet);

        await act(async () => answer({ status: 422, body: { type: 'about:blank', title: 'Invalid', status: 422, code: 'invalid', detail: 'Too long' } }));
        expect((await within(sheet).findByRole('alert')).textContent).toBe('Too long');
        expect(screen.queryByText('Draft kept')).toBeNull();
    });
});

describe('the compose sheet and profiles', () => {
    function Harness({ profileId, api, uploader }: { profileId: string; api: UnaApi; uploader: Uploader }) {
        const ctx: AppContextValue = { api, siteUrl: SITE, me: { ...me, active_profile_id: profileId }, signOut: () => {}, signingOut: false, messageTo: () => {} };
        return (
            <QueryClientProvider client={new QueryClient()}>
                <AppContext.Provider value={ctx}>
                    <ComposeProvider uploader={uploader}>
                        <Opener />
                    </ComposeProvider>
                </AppContext.Provider>
            </QueryClientProvider>
        );
    }

    it('starts over for another profile, with that profile\'s own draft', async () => {
        const api = fakeApi([]);
        const { uploader, cancelled } = fakeUploader();
        const keyA = draftKey(SITE, '4', 'feed');
        const keyB = draftKey(SITE, '8', 'feed');
        await draftStore().set(keyB, { text: 'B plan', audience: 'members' });

        const view = render(<Harness profileId="4" api={api} uploader={uploader} />);
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'A secret');
        fireEvent.click(within(sheet).getByRole('button', { name: 'Add photos or videos' }));
        await within(sheet).findByRole('list', { name: '1 attachment' });
        await waitFor(async () => expect((await draftStore().get(keyA))?.text).toBe('A secret'));

        // switch to profile 8: the sheet closes, A's upload on its way stops
        view.rerender(<Harness profileId="8" api={api} uploader={uploader} />);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(cancelled).toEqual(['h-picked']);

        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const again = screen.getByRole('dialog', { name: 'New post' });
        await waitFor(() => expect(richText(within(again).getByRole('textbox', { name: "What's new?" }))).toBe('B plan'));
        expect(within(again).getByRole('combobox', { name: 'Who can see it' })).toHaveProperty('value', 'members');
        expect(within(again).queryByRole('list')).toBeNull();

        // after the save delay, each profile still has its own draft
        await new Promise((r) => setTimeout(r, 400));
        expect((await draftStore().get(keyB))?.text).toBe('B plan');
        expect((await draftStore().get(keyA))?.text).toBe('A secret');
    });
});

describe('a draft\'s uploads', () => {
    it('come back in the tray, without the ones the site deleted, and are posted', async () => {
        const calls: Call[] = [];
        const api = fakeApi(calls, (c) => {
            if (c.method === 'GET' && c.path === '/uploads/77') return { status: 200, body: media('77') };
            if (c.method === 'GET' && c.path === '/uploads/78') return { status: 404, body: { type: 'about:blank', title: 'Not found', status: 404, code: 'not_found' } };
            if (c.method === 'POST' && c.path === '/feed-posts') return { status: 201, body: created('6', [media('77')]) };
            return { status: 204 };
        });
        const { uploader } = fakeUploader();
        const now = Date.now();
        await draftStore().set(draftKey(SITE, '4', 'feed'), {
            text: '',
            media: [
                { media: media('77'), name: 'beach.png', uploadedAt: now },
                { media: media('78'), name: 'old.png', uploadedAt: now },
            ],
        });
        render(
            <ComposeProvider uploader={uploader}>
                <Opener />
            </ComposeProvider>,
            { wrapper: wrapper(api) },
        );
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        const tray = await within(sheet).findByRole('list', { name: '1 attachment' });
        expect(within(tray).getByText('beach.png')).toBeTruthy();
        await waitFor(() => expect(within(sheet).getByRole('status').textContent).toMatch(/old\.png is no longer on the site/));

        fireEvent.click(within(sheet).getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/feed-posts')).toBe(true));
        expect(calls.find((c) => c.method === 'POST' && c.path === '/feed-posts')?.body).toEqual({ audience: 'public', media_ids: ['77'] });
    });

    it('say when a video the site was converting is ready', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            let ready = false;
            const video = (state: Media['state']) => media('90', { kind: 'video', mime: 'video/mp4', state });
            const api = fakeApi([], (c) => (c.method === 'GET' && c.path === '/uploads/90' ? { status: 200, body: video(ready ? 'ready' : 'processing') } : { status: 204 }));
            const { uploader } = fakeUploader();
            const said: string[] = [];
            const { result } = renderHook(() => useAttachments({ uploader, api, announce: (t) => said.push(t) }), { wrapper: wrapper(api) });

            act(() => result.current.restore(fromDraft([{ media: video('processing'), name: 'clip.mov', uploadedAt: Date.now() }])));
            await act(async () => vi.advanceTimersByTimeAsync(POLL_FIRST_MS + 10));
            expect(result.current.items[0]?.media?.state).toBe('processing');
            expect(said).toEqual([]);

            ready = true;
            await act(async () => vi.advanceTimersByTimeAsync(POLL_FIRST_MS * 2 + 10));
            await waitFor(() => expect(result.current.items[0]?.media?.state).toBe('ready'));
            expect(said).toEqual(['clip.mov is ready']);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('the post editor and the keyboard', () => {
    function renderCard(post: Schema<'Activity'>) {
        return render(
            <RouterProvider history={new RouteHistory({ list: { section: 'home' }, detail: null })}>
                <ActivityCard activity={post} variant="detail" />
            </RouterProvider>,
            { wrapper: wrapper(fakeApi([]), new QueryClient()) },
        );
    }

    it('puts focus on who sees it when a formatted post has no text box', () => {
        const post = created('9');
        post.object.card.body_html = '<p>See</p><table><tr><td>this</td></tr></table>';
        renderCard(post);
        chooseEdit();
        expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Who can see it' }));
        expect(screen.getByRole('form', { name: 'Edit the post' }).getAttribute('aria-describedby')).toBeTruthy();
    });

    it('takes Esc on its buttons too: it asks before throwing changes away and never closes the pane', () => {
        const post = created('9');
        post.object.card.body_html = '<p>Hello</p>';
        renderCard(post);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const outside = vi.fn();
        window.addEventListener('keydown', outside);
        try {
            chooseEdit();
            const editor = screen.getByRole('form', { name: 'Edit the post' });
            setRichText(within(editor).getByRole('textbox', { name: 'Post text' }), 'Hello there');
            const save = within(editor).getByRole('button', { name: 'Save' });
            save.focus();
            fireEvent.keyDown(save, { key: 'Escape' });
            expect(confirm).toHaveBeenCalledOnce();
            expect(outside).not.toHaveBeenCalled();
            expect(screen.getByRole('form', { name: 'Edit the post' })).toBe(editor);
        } finally {
            window.removeEventListener('keydown', outside);
            confirm.mockRestore();
        }
    });

    it('says why the caption of a photo post can\'t be emptied here', () => {
        const post = created('9', [media('77')]);
        post.object.card.body_html = '<p>Caption</p>';
        renderCard(post);
        chooseEdit();
        const editor = screen.getByRole('form', { name: 'Edit the post' });
        setRichText(within(editor).getByRole('textbox', { name: 'Post text' }), '  ');
        expect(within(editor).getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
        expect(within(editor).getByText(/can.t be removed here/)).toBeTruthy();
    });
});

