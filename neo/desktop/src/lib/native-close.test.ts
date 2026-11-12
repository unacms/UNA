import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The window as Tauri gives it to a page (2.12): while the page listens for close requests,
 * close() is handed to its listener, which destroys the window unless it prevented that
 * (@tauri-apps/api window.js onCloseRequested); with no listener close() closes it as the
 * window's own close does (`closed`: the one the window-state plugin hears), and destroy()
 * never asks anyone. What stops a listener answers once it is gone in Rust too.
 */
const win = vi.hoisted(() => {
    type CloseEvent = { preventDefault: () => void };
    const listeners = new Set<(event: CloseEvent) => Promise<void>>();
    const state = { destroyed: 0, closed: 0, prevented: 0, listening: () => listeners.size };
    const destroy = () => {
        state.destroyed += 1;
        return Promise.resolve();
    };
    const api = {
        destroy,
        close: async () => {
            if (!listeners.size) {
                state.closed += 1;
                return destroy();
            }
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
            return Promise.resolve(async () => {
                // Rust is told, and answers later
                await new Promise((resolve) => setTimeout(resolve, 0));
                listeners.delete(handler);
            });
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

/** The listener is taken up in promise callbacks, and put down once Rust answered. */
const settled = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
};

beforeEach(() => {
    win.listeners.clear();
    win.state.destroyed = 0;
    win.state.closed = 0;
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

    it('does not ask a question that the answer to another took back: the window goes', async () => {
        const native = await inOwnWindow();
        const forget: { second: () => void } = { second: () => {} };
        const second = vi.fn(() => Promise.resolve(false));
        // the first one's answer takes the second away before it lets the window go
        const first = vi.fn(() => {
            forget.second();
            return Promise.resolve(true);
        });
        native.guardWindowClose(first);
        forget.second = native.guardWindowClose(second);
        await settled();
        native.closeThisWindow();
        await settled();
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
        expect(win.state.prevented).toBe(0);
        expect(win.state.destroyed).toBe(1);
    });

    it('closes as the window itself does once what it showed is closed: no question again, and not destroyed past the window', async () => {
        const native = await inOwnWindow();
        const keep = vi.fn(() => Promise.resolve(false));
        native.guardWindowClose(keep);
        await settled();
        await native.closeThisWindowAsked();
        // the page stopped listening before it closed, so the close was the window's own
        expect(win.state.listening()).toBe(0);
        expect(keep).not.toHaveBeenCalled();
        expect(win.state.prevented).toBe(0);
        expect(win.state.closed).toBe(1);
        expect(win.state.destroyed).toBe(1);
    });

    it('closes as the window itself does when the form went first: its stop is waited for, not raced', async () => {
        const native = await inOwnWindow();
        const keep = vi.fn(() => Promise.resolve(false));
        const forget = native.guardWindowClose(keep);
        await settled();
        // what the window showed closes: the form unmounts and takes its question back, then the window closes
        forget();
        expect(win.state.listening()).toBe(1);
        await native.closeThisWindowAsked();
        expect(win.state.listening()).toBe(0);
        expect(keep).not.toHaveBeenCalled();
        expect(win.state.prevented).toBe(0);
        expect(win.state.closed).toBe(1);
        expect(win.state.destroyed).toBe(1);
    });

    it('closes all the same when the listener could not be stopped', async () => {
        const native = await inOwnWindow();
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
        const listen = win.api.onCloseRequested;
        win.api.onCloseRequested = () => Promise.resolve(() => Promise.reject(new Error('no unlisten')));
        native.guardWindowClose(() => Promise.resolve(false));
        await settled();
        await native.closeThisWindowAsked();
        win.api.onCloseRequested = listen;
        expect(errors).toHaveBeenCalledWith('close requests', expect.any(Error));
        expect(win.state.closed).toBe(1);
        expect(win.state.destroyed).toBe(1);
        errors.mockRestore();
    });

    it('closes as the window itself does when nothing in it had a question', async () => {
        const native = await inOwnWindow();
        await native.closeThisWindowAsked();
        expect(win.state.closed).toBe(1);
        expect(win.state.destroyed).toBe(1);
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
        expect(win.state.closed).toBe(0);
        expect(win.state.prevented).toBe(0);
        expect(win.state.destroyed).toBe(1);
    });
});
