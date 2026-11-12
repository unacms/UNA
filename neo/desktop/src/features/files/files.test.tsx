import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import { saveDownload } from '../../lib/native';
import { RouterProvider } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { feedRoute, parseRoute, type Route, RouteHistory, routeToPath } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { fileUploader, type Picked, type Uploader } from '../../lib/uploads';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { contextTabs } from '../groups/group-view';
import { mediaTabs } from '../media/media-browse';
import { navigationEntries } from '../palette/commands';
import { downloadName, extensionOf, type FileEntry, filePreview, fileRowText, fileSizeText, filesAddedText, fileType, rowThumb } from './files';
import { NewFiles } from './new-files';

vi.mock('../../lib/native', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../lib/native')>()),
    confirmAction: vi.fn(async () => true),
    saveDownload: vi.fn(async (_url: string, name: string) => ({ saved: true, name })),
}));

type Media = Schema<'Media'>;
const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const eric: Schema<'Profile'> = { id: '6', kind: 'person', module: 'bx_persons', display_name: 'Eric Novak', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Top contributor', color: null, icon: null }] };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const MODULES: Schema<'ModuleInfo'>[] = [
    { module: 'bx_photos', tag: 'photos', title: 'Photos', kind: 'photo' },
    { module: 'bx_files', tag: 'files', title: 'Files', kind: 'file' },
];
const allowAll = (url: string | null | undefined) => url ?? null;
const S = 'https://community.example/s/bx_files_files';

function media(id: string, over: Partial<Media> = {}): Media {
    return {
        id,
        kind: 'file',
        mime: 'application/pdf',
        size: 13264,
        state: 'ready',
        original_name: 'agenda.pdf',
        url: `${S}/${id}.pdf?t=abc`,
        download_url: `${S}/${id}.pdf?t=abc`,
        variants: {},
        width: null,
        height: null,
        duration_ms: null,
        ...over,
    };
}

function file(id: string, title: string, over: Partial<FileEntry> = {}): FileEntry {
    return {
        id,
        kind: 'file',
        module: 'bx_files',
        title,
        excerpt: '',
        text_html: null,
        media: media(`m${id}`),
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
        stats: { comments: 0, reactions: 0, views: 7 },
        content_id: null,
        url: `https://community.example/view-file/${id}`,
        viewer: { reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: true, can_delete: true },
        published_at: '2026-11-04T16:35:32Z',
        created_at: '2026-11-04T16:35:32Z',
        updated_at: '2026-11-04T16:35:32Z',
        ...over,
    };
}

const image = media('img', { kind: 'image', mime: 'image/jpeg', original_name: 'ridge.jpg', url: `${S}/img.jpg?t=1`, download_url: `${S}/img.jpg?t=1`, variants: { thumb: { url: 'https://community.example/thumb.jpg', width: 300, height: 200 }, medium: { url: 'https://community.example/medium.jpg', width: 500, height: 0 } } });

