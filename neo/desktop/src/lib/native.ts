/**
 * The Rust side (src-tauri/src/auth.rs) holds the tokens; the web view asks it for a current
 * access token before each request and never sees the refresh token.
 */
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';

import { discover, type Schema } from 'una-api';

import { errorMessage } from './errors';
import { locale, t } from './i18n';

/**
 * The signed-in site and which sign-in it is (auth.rs SessionInfo): a token is asked for with
 * both. `key` is the network's (`site|account`), what the page keys saved data by; the names
 * are for the network list (empty when the app does not know them). `needsSignIn`: the site
 * signed this sign-in out; it stays in the list and the app asks to sign in to it again.
 */
export type Session = { siteUrl: string; generation: number; key?: string; siteName?: string; accountName?: string; needsSignIn?: boolean };

/** A network signed in to (auth.rs SessionSummary); `needsSignIn` as in Session. */
export type SessionSummary = { key: string; siteUrl: string; siteName: string; accountName: string; active: boolean; needsSignIn?: boolean };

/** What the network list says under a network the site signed out. */
export const SIGNED_OUT_TEXT = t('Signed out – sign in again');

/**
 * The site answered 401 to a request of the page's session, or the session was over before the
 * request went out. On a 401 Rust has renewed the session already (the site's clock may be
 * ahead), or kept it in the list as signed out: it never forgets a network the person did not
 * sign out of. Answers the active session as it is now: the same one, signed in, when the page
 * should load again what failed.
 */
export function tokenRefused(): Promise<Session | null> {
    return inApp ? invoke<Session | null>('token_refused') : Promise.resolve(null);
}

/** What is said once a sign-in in the browser has finished: the app is open on that network now. */
export function signedInText(s: Pick<Session, 'siteUrl' | 'siteName' | 'accountName'>): string {
    return t('Signed in to {{network}}', { network: sessionLabel({ siteUrl: s.siteUrl, siteName: s.siteName ?? '', accountName: s.accountName ?? '' }) });
}

/** What the switcher and the menu call a network: its name (or address) and who. */
export function sessionLabel(s: Pick<SessionSummary, 'siteUrl' | 'siteName' | 'accountName'>): string {
    let site = s.siteName;
    if (!site) {
        try {
            site = new URL(s.siteUrl).host;
        } catch {
            site = s.siteUrl;
        }
    }
    return s.accountName ? `${site} – ${s.accountName}` : site;
}

/** The key saved data of a session goes by: its network's, or its site's outside the app. */
export function sessionKey(session: Session): string {
    return session.key ?? `${session.siteUrl.replace(/\/+$/, '')}|`;
}

export const inApp = isTauri();

/**
 * The active session, or null when signed out. The first call reads the keychain (after the
 * window is shown: macOS may ask the person first). It rejects with a message when the keychain
 * could not be read (access denied, locked); calling it again tries again.
 */
export function getSession(): Promise<Session | null> {
    return inApp ? invoke<Session | null>('get_session') : Promise.resolve(null);
}

/** The session is still the one the page has. */
export function sameSession(a: Session | null, b: Session): boolean {
    return !!a && a.siteUrl === b.siteUrl && a.generation === b.generation;
}

/** The desktop app's public OAuth client, built into UNA's OAuth module (known while API v2 is on). */
export const OAUTH_CLIENT_ID = 'una-desktop';

export function signIn(siteUrl: string, info: Schema<'ApiInfo'>): Promise<Session> {
    const oauth = info.oauth;
    if (!oauth) return Promise.reject(new Error(t("{{name}} has no OAuth 2 server, so apps can't sign in to it", { name: info.name })));
    return invoke<Session>('sign_in', {
        request: {
            siteUrl,
            authorizationEndpoint: oauth.authorization_endpoint,
            tokenEndpoint: oauth.token_endpoint,
            revocationEndpoint: oauth.revocation_endpoint,
            clientId: OAUTH_CLIENT_ID,
            scope: oauth.scope,
            siteName: info.branding?.name || info.name,
        },
    });
}

