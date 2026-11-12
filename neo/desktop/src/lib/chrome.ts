/**
 * The window around the page: which OS and material it is drawn on, whether it is the active
 * window, full screen, and its native title. All of it lands on <html> as data attributes that
 * tokens.css and styles.css key off:
 *
 * - `data-platform`: mac, windows or linux (sizes and radii per platform)
 * - `data-material`: sidebar (macOS vibrancy), mica (Windows 11) or none; Rust applied it before
 *   the window was shown (src-tauri/src/material.rs), and the page only asks which
 * - `data-window`: main or secondary (a window of its own is always opaque)
 * - `data-window-active`: false while another app or window is in front (AppKit's inactive look)
 * - `data-fullscreen`: true in full screen, where the traffic lights are gone
 */
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSyncExternalStore } from 'react';

import { inApp, isSecondaryWindow } from './native';
import { platformName } from './platform';
import { APP_NAME } from './brand';

export type Material = 'sidebar' | 'mica' | 'none';

function isMaterial(value: unknown): value is Material {
    return value === 'sidebar' || value === 'mica' || value === 'none';
}

/** The material Rust put behind this window; none outside the app and in a window of its own. */
export async function windowMaterial(): Promise<Material> {
    if (!inApp || isSecondaryWindow) return 'none';
    try {
        const m = await invoke<unknown>('window_material');
        return isMaterial(m) ? m : 'none';
    } catch (e) {
        console.error('window material', e);
        return 'none';
    }
}

/**
 * Set the root's data attributes, before the first render (main.tsx awaits it while the window
 * is still hidden, so nothing is drawn on the wrong background).
 */
export async function initChrome(root: HTMLElement = document.documentElement): Promise<void> {
    root.dataset.platform = platformName;
    root.dataset.window = isSecondaryWindow ? 'secondary' : 'main';
    root.dataset.material = await windowMaterial();
    // hidden at this point, so document.hasFocus() is false: active until the window says
    root.dataset.windowActive = 'true';
    if (!inApp) return;
    // the rest follows the window from here on, without holding up the first render
    const win = getCurrentWindow();
    const fail = (e: unknown) => console.error('window state', e);
    // a focus event after the listener is in wins over the answer of the one-off ask below
    let heard = false;
    void win
        .onFocusChanged(({ payload }) => {
            heard = true;
            root.dataset.windowActive = String(payload);
        })
        .then(
            // a window shown without taking focus (started at login with --hidden, or opened
            // behind another app) gets no focus event: ask once for its real state, or it keeps
            // the active look while the OS draws it inactive (spec 1.5)
            () =>
                win.isFocused().then((focused) => {
                    if (!heard) root.dataset.windowActive = String(focused);
                }),
        )
        .catch(fail);
    const fullscreen = () =>
        win.isFullscreen().then((f) => {
            root.dataset.fullscreen = String(f);
        }, fail);
    void win.onResized(() => void fullscreen()).catch(fail);
    void fullscreen();
}

/**
 * Whether this window is the active one and shown, by the same word as its inactive look:
 * `data-window-active` (initChrome follows the window's own focus; the DOM's document.hasFocus()
 * is false while a window is hidden and gets no event for one shown without focus), and the page
 * not hidden. Where nothing set it (a component on its own, in a test), the DOM's focus.
 */
export function isWindowActive(root: HTMLElement = document.documentElement): boolean {
    if (document.visibilityState === 'hidden') return false;
    const said = root.dataset.windowActive;
    return said === undefined ? document.hasFocus() : said === 'true';
}

/** Call `listener` whenever isWindowActive may have changed. */
export function subscribeWindowActive(listener: () => void, root: HTMLElement = document.documentElement): () => void {
    const observer = new MutationObserver(listener);
    observer.observe(root, { attributes: true, attributeFilter: ['data-window-active'] });
    // the fallback's DOM focus, and the page hidden or shown
    window.addEventListener('focus', listener);
    window.addEventListener('blur', listener);
    document.addEventListener('visibilitychange', listener);
    return () => {
        observer.disconnect();
        window.removeEventListener('focus', listener);
        window.removeEventListener('blur', listener);
        document.removeEventListener('visibilitychange', listener);
    };
}

/**
 * Name the window: the page's title and, in the app, the native one, which the Window menu,
 * Mission Control, the Windows caption and screen readers use (macOS draws none of it: the
 * title is hidden). A window of its own gets its title from Rust (windows.rs copies it).
 */
let nativeTitle: string | null = null;

export function setWindowTitle(text: string): void {
    if (document.title !== text) document.title = text;
    // the native title on its own record: a document.title written elsewhere leaves it behind
    if (!inApp || isSecondaryWindow || nativeTitle === text) return;
    nativeTitle = text;
    void getCurrentWindow()
        .setTitle(text)
        .catch((e: unknown) => {
            nativeTitle = null;
            console.error('window title', e);
        });
}

/**
 * The network a window of its own belongs to, by name (or host), set as it starts
 * (secondary.tsx): its title says it as the main window's does ("Lily Carter – UNA Makers").
 */
let ownWindowNetwork = APP_NAME;
export function setOwnWindowNetwork(name: string): void {
    ownWindowNetwork = name || APP_NAME;
}
export function ownWindowTitle(what: string): string {
    return windowTitle(what, ownWindowNetwork);
}

/** "Home – UNA Makers": what is shown, then the network. */
export function windowTitle(what: string, network: string | undefined): string {
    return network ? `${what} – ${network}` : what;
}

/**
 * What the open detail or the page shown is called ("Lily Carter"), for the main window's title:
 * the pane says it (shell/pane.tsx), and the shell names the window after it while it is open.
 * The latest one said wins; when it goes, the one before it (a page under a closed post) is back.
 */
let detailTitles: { token: object; text: string }[] = [];
const detailTitleListeners = new Set<() => void>();

function notifyDetailTitle() {
    for (const l of detailTitleListeners) l();
}

/** The detail pane shows `text`; the function it returns says it no longer does. */
export function showDetailTitle(text: string): () => void {
    const token = {};
    detailTitles = [...detailTitles, { token, text }];
    notifyDetailTitle();
    return () => {
        if (!detailTitles.some((t) => t.token === token)) return;
        detailTitles = detailTitles.filter((t) => t.token !== token);
        notifyDetailTitle();
    };
}

function subscribeDetailTitle(l: () => void): () => void {
    detailTitleListeners.add(l);
    return () => detailTitleListeners.delete(l);
}

export function useDetailTitle(): string | null {
    return useSyncExternalStore(
        subscribeDetailTitle,
        () => detailTitles[detailTitles.length - 1]?.text ?? null,
        () => null,
    );
}

/** The View menu's sidebar item says what Cmd+\ does next (Show or Hide Sidebar). */
export function setSidebarShown(shown: boolean, hidden = false): void {
    if (inApp && !isSecondaryWindow) void invoke<void>('set_sidebar_shown', { shown, hidden }).catch((e: unknown) => console.error('sidebar item', e));
}