describe('what files show', () => {
    it('names a file’s type by its kind or extension, and its size in words', () => {
        expect(fileType(file('1', 'Agenda'))).toEqual({ icon: 'file-text', label: 'PDF document' });
        expect(fileType(file('1', 'Cuts', { media: media('c', { original_name: 'cuts.CSV' }) })).label).toBe('CSV table');
        expect(fileType(file('1', 'Map', { media: image }))).toEqual({ icon: 'file-image', label: 'JPG image' });
        expect(fileType(file('1', 'Clip', { media: media('v', { kind: 'video', original_name: 'clip.mp4' }) })).icon).toBe('file-play');
        expect(fileType(file('1', 'Song', { media: media('a', { kind: 'audio', original_name: 'song.mp3' }) })).label).toBe('Audio');
        expect(fileType(file('1', 'Archive', { media: media('z', { original_name: 'zines.zip' }) })).icon).toBe('file-archive');
        expect(fileType(file('1', 'notes', { media: media('n', { original_name: 'notes.xyz' }) })).label).toBe('XYZ file');
        expect(fileType(file('1', 'notes', { media: media('n', { original_name: '' }) })).label).toBe('File');
        expect([fileSizeText(0), fileSizeText(1), fileSizeText(512), fileSizeText(13264), fileSizeText(4.2 * 1024 * 1024)]).toEqual([null, '1 byte', '512 bytes', '13 KB', '4.2 MB']);
        expect([extensionOf('a.tar.GZ'), extensionOf('noext'), extensionOf('dir.d/file')]).toEqual(['gz', '', '']);
    });

    it('saves a download under the uploaded name, else the title with the stored file’s extension', () => {
        expect(downloadName(file('1', 'Agenda'))).toBe('agenda.pdf');
        expect(downloadName(file('1', 'Agenda', { media: media('m', { original_name: '' }) }))).toBe('Agenda.pdf');
        expect(downloadName(file('1', 'Plan.pdf', { media: media('m', { original_name: '' }) }))).toBe('Plan.pdf');
    });

    it('previews an image by its copy, a video once converted, audio from the file, and nothing for a document', () => {
        expect(filePreview(image, allowAll)).toEqual({ kind: 'image', src: 'https://community.example/medium.jpg' });
        expect(filePreview(media('d'), allowAll)).toBeNull();
        expect(filePreview(media('v', { kind: 'video' }), allowAll)).toBeNull();
        expect(filePreview(media('v', { kind: 'video', variants: { mp4: { url: 'https://community.example/v.mp4', width: 0, height: 0 } } }), allowAll)).toEqual({ kind: 'video', src: 'https://community.example/v.mp4', poster: undefined });
        expect(filePreview(media('a', { kind: 'audio' }), allowAll)).toEqual({ kind: 'audio', src: `${S}/a.pdf?t=abc` });
        // a row shows an image's small copy, never a document's address as a picture
        expect([rowThumb(image, allowAll), rowThumb(media('d'), allowAll)]).toEqual(['https://community.example/thumb.jpg', null]);
        expect(fileRowText(file('1', 'Agenda'))).toMatch(/^, PDF document, 13 KB, by Eric Novak, Top contributor, ./);
        expect([filesAddedText(2, 3), filesAddedText(1, 2), filesAddedText(0, 1)]).toEqual(['2 of 3 files were added.', '1 of 2 files was added.', 'No files were added.']);
    });
});

describe('file routes', () => {
    it('opens a file beside Media and in a window of its own, the form in place, and Files tabs on contexts and profiles', () => {
        const route: Route = { list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '12' } };
        expect(routeToPath(route)).toBe('/media/file/12?feed=files');
        expect(parseRoute('/media/file/12?feed=files')).toEqual(route);
        expect(parseRoute('/media/new-files')).toEqual({ list: { section: 'media' }, detail: { kind: 'new-files' } });
        expect(parseRoute('/spaces/new-files/725?space=725')).toEqual({ list: { section: 'spaces', group: '725' }, detail: { kind: 'new-files', contextId: '725' } });
        expect(parseRoute('/media/file/x')).toBeNull();
        expect(parseRoute('/media/file/12/download')).toBeNull();
        expect(parseRoute('/groups?group=67&tab=files')).toEqual({ list: { section: 'groups', group: '67', groupTab: 'files' }, detail: null });
        expect(parseRoute('/profile?id=8&tab=files')).toEqual({ list: { section: 'profile', profile: '8', profileTab: 'files' }, detail: null });
        expect(routeToPath({ list: feedRoute('media', 'files'), detail: null })).toBe('/media?feed=files');
        expect([opensInWindow({ kind: 'file', id: '12' }), opensInWindow({ kind: 'new-files' })]).toEqual([true, false]);
    });

    it('gives contexts a Files tab where the site lets files in, Media the tab where the site has Files, and the palette its place', () => {
        expect(contextTabs({ content_visible: true, content_kinds: ['files', 'photos'] }, 'space')).toEqual(['posts', 'spaces', 'photos', 'files', 'members', 'about']);
        expect(contextTabs({ content_visible: true, content_kinds: ['photos'] }, 'group')).not.toContain('files');
        expect(mediaTabs(['files'])).toEqual(['files']);
        expect(mediaTabs(['photos', 'files'])).toEqual(['photos', 'files']);
        // alone, Files is Media's first tab
        expect(navigationEntries(() => undefined, { files: true }).find((e) => e.label === 'Media: Files')?.action).toEqual({ kind: 'list', list: { section: 'media' } });
        expect(navigationEntries(() => undefined, { photos: true, files: true }).find((e) => e.label === 'Media: Files')?.action).toEqual({ kind: 'list', list: { section: 'media', feed: 'files' } });
        expect(navigationEntries(() => undefined).some((e) => e.label === 'Media: Files')).toBe(false);
    });
});

type Call = { method: string; path: string; query: string; body: string; key: string | null };

