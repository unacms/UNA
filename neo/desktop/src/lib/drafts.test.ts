import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Schema } from 'una-api';

// The store plugin as a file on disk: an instance reads the file when it loads and writes it on
// save(), so a new instance is the app after a restart and sees only what was saved.
const disk = new Map<string, Record<string, unknown>>();
// Rust opens drafts.json at start; getStore answers only a store opened there, else null.
const opened = new Set(['drafts.json']);
vi.mock('@tauri-apps/plugin-store', () => ({
    getStore: async (path: string) => (opened.has(path) ? new FakeStore(path) : null),
}));
class FakeStore {
    private data: Record<string, unknown> | null = null;
    constructor(private readonly path: string) {}
    private load() {
        this.data ??= { ...(disk.get(this.path) ?? {}) };
        return this.data;
    }
    async get(key: string) {
        return this.load()[key];
    }
    async set(key: string, value: unknown) {
        this.load()[key] = value;
    }
    async delete(key: string) {
        return delete this.load()[key];
    }
    async entries() {
        return Object.entries(this.load());
    }
    async save() {
        disk.set(this.path, { ...this.load() });
    }
}

import { DRAFT_MAX_AGE_MS, draftKey, DraftStore, localStorageBackend, readDraft, setDraftStore, tauriBackend, UPLOAD_KEEP_MS, useDraft } from './drafts';

const site = 'https://community.example/';
const media = (id: string): Schema<'Media'> => ({ id, kind: 'image', mime: 'image/png', size: 0, state: 'ready', original_name: '', url: '', download_url: '', variants: {}, width: 4, height: 3 });

beforeEach(() => {
    disk.clear();
    localStorage.clear();
});
afterEach(() => setDraftStore(null));

describe('kept drafts of an older version', () => {
    it('drops uploads kept in the Media shape before variants, and keeps the rest', () => {
        const old = { id: '1', kind: 'image', url: 'https://x/m.jpg', thumb_url: 'https://x/t.jpg', large_url: 'https://x/o.jpg', state: 'ready', mime: 'image/png', width: 4, height: 3 };
        const draft = { text: 'Hello', updatedAt: 1, media: [{ media: old, name: 'a.png', uploadedAt: 1 }, { media: media('2'), name: 'b.png', uploadedAt: 1 }] };
        expect(readDraft(draft)?.media?.map((m) => m.media.id)).toEqual(['2']);
        expect(readDraft({ text: 'Hi', updatedAt: 1 })).toEqual({ text: 'Hi', updatedAt: 1 });
        expect(readDraft({ text: 1 })).toBeUndefined();
    });
});

describe('lasting drafts', () => {
    it('are keyed by site, profile and what they are for', () => {
        expect(draftKey(site, '4', 'feed')).toBe('https://community.example|4|feed');
        expect(draftKey(site, '4', 'comment:12:99')).toBe('https://community.example|4|comment:12:99');
        expect(draftKey(site, '8', 'feed')).not.toBe(draftKey(site, '4', 'feed'));
        expect(draftKey('https://other.example', '4', 'feed')).not.toBe(draftKey(site, '4', 'feed'));
    });

    it('come back after a restart of the app (the store plugin)', async () => {
        const key = draftKey(site, '4', 'feed');
        await new DraftStore(tauriBackend()).set(key, { text: 'Half a post', audience: 'friends', contextId: null });

        // a new store, as after a restart, reads what the first one saved
        const after = await new DraftStore(tauriBackend()).get(key);
        expect(after?.text).toBe('Half a post');
        expect(after?.audience).toBe('friends');
        expect(after?.updatedAt).toBeGreaterThan(0);

        await new DraftStore(tauriBackend()).delete(key);
        expect(await new DraftStore(tauriBackend()).get(key)).toBeUndefined();
    });

    it('only use the store Rust opened: the page never opens a file by path', async () => {
        const other = tauriBackend('../../.zshrc');
        await expect(other.set('k', { text: 'x', updatedAt: 1 })).rejects.toThrow(/not open/);
        expect(disk.size).toBe(0);
    });

    it('come back after a reload in a browser (localStorage)', async () => {
        const key = draftKey(site, '4', 'conversation:7');
        await new DraftStore(localStorageBackend()).set(key, { text: 'See you' });
        expect((await new DraftStore(localStorageBackend()).get(key))?.text).toBe('See you');
    });

    it('drop an empty draft instead of keeping it', async () => {
        const store = new DraftStore(localStorageBackend());
        const key = draftKey(site, '4', 'feed');
        await store.set(key, { text: 'x' });
        await store.set(key, { text: '   ', media: [] });
        expect(await store.get(key)).toBeUndefined();
    });

    it('forget drafts left alone for a month, and uploads the site has deleted by now', async () => {
        let now = 1_000_000_000_000;
        const backend = localStorageBackend();
        const writer = new DraftStore(backend, () => now);
        await writer.set('old', { text: 'old' });
        await writer.set('post', { text: 'with photos', media: [{ media: media('1'), name: 'a.png', uploadedAt: now - UPLOAD_KEEP_MS - 1 }, { media: media('2'), name: 'b.png', uploadedAt: now }] });
        now += DRAFT_MAX_AGE_MS + 1;
        await writer.set('post', { text: 'with photos', media: [{ media: media('1'), name: 'a.png', uploadedAt: now - UPLOAD_KEEP_MS - 1 }, { media: media('2'), name: 'b.png', uploadedAt: now }] });

        const reader = new DraftStore(backend, () => now);
        expect(await reader.get('old')).toBeUndefined();
        expect((await reader.get('post'))?.media?.map((m) => m.media.id)).toEqual(['2']);
    });

    it('list the drafts of one post', async () => {
        const store = new DraftStore(localStorageBackend());
        const base = draftKey(site, '4', 'comment:12');
        await store.set(base, { text: 'comment' });
        await store.set(`${base}:99`, { text: 'reply' });
        await store.set(draftKey(site, '4', 'comment:13'), { text: 'elsewhere' });
        expect((await store.list(base)).map(([k]) => k).sort()).toEqual([base, `${base}:99`]);
    });

    it('are written a moment after typing stops, and at unmount', async () => {
        vi.useFakeTimers();
        try {
            const store = new DraftStore(localStorageBackend());
            setDraftStore(store);
            const { result, unmount } = renderHook(() => useDraft('k'));
            await act(async () => {
                await vi.runAllTimersAsync();
            });
            expect(result.current.loaded).toBeNull();

            act(() => result.current.save({ text: 'a' }));
            act(() => result.current.save({ text: 'ab' }));
            expect(localStorage.length).toBe(0);
            await act(async () => {
                await vi.advanceTimersByTimeAsync(400);
            });
            expect((await store.get('k'))?.text).toBe('ab');

            act(() => result.current.save({ text: 'abc' }));
            unmount();
            await act(async () => {
                await vi.runAllTimersAsync();
            });
            expect((await store.get('k'))?.text).toBe('abc');

            const again = renderHook(() => useDraft('k'));
            await act(async () => {
                await vi.runAllTimersAsync();
            });
            expect(again.result.current.loaded?.text).toBe('abc');
            act(() => again.result.current.clear());
            await act(async () => {
                await vi.runAllTimersAsync();
            });
            expect(await store.get('k')).toBeUndefined();
        } finally {
            vi.useRealTimers();
        }
    });
});
