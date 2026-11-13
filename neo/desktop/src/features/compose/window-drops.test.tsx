/** The composers in the app, where Rust delivers the window's drops as paths: a drop being made ready holds Post and Send. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { MenuHost } from '../../components/menu-popover';
import { setRichText } from '../../components/rich-editor/test-utils';
import { AppContext, type AppContextValue } from '../../lib/context';
import { DraftStore, localStorageBackend, setDraftStore } from '../../lib/drafts';
import type { Picked, Staging, Uploader } from '../../lib/uploads';
import { MessageComposer } from '../messages/message-composer';
import { ComposeProvider, useCompose } from './compose-sheet';

type DropEvent = { payload: { type: 'enter' | 'leave' } | { type: 'drop'; paths: string[]; position: { x: number; y: number } } };
type DropHandler = (e: DropEvent) => void;
const webview = vi.hoisted(() => ({ handlers: [] as DropHandler[] }));

vi.mock('../../lib/native', async (original) => ({ ...(await original<typeof import('../../lib/native')>()), inApp: true }));
vi.mock('@tauri-apps/api/webview', () => ({
    getCurrentWebview: () => ({
        onDragDropEvent: async (handler: DropHandler) => {
            webview.handlers.push(handler);
            return () => webview.handlers.splice(webview.handlers.indexOf(handler), 1);
        },
    }),
}));

const SITE = 'https://community.example';
const WAIT = 'Wait until the uploads are done';
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>;
const pier: Picked = { handle: 'h-pier', name: 'pier.jpg', size: 100, mime: 'image/jpeg', kind: 'image' };
const media: Schema<'Media'> = { id: '77', kind: 'image', mime: 'image/jpeg', size: 100, state: 'ready', original_name: 'pier.jpg', url: '', download_url: '', variants: {}, width: 4, height: 3 };

type Call = { method: string; path: string; body: unknown };
function fakeApi(calls: Call[]): UnaApi {
    return createUnaApi({
        siteUrl: SITE,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const text = await request.text();
            const call = { method: request.method, path: new URL(request.url).pathname.replace(/^\/api\/v2/, ''), body: text ? (JSON.parse(text) as unknown) : null };
            calls.push(call);
            if (call.method === 'POST' && call.path === '/feed-posts') return new Response(JSON.stringify({ id: '5', verb: 'posted', object: { id: 'c5', kind: 'feed_post', module: 'bx_timeline', media: [] }, created_at: '2026-11-06T00:00:00Z' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
            return new Response(null, { status: 204 });
        },
    });
}

function wrapper(api: UnaApi) {
    const client = new QueryClient({ logger: { log: () => {}, warn: () => {}, error: () => {} } });
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

/** Paths become files, and files uploads, when the test says so. */
function slowUploader() {
    let made: (staging: Staging) => void = () => {};
    let uploaded: (m: Schema<'Media'>) => void = () => {};
    const uploader: Uploader = {
        pick: async () => ({ files: [], refused: [] }),
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths: () => new Promise<Staging>((resolve) => (made = resolve)),
        upload: () => new Promise<Schema<'Media'>>((resolve) => (uploaded = resolve)),
        cancel: () => {},
        release: () => {},
    };
    return { uploader, ready: () => act(async () => made({ files: [pier], refused: [] })), finish: () => act(async () => uploaded(media)) };
}

const drop = () => act(async () => webview.handlers.forEach((h) => h({ payload: { type: 'drop', paths: ['/tmp/pier.jpg'], position: { x: 0, y: 0 } } })));

function Opener() {
    const compose = useCompose();
    return (
        <button type="button" onClick={() => compose?.open()}>
            Write
        </button>
    );
}

// drafts in the page's storage: the app's own store is Rust's
beforeEach(() => setDraftStore(new DraftStore(localStorageBackend())));
afterEach(() => {
    cleanup();
    webview.handlers.length = 0;
    localStorage.clear();
    setDraftStore(null);
});

describe('a drop on the app window that is still being made ready', () => {
    it('holds Post in the compose sheet, which says to wait, and the post goes with the photo once it is up', async () => {
        const calls: Call[] = [];
        const posts = () => calls.filter((c) => c.method === 'POST' && c.path === '/feed-posts');
        const { uploader, ready, finish } = slowUploader();
        render(
            <ComposeProvider uploader={uploader}>
                <Opener />
            </ComposeProvider>,
            { wrapper: wrapper(fakeApi(calls)) },
        );
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        fireEvent.click(screen.getByRole('button', { name: 'Write' }));
        const sheet = screen.getByRole('dialog', { name: 'New post' });
        setRichText(within(sheet).getByRole('textbox', { name: "What's new?" }), 'Hi');
        const post = within(sheet).getByRole('button', { name: 'Post' }) as HTMLButtonElement;
        await drop();
        fireEvent.click(post);
        await act(async () => {});
        expect(posts()).toHaveLength(0);
        expect(document.getElementById('compose-blocker')?.textContent).toBe(WAIT);

        await ready();
        expect(await within(sheet).findByRole('list', { name: '1 attachment' })).toBeTruthy();
        await finish();
        await waitFor(() => expect(post.disabled).toBe(false));
        fireEvent.click(post);
        await waitFor(() => expect(posts()).toHaveLength(1));
        expect(posts()[0]?.body).toEqual({ audience: 'public', body_html: '<p>Hi</p>', media_ids: ['77'] });
    });

    it('holds Send when it was dropped on a message’s box, which says to wait, and the message goes with the photo once it is up', async () => {
        const { uploader, ready, finish } = slowUploader();
        const sent: { html: string; ids: string[] }[] = [];
        const said: string[] = [];
        render(<MessageComposer purpose="message" draftKey={null} placeholder="Write a message" uploader={uploader} announce={(text) => void said.push(text)} onSend={async (html, ids) => void sent.push({ html, ids })} />, { wrapper: wrapper(fakeApi([])) });
        const box = await screen.findByRole('textbox', { name: 'Write a message' });
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        setRichText(box, 'Hello');
        const hint = () => document.getElementById(box.getAttribute('aria-describedby') ?? '')?.textContent;
        const enter = () => act(async () => void fireEvent.keyDown(box, { key: 'Enter' }));
        await drop();
        await enter();
        expect(sent).toHaveLength(0);
        expect(hint()).toBe(WAIT);
        expect(said).toContain(WAIT);

        await ready();
        expect(await screen.findByRole('list', { name: '1 attachment' })).toBeTruthy();
        await finish();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Send' }).getAttribute('aria-disabled')).toBeNull());
        await enter();
        await waitFor(() => expect(sent).toHaveLength(1));
        expect(sent[0]).toEqual({ html: '<p>Hello</p>', ids: ['77'] });
    });
});