function site(modules: Schema<'ModuleInfo'>[] = MODULES) {
    const files: FileEntry[] = [file('1', 'Agenda'), file('2', 'Ridge route map', { media: image, author: lily }), file('3', 'Zine archive', { media: media('z', { original_name: 'zine-archive.zip', mime: 'application/zip', size: 2048 }) })];
    // opened by id only, not in the list
    const others: FileEntry[] = [
        file('4', 'Field recording', { media: media('a', { kind: 'audio', mime: 'audio/mpeg', original_name: 'field.mp3' }) }),
        file('5', 'Workshop clip', { media: media('v', { kind: 'video', mime: 'video/mp4', original_name: 'clip.mp4', state: 'processing' }) }),
        file('6', 'Old clip', { media: media('w', { kind: 'video', mime: 'video/quicktime', original_name: 'old.mov' }) }),
    ];
    const calls: Call[] = [];
    // requests whose answer is lost on the way: method and path
    const lose: string[] = [];
    let fresh = 0;
    const answer = (c: Call): { status: number; body?: unknown } | null => {
        if (c.path === '/') return { status: 200, body: { name: 'Makers', api_version: '2', modules } };
        if (c.path === '/files' && c.method === 'GET') return { status: 200, body: { items: files, next_cursor: null } };
        if (c.path === '/files' && c.method === 'POST') return { status: 201, body: [files[0], files[2]] };
        const m = /^\/files\/(\d+)$/.exec(c.path);
        if (m?.[1] && c.method === 'GET') {
            const found = [...files, ...others].find((x) => x.id === m[1]);
            if (!found) return { status: 404, body: { type: 'urn:una:problem:not_found', title: 'Not found', status: 404, code: 'not_found' } };
            // each answer a newer token, as the site's links have
            fresh++;
            const link = `${S}/m${found.id}.pdf?t=fresh${fresh}`;
            return { status: 200, body: { ...found, text_html: `<p>About ${found.title}</p>`, media: found.media ? { ...found.media, url: link, download_url: link } : null } };
        }
        if (m?.[1] && c.method === 'DELETE') return { status: 204 };
        if (c.path === '/me/groups' || c.path === '/me/spaces') return { status: 200, body: [] };
        return null;
    };
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text(), key: request.headers.get('Idempotency-Key') };
            calls.push(c);
            const lost = lose.indexOf(`${c.method} ${c.path}`);
            if (lost >= 0) {
                lose.splice(lost, 1);
                throw new TypeError('Load failed');
            }
            const a = answer(c);
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls, lose: (request: string) => void lose.push(request) };
}

const nav: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home' },
    { section: 'media', label: 'Media', icon: 'film' },
];

function Harness({ history, api, children }: { history: RouteHistory; api: UnaApi; children?: ReactNode }) {
    const commands = useRef<CommandHandler | null>(null);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>{children ?? <Shell siteUrl="https://community.example" items={nav} profile={lily} commands={commands} />}</RouterProvider>
        </AppContext.Provider>
    );
}

function renderApp(route: Route, api: UnaApi, children?: ReactNode) {
    const history = new RouteHistory(route);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
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
    vi.mocked(saveDownload).mockClear();
});

