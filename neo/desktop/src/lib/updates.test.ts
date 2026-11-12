import { describe, expect, it, vi } from 'vitest';

import { CHECK_EVERY, FIRST_CHECK_DELAY, type InstallEvent, scheduleChecks, tauriUpdatesBackend, type UpdateInfo, type UpdatesBackend, UpdatesStore } from './updates';

const update: UpdateInfo = { version: '0.2.0', currentVersion: '0.1.0', notes: '- Faster feed', date: '2026-11-20T10:00:00Z' };

/** A backend whose answers the test gives, one call at a time. */
function fake() {
    const checks: { automatic: boolean; resolve: (u: UpdateInfo | null) => void; reject: (e: unknown) => void }[] = [];
    const installs: { version: string; send: (e: InstallEvent) => void; resolve: () => void; reject: (e: unknown) => void }[] = [];
    const backend: UpdatesBackend = {
        check: (automatic) => new Promise((resolve, reject) => checks.push({ automatic, resolve, reject })),
        install: (version, send) => new Promise((resolve, reject) => installs.push({ version, send, resolve, reject })),
    };
    return { backend, checks, installs };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('updates', () => {
    it('asks Rust, saying whether the person asked', async () => {
        // the Channel install passes Rust registers a callback with Tauri's internals
        Object.assign(globalThis, { __TAURI_INTERNALS__: { transformCallback: () => 1 } });
        const call = vi.fn().mockResolvedValue(null);
        const backend = tauriUpdatesBackend(call as never);
        await backend.check(true);
        expect(call).toHaveBeenCalledWith('check_update', { automatic: true });
        await backend.install('0.2.0', () => {});
        expect(call).toHaveBeenLastCalledWith('install_update', expect.objectContaining({ version: '0.2.0' }));
    });

    it('an automatic check offers what it finds and opens nothing', async () => {
        const { backend, checks } = fake();
        const store = new UpdatesStore(backend);
        const done = store.check({ manual: false });
        expect(store.current).toEqual({ phase: 'idle', dialogOpen: false });
        expect(checks[0]?.automatic).toBe(true);
        checks[0]?.resolve(update);
        await done;
        expect(store.current).toEqual({ phase: 'available', update, dialogOpen: false });
        expect(store.pending).toEqual(update);
    });

    it('an automatic check that fails or finds nothing says nothing', async () => {
        const { backend, checks } = fake();
        const store = new UpdatesStore(backend, () => 5);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const first = store.check({ manual: false });
        checks[0]?.reject(new Error('offline'));
        await first;
        expect(store.current).toEqual({ phase: 'idle', dialogOpen: false });
        const second = store.check({ manual: false });
        checks[1]?.resolve(null);
        await second;
        expect(store.current.dialogOpen).toBe(false);
        expect(store.pending).toBeNull();
        warn.mockRestore();
    });

    it('a check the person asked for opens the dialog and says what came back', async () => {
        const { backend, checks } = fake();
        const store = new UpdatesStore(backend, () => 42);
        const done = store.check({ manual: true });
        expect(store.current).toEqual({ phase: 'checking', dialogOpen: true });
        expect(checks[0]?.automatic).toBe(false);
        checks[0]?.resolve(null);
        await done;
        expect(store.current).toEqual({ phase: 'current', checkedAt: 42, dialogOpen: true });
        store.closeDialog();
        expect(store.current).toEqual({ phase: 'idle', dialogOpen: false });

        const again = store.check({ manual: true });
        checks[1]?.reject(new Error('The update server could not be reached'));
        await again;
        expect(store.current).toEqual({ phase: 'failed', reason: 'The update server could not be reached', dialogOpen: true });
    });

    it('asks once while a check is out', () => {
        const { backend, checks } = fake();
        const store = new UpdatesStore(backend);
        void store.check({ manual: false });
        void store.check({ manual: true });
        expect(checks).toHaveLength(1);
        expect(store.current.dialogOpen).toBe(true);
    });

    it('installs only what was found, showing the download, and keeps the dialog open meanwhile', async () => {
        const { backend, checks, installs } = fake();
        const store = new UpdatesStore(backend);
        await store.install();
        expect(installs, 'nothing found: nothing to install').toHaveLength(0);

        const found = store.check({ manual: false });
        checks[0]?.resolve(update);
        await found;
        store.openDialog();
        const done = store.install();
        expect(installs[0]?.version).toBe('0.2.0');
        expect(store.current).toMatchObject({ phase: 'downloading', downloaded: 0, total: null });
        installs[0]?.send({ event: 'started', total: 1000 });
        installs[0]?.send({ event: 'progress', downloaded: 400 });
        expect(store.current).toMatchObject({ phase: 'downloading', downloaded: 400, total: 1000 });
        store.closeDialog();
        expect(store.current.dialogOpen, 'not closed while it installs').toBe(true);
        void store.check({ manual: true });
        expect(checks, 'no check while it installs').toHaveLength(1);
        installs[0]?.send({ event: 'installing' });
        expect(store.current).toMatchObject({ phase: 'installing', update });
        installs[0]?.resolve();
        await done;
    });

    it('a failed install keeps the update to try again', async () => {
        const { backend, checks, installs } = fake();
        const store = new UpdatesStore(backend);
        const found = store.check({ manual: false });
        checks[0]?.resolve(update);
        await found;
        const done = store.install();
        installs[0]?.reject('The new version is not signed by the app’s publisher, so it was not installed');
        await done;
        expect(store.current).toEqual({ phase: 'failed', reason: 'The new version is not signed by the app’s publisher, so it was not installed', update, dialogOpen: true });
        expect(store.pending).toEqual(update);
        store.closeDialog();
        expect(store.current.phase, 'the offer stays for the sidebar').toBe('failed');
        expect(store.current.dialogOpen).toBe(false);
    });

    it('checks after start and once a day, only while the setting is on', async () => {
        vi.useFakeTimers();
        try {
            const { backend, checks } = fake();
            const store = new UpdatesStore(backend);
            let on = true;
            const stop = scheduleChecks(store, () => on);
            vi.advanceTimersByTime(FIRST_CHECK_DELAY - 1);
            expect(checks).toHaveLength(0);
            vi.advanceTimersByTime(1);
            expect(checks).toHaveLength(1);
            checks[0]?.resolve(null);
            await vi.advanceTimersByTimeAsync(0);
            on = false;
            vi.advanceTimersByTime(CHECK_EVERY);
            expect(checks, 'turned off: no check').toHaveLength(1);
            on = true;
            vi.advanceTimersByTime(CHECK_EVERY);
            expect(checks).toHaveLength(2);
            stop();
            vi.advanceTimersByTime(CHECK_EVERY * 2);
            expect(checks).toHaveLength(2);
        } finally {
            vi.useRealTimers();
        }
        await settle();
    });
});
