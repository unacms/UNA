import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { feedRoute, parseRoute, type Route, RouteHistory, routeToPath, sectionRoute } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { type Picked, UploadError, type Uploader, videoUploader } from '../../lib/uploads';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from '../groups/group-view';
import { groupKey } from '../groups/groups';
import { navigationEntries } from '../palette/commands';
import { isVideoLink, NewVideo, titleFromName, uploadStatusText } from './new-video';
import { videoRowText } from './video-list';
import { durationText, mediaState, playable, playerUrl, textToHtml, thumbnail, type Video } from './videos';

vi.mock('../../lib/native', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../lib/native')>()), confirmAction: vi.fn(async () => true), openExternal: vi.fn(async () => {}) }));

type Media = Schema<'Media'>;
const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric Novak', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Top contributor', color: null, icon: null }] };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const MODULES: Schema<'ModuleInfo'>[] = [{ module: 'bx_videos', tag: 'videos', title: 'Videos', kind: 'video' }];

const allowAll = (url: string | null | undefined) => url ?? null;

function media(over: Partial<Media> = {}): Media {
    return {
        id: '287762808834',
        kind: 'video',
        mime: 'video/mp4',
        size: 1000,
        state: 'ready',
        original_name: 'clip.mp4',
        url: 'https://community.example/s/original.mp4',
        download_url: 'https://community.example/s/original.mp4',
        variants: {
            mp4: { url: 'https://community.example/s/copy.mp4', width: 640, height: 360 },
            poster: { url: 'https://community.example/s/poster.jpg', width: 0, height: 0 },
            thumb: { url: 'https://community.example/s/thumb.jpg', width: 0, height: 0 },
        },
        width: 640,
        height: 360,
        duration_ms: 42_000,
        ...over,
    };
}

function video(id: string, title: string, over: Partial<Video> = {}): Video {
    return {
        id,
        kind: 'video',
        module: 'bx_videos',
        title,
        excerpt: `About ${title}`,
        text_html: null,
        media: media(),
        embed_url: null,
        embed_player_url: null,
        album_id: null,
        author: eric,
        audience: 'public',
        context_id: null,
        state: 'published',
        moderation: 'approved',
        links: [],
        comments_enabled: true,
        featured: false,
        stats: { comments: 0, reactions: 2, views: 29 },
        content_id: null,
        url: `https://community.example/view-video/${id}`,
        viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false },
        published_at: '2026-11-04T16:35:32Z',
        created_at: '2026-11-04T16:35:32Z',
        updated_at: '2026-11-04T16:35:32Z',
        ...over,
    };
}

describe('what a video shows', () => {
    it('plays the MP4 copy with its still, never the upload, and nothing while it is converted', () => {
        expect(playable(video('1', 'Ready'), allowAll)).toEqual({ src: 'https://community.example/s/copy.mp4', poster: 'https://community.example/s/poster.jpg' });
        expect(playable(video('2', 'Converting', { state: 'processing', media: media({ state: 'processing', variants: {} }) }), allowAll)).toBeNull();
        // no copy: no player (the original is the owner's and not one to play here)
        expect(playable(video('3', 'No copy', { media: media({ variants: {} }) }), allowAll)).toBeNull();
        // a copy the page may not load is no source
        expect(playable(video('4', 'Blocked'), (u) => (u?.endsWith('.mp4') ? null : (u ?? null)))).toBeNull();
        expect(playable(video('5', 'A link', { media: null, embed_url: 'https://www.youtube.com/watch?v=x' }), allowAll)).toBeNull();
    });

    it('says when it is converting or failed, its length, and its still for a row', () => {
        expect(mediaState(video('1', 'Ready'))).toBeNull();
        expect(mediaState(video('2', 'Converting', { state: 'processing', media: media({ state: 'processing', variants: {} }) }))).toBe('processing');
        expect(mediaState(video('3', 'Failed', { state: 'hidden', media: media({ state: 'failed', variants: {} }) }))).toBe('failed');
        expect(mediaState(video('4', 'Link', { media: null, embed_url: 'https://vimeo.com/1' }))).toBeNull();
        expect([durationText(42_000), durationText(725_000), durationText(3_729_000), durationText(null), durationText(400)]).toEqual(['0:42', '12:05', '1:02:09', null, null]);
        expect(thumbnail(video('1', 'Ready'), allowAll)).toBe('https://community.example/s/thumb.jpg');
        expect(thumbnail(video('5', 'Link', { media: null, links: [{ id: '5', url: 'https://youtu.be/x', host: 'youtu.be', state: 'ready', title: 'x', description: '', site_name: 'youtu.be', image: { path: 'https://community.example/s/still.jpg', width: 0, height: 0 } }] }), allowAll)).toBe(
            'https://community.example/s/still.jpg',
        );
        expect(videoRowText(video('1', 'Ready'))).toMatch(/^, 0:42, by Eric Novak, Top contributor, .+, 29 views$/);
        expect(videoRowText(video('2', 'Converting', { state: 'processing', media: media({ state: 'processing', variants: {}, duration_ms: null }) }))).toMatch(/^, processing, by Eric Novak, /);
    });

    it('takes a player from another site over https only, and sends text as escaped paragraphs', () => {
        expect(playerUrl({ embed_player_url: 'https://www.youtube.com/embed/x' })).toBe('https://www.youtube.com/embed/x');
        expect(playerUrl({ embed_player_url: 'http://example.com/embed' })).toBeNull();
        expect(playerUrl({ embed_player_url: 'javascript:alert(1)' })).toBeNull();
        expect(textToHtml('First <line>\n\n  & second  ')).toBe('<p>First &lt;line&gt;</p><p>&amp; second</p>');
        expect(titleFromName('Harbour at dawn.mp4')).toBe('Harbour at dawn');
        expect([isVideoLink('https://vimeo.com/1'), isVideoLink('ftp://x'), isVideoLink('not a link')]).toEqual([true, false, false]);
    });
});