describe('files in the window', () => {
    it('lists the files under Media’s Files tab as rows by type, and opens one beside them with Download', async () => {
        const { api, calls } = site();
        const { history } = renderApp({ list: { section: 'media', feed: 'files' }, detail: null }, api);
        const list = await screen.findByRole('list', { name: 'Files, newest first' });
        expect(screen.getByRole('tab', { name: 'Files' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByRole('button', { name: 'Add files' })).toBeTruthy();
        const rows = within(list).getAllByRole('listitem');
        expect(rows).toHaveLength(3);
        const title = within(rows[0]!).getByRole('button', { name: /^Agenda, PDF document, 13 KB, by Eric Novak, Top contributor, / });
        // badges come after the name; an image's row shows its small copy, a document's its icon
        expect(within(rows[0]!).getByText('Top contributor')).toBeTruthy();
        expect(rows[0]!.querySelector('img')).toBeNull();
        expect(rows[1]!.querySelector('img')?.getAttribute('src')).toBe('https://community.example/thumb.jpg');
        expect(within(rows[2]!).getByText('Archive')).toBeTruthy();
        expect(within(rows[2]!).getByText('2 KB')).toBeTruthy();

        fireEvent.click(title);
        expect(routeToPath(history.current)).toBe('/media/file/1?feed=files');
        expect(await screen.findByText('About Agenda')).toBeTruthy();
        expect(title.getAttribute('aria-current')).toBe('true');
        expect(screen.getByText('No preview: download it to open it.')).toBeTruthy();

        // Download asks for a fresh link, then saves it under the uploaded name
        const before = calls.filter((c) => c.method === 'GET' && c.path === '/files/1').length;
        fireEvent.click(screen.getAllByRole('button', { name: 'Download' }).find((b) => b.classList.contains('btn-primary'))!);
        await waitFor(() => expect(saveDownload).toHaveBeenCalledTimes(1));
        expect(calls.filter((c) => c.method === 'GET' && c.path === '/files/1').length).toBe(before + 1);
        const [url, name] = vi.mocked(saveDownload).mock.calls[0]!;
        expect(name).toBe('agenda.pdf');
        expect(url).toMatch(/\?t=fresh\d+$/);
        expect(url).not.toBe(`${S}/m1.pdf?t=abc`);
        expect(await screen.findByText('Saved agenda.pdf')).toBeTruthy();
    });

    it('previews an image file with its copy, never the upload', async () => {
        const { api } = site();
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '2' } }, api);
        const img = await screen.findByRole('img', { name: 'Preview of Ridge route map' });
        expect(img.getAttribute('src')).toBe('https://community.example/medium.jpg');
    });

    it('says what went wrong with a download, and when a file is gone', async () => {
        const { api } = site();
        vi.mocked(saveDownload).mockRejectedValueOnce(new Error('The download stalled'));
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '3' } }, api);
        await screen.findByText('About Zine archive');
        fireEvent.click(screen.getAllByRole('button', { name: 'Download' }).find((b) => b.classList.contains('btn-primary'))!);
        expect((await screen.findByRole('alert')).textContent).toBe('Could not download it: The download stalled');
        cleanup();
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '77' } }, site().api);
        expect(await screen.findByText('This file is gone')).toBeTruthy();
    });

    it('keeps Download busy in the toolbar while it runs, and says so when pressed again', async () => {
        const { api } = site();
        let finish: (v: { saved: boolean; name: string }) => void = () => undefined;
        vi.mocked(saveDownload).mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '1' } }, api);
        await screen.findByText('About Agenda');
        const toolbar = screen.getAllByRole('button', { name: 'Download' }).find((b) => b.classList.contains('tb-btn'))!;
        fireEvent.click(toolbar);
        await waitFor(() => expect(saveDownload).toHaveBeenCalledTimes(1));
        expect(toolbar.getAttribute('aria-label')).toBe('Downloading, 0%');
        expect(toolbar.getAttribute('aria-disabled')).toBe('true');
        // the in-body button again: nothing new starts, and it says why
        fireEvent.click(screen.getAllByRole('button', { name: /^Downloading/ }).find((b) => b.classList.contains('btn-primary'))!);
        expect(await screen.findByText('Downloading, 0%', { selector: '[role="status"] span' })).toBeTruthy();
        expect(saveDownload).toHaveBeenCalledTimes(1);
        await act(async () => finish({ saved: true, name: 'agenda.pdf' }));
        expect(toolbar.getAttribute('aria-label')).toBe('Download');
        expect(toolbar.getAttribute('aria-disabled')).toBeNull();
    });

    it('asks for a fresh link when the audio player finds its link expired, and plays that one', async () => {
        const { api, calls } = site();
        const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async () => undefined);
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '4' } }, api);
        await screen.findByText('About Field recording');
        const audio = document.querySelector('audio')!;
        const first = audio.getAttribute('src');
        const gets = () => calls.filter((c) => c.method === 'GET' && c.path === '/files/4').length;
        const before = gets();
        fireEvent.error(audio);
        await waitFor(() => expect(document.querySelector('audio')!.getAttribute('src')).not.toBe(first));
        expect(gets()).toBe(before + 1);
        await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
        // once per link: a fresh link that fails too is not asked for again and again
        fireEvent.error(document.querySelector('audio')!);
        fireEvent.error(document.querySelector('audio')!);
        await waitFor(() => expect(gets()).toBe(before + 2));
        play.mockRestore();
    });

    it('promises a video’s player only while the network converts it', async () => {
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '5' } }, site().api);
        expect(await screen.findByText('It plays here once the network has converted it.')).toBeTruthy();
        cleanup();
        renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'file', id: '6' } }, site().api);
        expect(await screen.findByText('No preview: download it to open it.')).toBeTruthy();
        expect(screen.queryByText('It plays here once the network has converted it.')).toBeNull();
    });

    it('shows no Files tab on a site without Files', async () => {
        const { api } = site([{ module: 'bx_photos', tag: 'photos', title: 'Photos', kind: 'photo' }]);
        renderApp({ list: { section: 'media' }, detail: null }, api);
        // one media module: no tab bar, the photos' grid
        await screen.findByRole('button', { name: 'Add photos' });
        expect(screen.queryByRole('tab', { name: 'Files' })).toBeNull();
    });
});