/** The networks signed in to, in the order they were added (Cmd+Ctrl+1 is the first). */
export function listSessions(): Promise<SessionSummary[]> {
    return inApp ? invoke<SessionSummary[]>('list_sessions') : Promise.resolve([]);
}

/** Make another network the active one; its session from then on. */
export function switchSession(key: string): Promise<Session> {
    return invoke<Session>('switch_session', { key });
}

/**
 * The open network's name, asked of its site because its sign-in kept none (one of an older
 * version): Rust keeps it for the Window menu and the session list (auth.rs name_network,
 * which fills only an empty name of the active network).
 */
export function nameNetwork(key: string, name: string): Promise<void> {
    return inApp ? invoke<void>('name_network', { key, name }) : Promise.resolve();
}

/** Stop waiting for the browser: the pending sign_in rejects with "Sign-in was cancelled". */
export function cancelSignIn(): Promise<void> {
    return inApp ? invoke<void>('cancel_sign_in') : Promise.resolve();
}

/**
 * What a site is and how to sign in (GET /api/v2). In the app Rust fetches it: the web view
 * may only reach the site it is signed in to, so before sign-in it has no network at all.
 */
export function discoverSite(siteUrl: string): Promise<Schema<'ApiInfo'>> {
    return inApp ? invoke<Schema<'ApiInfo'>>('discover_site', { siteUrl }) : discover(siteUrl);
}

/**
 * Sign out of the network of this session. Another one signed in to becomes active and is
 * answered (null when there is none). When another session is active by now (a request of the
 * one before failed after a switch), nothing is signed out and that one is answered.
 */
export function signOut(session?: Session): Promise<Session | null> {
    return inApp ? invoke<Session | null>('sign_out', { generation: session?.generation ?? null }) : Promise.resolve(null);
}

/**
 * Open a link in the system browser: the app window only ever shows the app. Rejects with a
 * message a person can read when the link could not be opened.
 */
