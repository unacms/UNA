import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The window as Tauri gives it to a page (2.12): while the page listens for close requests,
 * close() is handed to its listener, which destroys the window unless it prevented that
 * (@tauri-apps/api window.js onCloseRequested); with no listener close() closes it, and
 * destroy() never asks anyone.
 */
const win = vi.hoisted(() => {
    type CloseEvent = { preventDefault: () => void };
    const listeners = new Set<(event: CloseEvent) => Promise<void>>();
    const state = { destroyed: 0, prevented: 0, listening: () => listeners.size };
    const destroy = () => {
        state.destroyed += 1;
        return Promise.resolve();
    };
    const api = {
        destroy,
        close: async () => {
            if (!listeners.size) return destroy();
            for (const handler of [...listeners]) {
                let prevented = false;
                await handler({
                    preventDefault: () => {
                        prevented = true;
                        state.prevented += 1;
                    },
                });
                if (!prevented) await destroy();
            }
        },
        onCloseRequested: (handler: (event: CloseEvent) => Promise<void>) => {
            listeners.add(handler);
            return Promise.resolve(() => void listeners.delete(handler));
        },
    };
    return { api, state, listeners };
});

vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => win.api }));

type Native = typeof import('./native');
type Flagged = { isTauri?: boolean };

/** native.ts as a window of its own in the app loads it (it reads both once, when it loads). */
async function inOwnWindow(): Promise<Native> {
    (globalThis as Flagged).isTauri = true;
    location.hash = '#window=%2Fposts%2Farticle%2F37';
    vi.resetModules();
    return import('./native');
}

/** The listener is taken up and put down in promise callbacks. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    win.listeners.clear();
    win.state.destroyed = 0;
    win.state.prevented = 0;
});

afterEach(() => {
    delete (globalThis as Flagged).isTauri;
    location.hash = '';
    vi.resetModules();
});

describe('a window of its own with unsaved changes in it', () => {
    it('stays when the answer is to keep them: the close is prevented', async () => {
        const native = await inOwnWindow();
        const keep = vi.fn(() => Promise.resolve(false));
        native.guardWindowClose(keep);
        await settled();
        native.closeThisWindow();
        await settled();
        expect(keep).toHaveBeenCalledTimes(1);
        expect(win.state.prevented).toBe(1);
        expect(win.state.destroyed).toBe(0);
    });

    it('goes when the answer is to discard them: nothing prevents the close', async () => {
        const native = await inOwnWindow();
        const discard = vi.fn(() => Promise.resolve(true));
        native.guardWindowClose(discard);
        await settled();
        native.closeThisWindow();
        await settled();
        expect(discard).toHaveBeenCalledTimes(1);
        expect(win.state.prevented).toBe(0);
        expect(win.state.destroyed).toBe(1);
    });

    it('stays when the question itself fails', async () => {
        const native = await inOwnWindow();
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        native.guardWindowClose(() => Promise.reject(new Error('no dialog')));
        await settled();
        native.closeThisWindow();
        await settled();
        expect(win.state.prevented).toBe(1);
        expect(win.state.destroyed).toBe(0);
        errors.mockRestore();
    });

    it('does not ask a question that was taken back, and stops listening once none is left', async () => {
        const native = await inOwnWindow();
        const gone = vi.fn(() => Promise.resolve(false));
        const still = vi.fn(() => Promise.resolve(true));
        const forget = native.guardWindowClose(gone);
        const forgetOther = native.guardWindowClose(still);
        await settled();
        expect(win.state.listening()).toBe(1);
        forget();
        native.closeThisWindow();
        await settled();
        expect(gone).not.toHaveBeenCalled();
        expect(still).toHaveBeenCalledTimes(1);
        expect(win.state.destroyed).toBe(1);
        // no question left: the page no longer hears a close, which is then the window's own
        forgetOther();
        await settled();
        expect(win.state.listening()).toBe(0);
        native.closeThisWindow();
        await settled();
        expect(still).toHaveBeenCalledTimes(1);
        expect(win.state.prevented).toBe(0);
        expect(win.state.destroyed).toBe(2);
        // and it listens again for the next form that has changes
        native.guardWindowClose(gone);
        await settled();
        expect(win.state.listening()).toBe(1);
    });

    it('stops listening when the question went before the listener was there', async () => {
        const native = await inOwnWindow();
        native.guardWindowClose(() => Promise.resolve(false))();
        await settled();
        expect(win.state.listening()).toBe(0);
    });

    it('is not asked by a close that must happen (the session is over, what it showed is closed)', async () => {
        const native = await inOwnWindow();
        const keep = vi.fn(() => Promise.resolve(false));
        native.guardWindowClose(keep);
        await settled();
        native.forceCloseThisWindow();
        await settled();
        expect(keep).not.toHaveBeenCalled();
        expect(win.state.prevented).toBe(0);
        expect(win.state.destroyed).toBe(1);
    });
});