function fakeUploader(picked: Picked[]) {
    const pending = new Map<string, { resolve: (m: Media) => void; purpose?: string }>();
    const options: unknown[] = [];
    const base: Uploader = {
        pick: async (o) => {
            options.push(o);
            return { files: picked, refused: [] };
        },
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths: async (_paths, o) => {
            options.push(o);
            return { files: [], refused: [] };
        },
        upload: (f: Picked, _progress, purpose) => new Promise<Media>((resolve) => void pending.set(f.handle ?? f.name, { resolve, purpose })),
        cancel: () => undefined,
        release: () => undefined,
    };
    return { base, pending, options };
}

describe('adding files', () => {
    it('picks any file, uploads it with the file purpose, adds them, then opens the first', async () => {
        const { api, calls } = site();
        const { base, pending, options } = fakeUploader([
            { handle: 'h-a', name: 'Agenda.pdf', size: 13264, mime: 'application/pdf', kind: 'file' },
            { handle: 'h-z', name: 'zines.zip', size: 2048, mime: 'application/zip', kind: 'file' },
        ]);
        const { history } = renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'new-files' } }, api, <NewFiles uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Add files' }));
        expect(await screen.findByText('Choose the files to add.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Choose files…' }));
        await waitFor(() => expect(pending.size).toBe(2));
        expect(options).toEqual([{ anyFiles: true }]);
        expect([...pending.values()].map((p) => p.purpose)).toEqual(['file', 'file']);
        // the tray names them as files
        expect(screen.getByRole('button', { name: 'Remove File Agenda.pdf' })).toBeTruthy();
        await act(async () => {
            pending.get('h-a')?.resolve(media('91'));
            pending.get('h-z')?.resolve(media('92', { original_name: 'zines.zip' }));
        });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'For Saturday' } });
        fireEvent.click(await screen.findByRole('button', { name: 'Add 2 files' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/files')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST' && c.path === '/files')!.body)).toEqual({ media_ids: ['91', '92'], text_html: '<p>For Saturday</p>', audience: 'public' });
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'file', id: '1' }));
        expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
        expect(calls.find((c) => c.method === 'POST' && c.path === '/files')!.key).toMatch(/^[0-9a-f-]{32,36}$/);
    });

    it('sends the files again with the same Idempotency-Key when the answer was lost', async () => {
        const { api, calls, lose } = site();
        const { base, pending } = fakeUploader([{ handle: 'h-a', name: 'Agenda.pdf', size: 13264, mime: 'application/pdf', kind: 'file' }]);
        const { history } = renderApp({ list: { section: 'media', feed: 'files' }, detail: { kind: 'new-files' } }, api, <NewFiles uploader={base} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Choose files…' }));
        await waitFor(() => expect(pending.size).toBe(1));
        await act(async () => pending.get('h-a')?.resolve(media('91')));
        lose('POST /files');
        fireEvent.click(await screen.findByRole('button', { name: 'Add files' }));
        expect((await screen.findByText(/^The files were not added: /)).getAttribute('role')).toBe('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Add files' }));
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'file', id: '1' }));
        const posts = calls.filter((c) => c.method === 'POST' && c.path === '/files');
        expect(posts).toHaveLength(2);
        expect(posts[0]!.key).toBeTruthy();
        expect(posts[1]!.key).toBe(posts[0]!.key);
    });

    it('has an uploader that takes any file and sends it as purpose file', async () => {
        const { base, pending, options } = fakeUploader([{ handle: 'h', name: 'a.docx', size: 1, mime: 'application/octet-stream', kind: 'file' }]);
        const up = fileUploader(base);
        const staged = await up.pick();
        await up.fromPaths(['/tmp/a.docx']);
        expect(options).toEqual([{ anyFiles: true }, { anyFiles: true }]);
        void up.upload(staged.files[0]!, () => undefined);
        expect(pending.get('h')?.purpose).toBe('file');
    });
});