describe('video routes', () => {
    it('opens a video beside the Media list, in a window of its own too, and adding one in place', () => {
        const route: Route = { list: { section: 'media' }, detail: { kind: 'video', id: '31' } };
        expect(routeToPath(route)).toBe('/media/video/31');
        expect(parseRoute('/media/video/31')).toEqual(route);
        expect(parseRoute('/groups/new-video/67?group=67')).toEqual({ list: { section: 'groups', group: '67' }, detail: { kind: 'new-video', contextId: '67' } });
        expect(parseRoute('/media/new-video')).toEqual({ list: { section: 'media' }, detail: { kind: 'new-video' } });
        expect(parseRoute('/media/video/x')).toBeNull();
        expect(parseRoute('/media/video/31/comments')).toBeNull();
        // the one tab is the default, never written out
        expect(routeToPath({ list: feedRoute('media', 'videos'), detail: null })).toBe('/media');
        expect(opensInWindow({ kind: 'video', id: '31' })).toBe(true);
        expect(opensInWindow({ kind: 'new-video' })).toBe(false);
    });

    it('gives a context a Videos tab where the site lets videos into it, and the palette Media where it has Videos', () => {
        expect(contextTabs({ content_visible: true, content_kinds: ['videos', 'discussions'] }, 'group')).toEqual(['posts', 'videos', 'discussions', 'members', 'about']);
        expect(contextTabs({ content_visible: true, content_kinds: [] }, 'space')).toEqual(['posts', 'spaces', 'members', 'about']);
        expect(navigationEntries(() => undefined).some((e) => e.label === 'Media: Videos')).toBe(false);
        expect(navigationEntries(() => undefined, { videos: true }).find((e) => e.label === 'Media: Videos')?.action).toEqual({ kind: 'list', list: { section: 'media' } });
    });
});

type Call = { method: string; path: string; query: string; body: string };

