/** A form's photos (PhotoDropZone) in the app, where Rust delivers the window's drops, while the form is held (being sent). */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import type { Picked, Staging, Uploader } from '../../lib/uploads';
import { PhotoDropZone, usePhotoUploads } from './photo-uploads';

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
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>;
const cover: Picked = { handle: 'h1', name: 'cover.jpg', size: 100, mime: 'image/jpeg', kind: 'image' };
const media: Schema<'Media'> = { id: '91', kind: 'image', mime: 'image/jpeg', size: 100, state: 'ready', original_name: 'cover.jpg', url: '', download_url: '', variants: {}, width: 4, height: 3 };

const api = createUnaApi({ siteUrl: SITE, fetch: async () => new Response(null, { status: 204 }) });
const ctx: AppContextValue = { api, siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
function Wrapper({ children }: { children: ReactNode }) {
    return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

function uploader(over: Partial<Uploader>): Uploader {
    return {
        pick: async () => ({ files: [cover], refused: [] }),
        fromFiles: async () => ({ files: [], refused: [] }),
        fromPaths: async () => ({ files: [cover], refused: [] }),
        upload: async () => media,
        cancel: () => {},
        release: () => {},
        ...over,
    };
}

const announce = () => {};
function Zone({ uploader: given, held }: { uploader: Uploader; held: boolean }) {
    const uploads = usePhotoUploads({ purpose: 'post_cover', uploader: given, announce });
    return <PhotoDropZone uploads={uploads} pickId="pick" label="Choose a cover…" held={held} />;
}

const emit = (payload: DropEvent['payload']) => act(async () => webview.handlers.forEach((h) => h({ payload })));
const drop = () => emit({ type: 'drop', paths: ['/tmp/cover.jpg'], position: { x: 50, y: 50 } });
const zone = () => screen.getByRole('button', { name: 'Choose a cover…' }).parentElement as HTMLElement;

afterEach(() => {
    cleanup();
    webview.handlers.length = 0;
});

describe('a form’s photos while the form is being sent', () => {
    it('take no drop on the app window, and do not show the window as a place to drop on', async () => {
        const fromPaths = vi.fn(async (): Promise<Staging> => ({ files: [cover], refused: [] }));
        const up = uploader({ fromPaths });
        const { rerender } = render(<Zone uploader={up} held />, { wrapper: Wrapper });
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        await emit({ type: 'enter' });
        expect(zone().getAttribute('data-dragging')).toBeNull();
        await drop();
        expect(fromPaths).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Remove Photo cover.jpg' })).toBeNull();
        // sent (or not): the window is a place to drop on again
        rerender(<Zone uploader={up} held={false} />);
        await emit({ type: 'enter' });
        expect(zone().getAttribute('data-dragging')).toBe('true');
        // it began to be sent with a file over the window: the highlight goes
        rerender(<Zone uploader={up} held />);
        expect(zone().getAttribute('data-dragging')).toBeNull();
        rerender(<Zone uploader={up} held={false} />);
        await drop();
        expect(fromPaths).toHaveBeenCalledTimes(1);
        expect(await screen.findByRole('button', { name: 'Remove Photo cover.jpg' })).toBeTruthy();
        expect(zone().getAttribute('data-dragging')).toBeNull();
    });

    it('let go a photo that was being made ready when the form began to be sent: dropped, or picked', async () => {
        let ready: (staging: Staging) => void = () => {};
        const made = () => new Promise<Staging>((resolve) => (ready = resolve));
        const release = vi.fn();
        const upload = vi.fn(async () => media);
        const up = uploader({ fromPaths: made, pick: made, release, upload });
        const { rerender } = render(<Zone uploader={up} held={false} />, { wrapper: Wrapper });
        await waitFor(() => expect(webview.handlers).toHaveLength(1));
        for (const take of [drop, async () => void fireEvent.click(screen.getByRole('button', { name: 'Choose a cover…' }))]) {
            release.mockClear();
            rerender(<Zone uploader={up} held={false} />);
            await take();
            rerender(<Zone uploader={up} held />);
            await act(async () => ready({ files: [cover], refused: [] }));
            // the request left without it: no upload is started, and nothing keeps the file
            expect(release).toHaveBeenCalledWith(cover);
            expect(upload).not.toHaveBeenCalled();
            expect(screen.queryByRole('button', { name: 'Remove Photo cover.jpg' })).toBeNull();
        }
    });

    it('do not try a failed upload again: Retry keeps its place and does nothing', async () => {
        const upload = vi.fn(async (): Promise<Schema<'Media'>> => {
            throw new Error('The site refused it');
        });
        const up = uploader({ upload });
        const { rerender } = render(<Zone uploader={up} held={false} />, { wrapper: Wrapper });
        fireEvent.click(screen.getByRole('button', { name: 'Choose a cover…' }));
        const retry = await screen.findByRole('button', { name: 'Retry Photo cover.jpg' });
        expect(upload).toHaveBeenCalledTimes(1);
        rerender(<Zone uploader={up} held />);
        expect(retry.getAttribute('aria-disabled')).toBe('true');
        expect((retry as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(retry);
        await act(async () => {});
        expect(upload).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Retry Photo cover.jpg' })).toBe(retry);
        rerender(<Zone uploader={up} held={false} />);
        expect(retry.getAttribute('aria-disabled')).toBeNull();
        fireEvent.click(retry);
        await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
    });
});
