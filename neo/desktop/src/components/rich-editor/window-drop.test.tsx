/** A drop on the app window over a full editor (Rust delivers paths), while its text is being sent. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import type { Picked, Staging, Uploader } from '../../lib/uploads';
import { RichEditor } from './rich-editor';

type DropHandler = (e: { payload: { type: 'drop'; paths: string[]; position: { x: number; y: number } } }) => void;
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
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>;
const HELD = 'Pictures can’t be added while the text is being sent.';
const staged: Picked = { handle: 'h1', name: 'map.png', size: 4, mime: 'image/png', kind: 'image' };

function Wrapper({ children }: { children: ReactNode }) {
    const api = createUnaApi({ siteUrl: SITE, fetch: async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }) });
    const ctx: AppContextValue = { api, siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

function uploader(fromPaths: Uploader['fromPaths'], release: Uploader['release']): Uploader {
    return {
        pick: async () => ({ files: [], refused: [] }),
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths,
        upload: async () => {
            throw new Error('not here');
        },
        cancel: () => {},
        release,
    };
}

/** A drop inside the editor's box (a box of no size in the tests: its corner). */
const drop = () => act(async () => webview.handlers.forEach((h) => h({ payload: { type: 'drop', paths: ['/tmp/map.png'], position: { x: 0, y: 0 } } })));

afterEach(() => {
    cleanup();
    webview.handlers.length = 0;
});

describe('a picture dropped on the window over a text that is being sent', () => {
    it('is not made ready, and the box says why', async () => {
        const announce = vi.fn();
        const fromPaths = vi.fn(async (): Promise<Staging> => ({ files: [staged], refused: [] }));
        const release = vi.fn();
        const uploadInline = vi.fn(async (_file: Picked) => ({ src: `${SITE}/1.png` }));
        render(<RichEditor mode="full" label="Text" value="" onChange={() => {}} readOnly windowDrops announce={announce} images={{ uploader: uploader(fromPaths, release), uploadInline }} />, { wrapper: Wrapper });
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        await drop();
        expect(announce).toHaveBeenCalledWith(HELD);
        // nothing is staged for a picture that is refused
        expect(fromPaths).not.toHaveBeenCalled();
        expect(uploadInline).not.toHaveBeenCalled();
    });

    it('is released when the text began to be sent while it was made ready', async () => {
        const announce = vi.fn();
        let ready: (staging: Staging) => void = () => {};
        const fromPaths = vi.fn(() => new Promise<Staging>((resolve) => (ready = resolve)));
        const release = vi.fn();
        const uploadInline = vi.fn(async (_file: Picked) => ({ src: `${SITE}/1.png` }));
        const images = { uploader: uploader(fromPaths, release), uploadInline };
        const box = (readOnly: boolean) => <RichEditor mode="full" label="Text" value="" onChange={() => {}} readOnly={readOnly} windowDrops announce={announce} images={images} />;
        const { rerender } = render(box(false), { wrapper: Wrapper });
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        await drop();
        expect(fromPaths).toHaveBeenCalledWith(['/tmp/map.png']);
        rerender(box(true));
        await act(async () => ready({ files: [staged], refused: [] }));
        expect(release).toHaveBeenCalledWith(staged);
        expect(uploadInline).not.toHaveBeenCalled();
        expect(announce).toHaveBeenCalledWith(HELD);
    });
});