function site(opts: { videos?: boolean } = {}) {
    const all: Record<string, Video> = {
        '1': video('1', 'Test roll: night tram', { content_id: '5614', viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true } }),
        '2': video('2', 'Lantern test', { state: 'processing', media: media({ state: 'processing', variants: {}, duration_ms: null }) }),
        '21': video('21', 'How a hand plane works', {
            media: null,
            embed_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
            embed_player_url: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
            links: [{ id: '21', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', host: 'www.youtube.com', state: 'ready', title: 'How a hand plane works', description: '', site_name: 'www.youtube.com', image: null }],
        }),
    };
    const calls: Call[] = [];
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules: opts.videos === false ? [] : MODULES } };
        if (c.path === '/videos' && c.method === 'POST') return { status: 201, body: all['1'] };
        if (c.path === '/videos' && c.method === 'GET') return { status: 200, body: { items: [all['1'], all['2'], all['21']], next_cursor: null } };
        const m = /^\/videos\/(\d+)$/.exec(c.path);
        if (m?.[1] && all[m[1]]) {
            if (c.method === 'DELETE') return { status: 204 };
            return { status: 200, body: { ...all[m[1]], text_html: `<p>About ${all[m[1]]!.title}</p>` } };
        }
        if (c.path === '/activities/5614')
            return {
                status: 200,
                body: {
                    id: '5614',
                    verb: 'posted',
                    actor: eric,
                    owner_id: '6',
                    object: { id: '5614', kind: 'video', module: 'bx_videos', author: eric, anonymous: false, audience: 'public', context_id: null, card: null, media: [], links: [], stats: { comments: 0, reactions: 2, reposts: 0, views: 0 }, viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false }, created_at: '2026-11-04T16:35:32Z' },
                    created_at: '2026-11-04T16:35:32Z',
                },
            };
        if (c.path === '/content/5614/comments') return { status: 200, body: { items: [], next_cursor: null } };
        if (c.path === '/me/groups' || c.path === '/me/spaces') return { status: 200, body: [] };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text() };
            calls.push(c);
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls };
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'media', label: 'Media', icon: 'film' },
];

function Harness({ history, api, children }: { history: RouteHistory; api: UnaApi; children?: ReactNode }) {
    const commands = useRef<CommandHandler | null>(null);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>{children ?? <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />}</RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, children?: ReactNode, seed?: (client: QueryClient) => void) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    seed?.(client);
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={api}>
                {children}
            </Harness>
        </QueryClientProvider>,
    );
    return { history, client };
}

