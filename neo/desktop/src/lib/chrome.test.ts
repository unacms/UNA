import { afterEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => invoke(...args), isTauri: () => false }));

afterEach(() => {
    vi.resetModules();
    vi.doUnmock('./native');
    invoke.mockReset();
});

describe('the window around the page', () => {
    it('outside the app: the platform, no material, the main window, active', async () => {
        const { initChrome, windowTitle } = await import('./chrome');
        const root = document.createElement('html');
        await initChrome(root);
        expect(root.dataset.platform).toMatch(/^(mac|windows|linux)$/);
        expect(root.dataset.material).toBe('none');
        expect(root.dataset.window).toBe('main');
        expect(root.dataset.windowActive).toBe('true');
        expect(invoke).not.toHaveBeenCalled();
        expect(windowTitle('Home', 'UNA Makers')).toBe('Home – UNA Makers');
        expect(windowTitle('Home', undefined)).toBe('Home');
    });

    it('in the app: asks Rust which material it applied, and trusts nothing else', async () => {
        vi.doMock('./native', () => ({ inApp: true, isSecondaryWindow: false }));
        const { windowMaterial } = await import('./chrome');
        invoke.mockResolvedValueOnce('sidebar');
        expect(await windowMaterial()).toBe('sidebar');
        expect(invoke).toHaveBeenCalledWith('window_material');
        invoke.mockResolvedValueOnce('glass');
        expect(await windowMaterial()).toBe('none');
        invoke.mockRejectedValueOnce(new Error('not allowed'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await windowMaterial()).toBe('none');
    });

    it('names the native window on its own record, whatever document.title says', async () => {
        const setTitle = vi.fn(() => Promise.resolve());
        vi.doMock('./native', () => ({ inApp: true, isSecondaryWindow: false }));
        vi.doMock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({ setTitle }) }));
        const { setWindowTitle } = await import('./chrome');
        setWindowTitle('Home – UNA Makers');
        expect(setTitle).toHaveBeenLastCalledWith('Home – UNA Makers');
        // the page's title set elsewhere to the same text: the native one still follows
        document.title = 'Sign in – UNA';
        setWindowTitle('Sign in – UNA');
        expect(setTitle).toHaveBeenLastCalledWith('Sign in – UNA');
        setWindowTitle('Sign in – UNA');
        expect(setTitle).toHaveBeenCalledTimes(2);
        vi.doUnmock('@tauri-apps/api/window');
    });

    it('a window shown without focus starts inactive, and a focus event wins over the first ask', async () => {
        let onFocus: ((e: { payload: boolean }) => void) | undefined;
        let isFocused = vi.fn(() => Promise.resolve(false));
        const win = {
            onFocusChanged: (cb: (e: { payload: boolean }) => void) => {
                onFocus = cb;
                return Promise.resolve(() => {});
            },
            isFocused: () => isFocused(),
            isFullscreen: () => Promise.resolve(false),
            onResized: () => Promise.resolve(() => {}),
        };
        vi.doMock('./native', () => ({ inApp: true, isSecondaryWindow: false }));
        vi.doMock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => win }));
        invoke.mockResolvedValue('sidebar');
        const { initChrome } = await import('./chrome');
        const root = document.createElement('html');
        await initChrome(root);
        await vi.waitFor(() => expect(root.dataset.windowActive).toBe('false'));
        onFocus?.({ payload: true });
        expect(root.dataset.windowActive).toBe('true');

        // the event comes before the ask answers: the ask's stale answer is ignored
        let answer: (f: boolean) => void = () => {};
        isFocused = vi.fn(() => new Promise<boolean>((r) => (answer = r)));
        vi.resetModules();
        const again = await import('./chrome');
        const root2 = document.createElement('html');
        await again.initChrome(root2);
        await vi.waitFor(() => expect(isFocused).toHaveBeenCalled());
        onFocus?.({ payload: true });
        answer(false);
        await Promise.resolve();
        await Promise.resolve();
        expect(root2.dataset.windowActive).toBe('true');
        vi.doUnmock('@tauri-apps/api/window');
    });

    it('a window of its own is opaque and never asks', async () => {
        vi.doMock('./native', () => ({ inApp: true, isSecondaryWindow: true }));
        const { windowMaterial } = await import('./chrome');
        expect(await windowMaterial()).toBe('none');
        expect(invoke).not.toHaveBeenCalled();
    });
});