export async function openExternal(url: string): Promise<void> {
    if (!/^https?:\/\//i.test(url)) throw new Error(t('Only web links can be opened'));
    if (!inApp) {
        window.open(url, '_blank', 'noopener');
        return;
    }
    try {
        await openUrl(url);
    } catch (e) {
        throw new Error(t('Could not open the link in the browser: {{reason}}', { reason: errorMessage(e) }));
    }
}

/**
 * Put text on the clipboard (Copy Link). In the app through the clipboard plugin: a click in a
 * native menu carries no user activation into the page, which navigator.clipboard needs.
 */
export async function copyText(text: string): Promise<void> {
    if (inApp) {
        await invoke<void>('plugin:clipboard-manager|write_text', { text });
        return;
    }
    await navigator.clipboard.writeText(text);
}

/**
 * Opens a link in the app instead, when it can: true when it did. A link to the signed-in site
 * that shows a post, profile, group or conversation opens there (GET /links/resolve).
 */
export type LinkOpener = (href: string) => Promise<boolean>;

/**
 * Links clicked anywhere in the app: the app's own place for a site link when `inApp()` has
 * one, the browser otherwise; failures go to onError.
 */
export function captureLinks(onError: (message: string) => void, inAppOpener: () => LinkOpener | null = () => null): () => void {
    const onClick = (e: MouseEvent) => {
        const a = (e.target as Element | null)?.closest?.('a[href]');
        if (!a) return;
        const href = a.getAttribute('href') ?? '';
        if (!/^https?:\/\//i.test(href)) return;
        e.preventDefault();
        const opener = inAppOpener();
        void (opener ? opener(href).catch(() => false) : Promise.resolve(false)).then((opened) => {
            if (!opened) openExternal(href).catch((err: unknown) => onError(errorMessage(err)));
        });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
}

/**
 * The page has drawn: Rust shows the main window, which starts hidden so the person never sees
 * an empty white frame, unless the app started at login with --hidden (tray.rs page_ready).
 * Rust shows it anyway after 3 s (src-tauri/src/lib.rs). `evenHidden` shows it after such a
 * start too (the keychain could not be read: its alert must be seen).
 */
export async function showWindow(evenHidden = false): Promise<void> {
    if (!inApp) return;
    try {
        await invoke<void>('page_ready', evenHidden ? { evenHidden } : undefined);
    } catch (e) {
        console.error('show window', e);
    }
}

/**
 * The menu's Back and Forward are off when there is nothing to go back or forward to, and Open in
 * New Window while nothing open goes in a window of its own (macOS; menu.rs). `newTask` (the main
 * window): Cmd+N adds a task to the list shown, and File > New Post says New Task.
 */
export function setNavState(back: boolean, forward: boolean, openInWindow = false, newTask = false): void {
    if (inApp) void invoke<void>('set_nav_state', { back, forward, openInWindow, newTask }).catch((e: unknown) => console.error('nav state', e));
}

/** The Tauri event that tells the main window una:// links are waiting (deep_link.rs). */
export const DEEP_LINK_EVENT = 'deep-link';

/** The una:// links that came (the one the app started with among them), taken once. */
export function takeDeepLinks(): Promise<string[]> {
    return inApp ? invoke<string[]>('take_deep_links') : Promise.resolve([]);
}

/**
 * Ask the poller (src-tauri/src/sync.rs) to sync now, in the page's language; it answers the
 * last sync it had (null outside the app or before the first one).
 */
export function syncNow<T>(): Promise<T | null> {
    return inApp ? invoke<T | null>('sync_now', { language: locale() }) : Promise.resolve(null);
}

/**
 * Ask before something that can't be undone (a delete). In the app it is the system's own
 * dialog (the dialog plugin's ask(): a sheet that keeps the keyboard until answered and gives
 * focus back to the window); in a plain browser, window.confirm.
 */
export async function confirmAction({ title, message, okLabel }: { title: string; message: string; okLabel: string }): Promise<boolean> {
    if (!inApp) return window.confirm(`${title}\n\n${message}`);
    return ask(message, { title, kind: 'warning', okLabel, cancelLabel: t('Cancel') });
}

/**
 * The route this window was opened for when it is a window of its own (src-tauri/src/windows.rs
 * puts it in the address's fragment: `#window=%2Fmessages%2Fconversation%2F7`), null in the main window.
 */
export function windowRoute(hash: string = typeof location === 'undefined' ? '' : location.hash): string | null {
    if (!hash.startsWith('#')) return null;
    const route = new URLSearchParams(hash.slice(1)).get('window');
    return route && route.startsWith('/') && !route.startsWith('//') ? route : null;
}

/** This page is a window of its own (a conversation, post, profile or group), not the main window. */
export const isSecondaryWindow = windowRoute() !== null;

/**
 * Open a route (routeToPath) in a window of its own, or bring forward the one that shows it.
 * Only the main window may (capabilities/secondary.json does not grant open_window). Outside
 * the app, a browser tab with the same page.
 */
export async function openWindow(route: string): Promise<void> {
    if (!inApp) {
        window.open(`${location.pathname}#window=${encodeURIComponent(route)}`, '_blank', 'noopener');
        return;
    }
    await invoke<void>('open_window', { route });
}

/**
 * Close this window as the person does (a Close button in a window of its own): a form in it
 * with unsaved changes is asked about first (guardWindowClose).
 */
export function closeThisWindow(): void {
    if (inApp) void getCurrentWindow().close().catch((e: unknown) => console.error('close window', e));
    else window.close();
}

/**
 * Close this window as the person did, once what it showed is gone (Esc, the pane's Close): any
 * question was answered before that (the history's guard), so none is asked again. The page
 * stops listening for close requests first, and only then closes: an ordinary close, which the
 * window hears itself (WindowEvent::CloseRequested), so where and how it stood is remembered
 * (the window-state plugin keeps maximized and full screen then, and destroy() would skip it).
 */
export async function closeThisWindowAsked(): Promise<void> {
    if (!inApp) {
        window.close();
        return;
    }
    try {
        await unwatchClose();
        await getCurrentWindow().close();
    } catch (e) {
        console.error('close window', e);
    }
}

/**
 * Close this window whatever is in it, asking nothing: its session is over (a refused token,
 * another sign-in), so no answer could keep it. destroy() never reaches the page's close listener.
 */
export function forceCloseThisWindow(): void {
    if (inApp) void getCurrentWindow().destroy().catch((e: unknown) => console.error('close window', e));
    else window.close();
}

const closeQuestions = new Set<() => Promise<boolean>>();
/** The listener for close requests, while a question is there to ask: what stops it, once it listens. */
let closeWatch: Promise<() => void> | null = null;

function watchClose(): void {
    if (closeWatch) return;
    const watch = getCurrentWindow().onCloseRequested(async (event) => {
        for (const ask of [...closeQuestions]) {
            // one that went while another was open is not asked
            if (!closeQuestions.has(ask)) continue;
            let leave = false;
            try {
                leave = await ask();
            } catch (e) {
                console.error('close question', e);
            }
            if (leave) continue;
            event.preventDefault();
            return;
        }
    });
    closeWatch = watch;
    watch.catch((e: unknown) => {
        if (closeWatch === watch) closeWatch = null;
        console.error('close requests', e);
    });
}

/** Stop listening for close requests: settled once Rust no longer hands a close to the page. */
function unwatchClose(): Promise<void> {
    const watch = closeWatch;
    if (!watch) return Promise.resolve();
    closeWatch = null;
    return watch.then(
        // what stops it answers once the listener is gone in Rust too (the event API's unlisten)
        async (stop) => {
            const stopped: unknown = stop();
            await stopped;
        },
        () => undefined,
    );
}

/**
 * Ask before this window goes while something in it is unsaved (lib/leave-guard.ts), until the
 * returned function is called; `confirm` answers true to let it go. A window of its own asks
 * when the person closes it (its close button, Cmd+W, closeThisWindow): while a listener is
 * there Tauri hands every close() to the page, which closes the window itself when no answer
 * refuses (the window API's onCloseRequested then destroys it). The listener is there only
 * while a question is, so a window with nothing unsaved closes as any other does; a close that
 * must not be asked about (the session is over: windows.rs close_all, forceCloseThisWindow)
 * destroys the window and never reaches it, and one whose question was answered already
 * (closeThisWindowAsked) stops the listener first. The main window is not asked: its close is Rust's
 * (it hides to the tray, or the app quits: lib.rs). In a plain browser the tab warns before it
 * unloads, in the browser's own words.
 */
export function guardWindowClose(confirm: () => Promise<boolean>): () => void {
    if (!inApp) {
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }
    if (!isSecondaryWindow) return () => {};
    closeQuestions.add(confirm);
    watchClose();
    return () => {
        closeQuestions.delete(confirm);
        if (!closeQuestions.size) void unwatchClose().catch((e: unknown) => console.error('close requests', e));
    };
}

/** What a download did: saved under this name, or nothing (the person cancelled the dialog). */
export type Saved = { saved: boolean; name: string };

/** A download that failed: the site's status (0 when it was not reached) and a code. */
export class DownloadError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code: string,
    ) {
        super(message);
        this.name = 'DownloadError';
    }
}

/**
 * Save a file the network gives (a Files entry's `media.download_url`): in the app, Rust asks
 * where in the system's save dialog and writes it there (download.rs; the page gets no file
 * system permission), for the page's session only; in a browser tab, the browser downloads it.
 */
export async function saveDownload(url: string, name: string, session: Session | undefined, onProgress?: (received: number, total: number) => void): Promise<Saved> {
    if (!inApp) {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.rel = 'noopener';
        a.click();
        return { saved: true, name };
    }
    if (!session) throw new DownloadError(t('Sign in to download'), 401, 'session_over');
    const channel = new Channel<{ received: number; total: number }>();
    channel.onmessage = (p) => onProgress?.(p.received, p.total);
    try {
        return await invoke<Saved>('save_download', { url, name, siteUrl: session.siteUrl, generation: session.generation, onProgress: channel });
    } catch (e) {
        if (e && typeof e === 'object' && 'message' in e) {
            const o = e as { message: unknown; status?: unknown; code?: unknown };
            throw new DownloadError(String(o.message), typeof o.status === 'number' ? o.status : 0, typeof o.code === 'string' ? o.code : 'error');
        }
        throw new DownloadError(typeof e === 'string' ? e : t('The download failed'), 0, 'error');
    }
}