const sizes: [keyof HTMLElement, PropertyDescriptor | undefined][] = [];
beforeAll(() => {
    for (const prop of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
        sizes.push([prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop)]);
        Object.defineProperty(HTMLElement.prototype, prop, {
            configurable: true,
            get(this: HTMLElement) {
                if (this.classList.contains('pane-body')) return prop === 'clientWidth' ? 1200 : 800;
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
    localStorage.clear();
    setSiteModules(null);
});

describe('videos in the window', () => {
    it('lists the network’s videos under Media, with badges after names, and opens one beside the list with its player', async () => {
        const { api } = site();
        const { history } = renderApp(sectionRoute('media'), api);
        const list = await screen.findByRole('list', { name: 'Videos, newest first' });
        // the site has Videos alone among the media modules: no tabs of one
        expect(screen.queryByRole('tab', { name: 'Videos' })).toBeNull();
        const row = within(list).getByRole('button', { name: /^Test roll: night tram, 0:42, by Eric Novak/ });
        expect(within(row.closest('li')!).getByText('Top contributor')).toBeTruthy();
        expect(within(list).getByRole('button', { name: /^Lantern test, processing, / })).toBeTruthy();

        fireEvent.click(row);
        expect(routeToPath(history.current)).toBe('/media/video/1');
        const player = await waitFor(() => {
            const v = document.querySelector<HTMLVideoElement>('.video-player video');
            if (!v) throw new Error('no player');
            return v;
        });
        expect(player.getAttribute('src')).toBe('https://community.example/s/copy.mp4');
        expect(player.getAttribute('poster')).toBe('https://community.example/s/poster.jpg');
        expect(await screen.findByText('About Test roll: night tram')).toBeTruthy();
        expect(row.getAttribute('aria-current')).toBe('true');
        // its comments are its Item's
        expect(await screen.findByRole('button', { name: 'Comment' })).toBeTruthy();
    });

    it('says a video is being converted instead of a player, and plays a video from elsewhere in the browser', async () => {
        const native = await import('../../lib/native');
        const { api } = site();
        renderApp({ list: { section: 'media' }, detail: { kind: 'video', id: '2' } }, api);
        expect(await screen.findByText(/^Processing video… It plays here once/)).toBeTruthy();
        expect(document.querySelector('.video-player video')).toBeNull();
        cleanup();

        renderApp({ list: { section: 'media' }, detail: { kind: 'video', id: '21' } }, api);
        const play = await screen.findByRole('button', { name: 'Play “How a hand plane works” on www.youtube.com (opens in your browser)' });
        // no other site's player inside the app
        expect(document.querySelector('iframe')).toBeNull();
        fireEvent.click(play);
        expect(native.openExternal).toHaveBeenCalledWith('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
        // a browser that does not open is said
        vi.mocked(native.openExternal).mockRejectedValueOnce('No browser');
        fireEvent.click(play);
        expect(await screen.findByText('Could not open your browser: No browser')).toBeTruthy();
    });

    it('opens a video row in a window of its own on a double-click', async () => {
        const opened = vi.spyOn(window, 'open').mockReturnValue(null);
        const { api } = site();
        renderApp(sectionRoute('media'), api);
        const list = await screen.findByRole('list', { name: 'Videos, newest first' });
        fireEvent.doubleClick(within(list).getByRole('button', { name: /^Test roll: night tram, / }).closest('li')!.querySelector('.row-sub')!);
        expect(opened).toHaveBeenCalledTimes(1);
        expect(opened.mock.calls[0]?.[0]).toContain(encodeURIComponent('/media/video/1'));
        opened.mockRestore();
    });

    it('says the site has no videos when its module list has none', async () => {
        const { api } = site({ videos: false });
        renderApp(sectionRoute('media'), api);
        expect(await screen.findByText('This network has no videos, photos or files.')).toBeTruthy();
    });
});

/** Uploads that finish when the test says so. */
function fakeUploader() {
    const pending = new Map<string, { resolve: (m: Media) => void; reject: (e: unknown) => void; progress: (s: number, t: number) => void; purpose?: string }>();
    const base: Uploader = {
        pick: async () => ({ files: [{ handle: 'h-clip', name: 'Harbour at dawn.mp4', size: 2_000_000, mime: 'video/mp4', kind: 'video' }], refused: [] }),
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths: async () => ({ files: [], refused: [] }),
        upload: (file: Picked, progress, purpose) =>
            new Promise<Media>((resolve, reject) => {
                pending.set(file.handle ?? file.name, { resolve, reject, progress, purpose });
            }),
        cancel: (file) => pending.get(file.handle ?? '')?.reject(new UploadError('stopped', 0, 'cancelled')),
        release: () => undefined,
    };
    return { base, pending };
}

describe('adding a video', () => {
    it('uploads a picked video with the video purpose, shows its progress and the site converting it, and adds it', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader();
        const { history } = renderApp({ list: { section: 'media' }, detail: { kind: 'new-video' } }, api, <NewVideo uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose a video…' }));
        await waitFor(() => expect(pending.get('h-clip')).toBeTruthy());
        expect(pending.get('h-clip')?.purpose).toBe('video');
        act(() => pending.get('h-clip')?.progress(1_000_000, 2_000_000));
        expect(await screen.findByText('Uploading… 50%')).toBeTruthy();
        // the title is the file's name
        expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Harbour at dawn');
        await act(async () => pending.get('h-clip')?.resolve(media({ id: '99', state: 'processing', variants: {} })));
        expect(await screen.findByText(/^Uploaded\. The network is converting it/)).toBeTruthy();

        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Boats <coming> in' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add video' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/videos')).toBe(true));
        const post = calls.find((c) => c.method === 'POST' && c.path === '/videos')!;
        expect(JSON.parse(post.body)).toEqual({ media_id: '99', title: 'Harbour at dawn', text_html: '<p>Boats &lt;coming&gt; in</p>', audience: 'public' });
        // added: the form becomes the video
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'video', id: '1' }));
    });

    it('sends the same file again on Try again, its staged copy kept for it', async () => {
        const { api } = site();
        const { base, pending } = fakeUploader();
        // as the app's uploader: a released file can no longer be sent
        const released = new Set<string>();
        const uploader: Uploader = {
            ...base,
            upload: (file, progress, purpose) => (released.has(file.handle ?? '') ? Promise.reject(new UploadError('This file is no longer there to send', 0, 'not_staged')) : base.upload(file, progress, purpose)),
            release: (file) => void released.add(file.handle ?? ''),
        };
        renderApp({ list: { section: 'media' }, detail: { kind: 'new-video' } }, api, <NewVideo uploader={uploader} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose a video…' }));
        await waitFor(() => expect(pending.get('h-clip')).toBeTruthy());
        const first = pending.get('h-clip')!;
        await act(async () => first.reject(new UploadError('The connection was lost', 0, 'network')));
        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(pending.get('h-clip')).not.toBe(first));
        expect(released.has('h-clip')).toBe(false);
        await act(async () => pending.get('h-clip')?.resolve(media({ id: '99' })));
        expect(await screen.findByText('Uploaded and ready.')).toBeTruthy();
    });

    it('deletes an upload left behind when a link is added instead', async () => {
        const { api, calls } = site();
        const { base, pending } = fakeUploader();
        const released: string[] = [];
        const uploader: Uploader = { ...base, release: (f) => void released.push(f.handle ?? '') };
        renderApp({ list: { section: 'media' }, detail: { kind: 'new-video' } }, api, <NewVideo uploader={uploader} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose a video…' }));
        await waitFor(() => expect(pending.get('h-clip')).toBeTruthy());
        await act(async () => pending.get('h-clip')?.resolve(media({ id: '99', state: 'processing', variants: {} })));
        fireEvent.click(screen.getByLabelText(/Link to a video on another site/));
        fireEvent.change(screen.getByLabelText('Address of the video'), { target: { value: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' } });
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A plane' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add video' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/uploads/99')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/videos')!.body)).toMatchObject({ embed_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', title: 'A plane' });
        expect(released).toEqual(['h-clip']);
    });

    it('names the event it adds a video to, and who will see it', async () => {
        setSiteModules([...MODULES, { module: 'bx_events', tag: 'events', title: 'Events', kind: 'event' }]);
        const { api, calls } = site();
        const { base } = fakeUploader();
        renderApp({ list: { section: 'media' }, detail: { kind: 'new-video', contextId: '67' } }, api, <NewVideo uploader={base} contextId="67" />, (client) =>
            client.setQueryData(groupKey('67'), { id: '67', kind: 'group', module: 'bx_events', display_name: 'Night market', about: '', status: 'active', created_at: '2026-01-01T00:00:00Z' }),
        );
        expect(await screen.findByRole('heading', { name: 'Add video to Night market' })).toBeTruthy();
        expect(screen.getByText(/^Who can see it: whoever can see what is in Night market, as for everything in this event\.$/)).toBeTruthy();
        expect(screen.queryByLabelText('Who can see it')).toBeNull();
        expect(calls.some((c) => c.path.startsWith('/me/'))).toBe(false);
    });

    it('needs a file or a link before it adds anything, and says why', async () => {
        const { api, calls } = site();
        const { base } = fakeUploader();
        renderApp({ list: { section: 'media' }, detail: { kind: 'new-video' } }, api, <NewVideo uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Add video' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Choose a video to upload.');
        fireEvent.click(screen.getByLabelText(/Link to a video on another site/));
        fireEvent.change(screen.getByLabelText('Address of the video'), { target: { value: 'not a link' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add video' }));
        expect((await screen.findByRole('alert')).textContent).toMatch(/^Paste the address of the video/);
        expect(screen.getByLabelText('Address of the video').getAttribute('aria-invalid')).toBe('true');
        expect(calls.some((c) => c.method === 'POST')).toBe(false);
    });

    it('says what an upload says while it goes', () => {
        const picked: Picked = { handle: 'h', name: 'a.mp4', size: 10, mime: 'video/mp4', kind: 'video' };
        expect(uploadStatusText({ status: 'uploading', picked, sent: 0, total: 0 })).toBe('Uploading…');
        expect(uploadStatusText({ status: 'done', picked, media: media() })).toBe('Uploaded and ready.');
        expect(uploadStatusText({ status: 'done', picked, media: media({ state: 'failed' }) })).toMatch(/could not convert/);
        expect(uploadStatusText({ status: 'failed', picked, error: 'Too big' })).toBe('Not uploaded: Too big');
    });

    it('lets only videos through the video uploader, with its purpose', async () => {
        const released: string[] = [];
        const calls: (string | undefined)[] = [];
        const base: Uploader = {
            pick: async (o) => {
                calls.push(o?.videosOnly ? 'videos-only' : 'all');
                return { files: [{ handle: 'p', name: 'p.jpg', size: 1, mime: 'image/jpeg', kind: 'image' }, { handle: 'v', name: 'v.mp4', size: 1, mime: 'video/mp4', kind: 'video' }], refused: [] };
            },
            fromFiles: async () => ({ files: [], refused: [] }),
            fromPaths: async () => ({ files: [], refused: [] }),
            upload: async (_f, _p, purpose) => {
                calls.push(purpose);
                return media();
            },
            cancel: () => undefined,
            release: (f) => released.push(f.handle ?? ''),
        };
        const up = videoUploader(base);
        const staging = await up.pick();
        expect(staging.files.map((f) => f.name)).toEqual(['v.mp4']);
        expect(staging.refused).toEqual(['p.jpg']);
        expect(released).toEqual(['p']);
        await up.upload(staging.files[0]!, () => undefined);
        expect(calls).toEqual(['videos-only', 'video']);
    });
});
