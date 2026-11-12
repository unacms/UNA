import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import type { Schema } from 'una-api';

import { MenuHost } from './components/menu-popover';
import { ownWindowTitle, setOwnWindowNetwork } from './lib/chrome';
import { Splash } from './components/splash';
import { AnnounceContext } from './lib/announce';
import { makeApi, unwrap } from './lib/api';
import { useReloadWhenApiBack } from './lib/api-availability';
import { useSiteAccent } from './lib/branding';
import { MENU_EVENT } from './lib/command-bus';
import { AppContext, type AppContextValue, useApp } from './lib/context';
import { errorMessage } from './lib/errors';
import { t } from './lib/i18n';
import { makeLinkOpener } from './lib/link-opener';
import { captureLinks, closeThisWindow, closeThisWindowAsked, forceCloseThisWindow, getSession, inApp, type LinkOpener, sameSession, type Session, setNavState, tokenRefused } from './lib/native';
import { RouterProvider, useNavigation, useRoute } from './lib/navigation';
import { platform } from './lib/platform';
import { parseRoute, type Route, RouteHistory, ScrollMemory } from './lib/router';
import { isEditable } from './lib/shortcuts';
import { useSiteModules } from './lib/site-modules';
import { useAnnouncer } from './features/feed/feed-list';
import { DetailPane } from './shell/detail-pane';
import { APP_NAME } from './lib/brand';

/** What a window of its own shows, by the route it was opened for (null for one that is not a detail). */
export function secondaryRoute(path: string): Route | null {
    const route = parseRoute(path);
    return route?.detail ? route : null;
}

const TITLES: Record<string, string> = { conversation: t('Conversation'), post: t('Post'), discussion: t('Discussion'), video: t('Video'), photo: t('Photo'), album: t('Album'), file: t('File'), task: t('Task'), poll: t('Poll'), article: t('Post'), profile: t('Profile'), group: t('Group'), space: t('Space'), event: t('Event') };

/** The commands of the menu bar (menu.rs) that act on a window of its own; Rust sends the others to the main window. */
export const SECONDARY_COMMANDS = ['back', 'forward', 'refresh'] as const;
type SecondaryCommand = (typeof SECONDARY_COMMANDS)[number];
const isSecondaryCommand = (id: unknown): id is SecondaryCommand => (SECONDARY_COMMANDS as readonly unknown[]).includes(id);

/**
 * A window of its own (src-tauri/src/windows.rs): one conversation, post, discussion, video, photo, album, file, profile, group, space or event, as
 * the detail pane shows it, under the main window's sign-in. It reads and replies; Back, Forward
 * and links stay inside it, and closing what it shows (Esc, the Close button) closes the window.
 * Its capability (capabilities/secondary.json) leaves out sign-in and sign-out, new windows,
 * events it could send to the main window, the tray, the menu and notifications. It belongs to
 * the session it opened under: Rust closes it at sign-out and at the next sign-in, its token is
 * that session's only (lib/api.ts makeApi), and it closes itself when it finds another session.
 */
export function SecondaryApp({ path }: { path: string }) {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [linkError, setLinkError] = useState<string | null>(null);
    const route = secondaryRoute(path);

    useEffect(() => {
        void getSession().then(setSession, () => setSession(null));
    }, []);

    if (!route) return <Notice text={t('This window has nothing to show.')} />;
    if (session === undefined) return <Splash text={t('Loading…')} />;
    if (!session) return <Notice text={t('Sign in from the main window, then open this again.')} />;
    return (
        <>
            {linkError ? (
                <div className="banner" role="alert">
                    <span>{linkError}</span>
                    <button className="btn btn-quiet small" onClick={() => setLinkError(null)}>
                        {t('Dismiss')}
                    </button>
                </div>
            ) : null}
            <SecondarySignedIn session={session} route={route} onLinkError={setLinkError} />
        </>
    );
}

function hostOf(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

function Notice({ text }: { text: string }) {
    return (
        <main className="center-page">
            <p className="muted">{text}</p>
            <button className="btn" onClick={closeThisWindow}>
                {t('Close window')}
            </button>
        </main>
    );
}

function SecondarySignedIn({ session, route, onLinkError }: { session: Session; route: Route; onLinkError: (message: string) => void }) {
    // signed out in the main window meanwhile, or by the site: this window has nothing left to
    // show, and goes without asking about anything unsaved in it. A refused token renewed at once (native.ts tokenRefused) keeps it open and loads again.
    const refusedQueries = useQueryClient();
    const api = useMemo(
        () =>
            makeApi(session, () => {
                void tokenRefused().then(
                    (next) => {
                        if (!next || !sameSession(next, session) || next.needsSignIn) forceCloseThisWindow();
                        else void refusedQueries.invalidateQueries({ predicate: (q) => q.state.status === 'error' });
                    },
                    () => undefined,
                );
            }),
        [session, refusedQueries],
    );
    // a profile or group stays the detail this window shows (the main window opens them as pages)
    const [history] = useState(() => new RouteHistory(route, undefined, (r) => r));
    const [scroll] = useState(() => new ScrollMemory());
    const me = useQuery({ queryKey: ['me'], queryFn: async () => unwrap(await api.GET('/me')) });
    // the network's API was turned off and answers again (Rust tells every window): what this
    // window shows loads again, its "could not load" screen included
    useReloadWhenApiBack(session.siteUrl);

    if (me.isError) {
        return (
            <main className="center-page">
                <p className="error" role="alert">
                    {errorMessage(me.error)}
                </p>
                <button className="btn btn-primary" onClick={() => void me.refetch()} disabled={me.isFetching} aria-busy={me.isFetching}>
                    {t('Try again')}
                </button>
            </main>
        );
    }
    if (!me.data) return <div className="splash" aria-busy="true" />;

    const ctx: AppContextValue = {
        api,
        siteUrl: session.siteUrl,
        me: me.data,
        // only the main window signs out
        signOut: () => undefined,
        signingOut: false,
        messageTo: (profile: Schema<'Profile'>) => history.push({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: profile.id } }),
    };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history} scroll={scroll}>
                <SecondaryWindow session={session} onLinkError={onLinkError} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

function SecondaryWindow({ session, onLinkError }: { session: Session; onLinkError: (message: string) => void }) {
    const { api } = useApp();
    const siteUrl = session.siteUrl;
    // named as the main window names it, "Sofia Marchetti – UNA Makers" (idempotent: before any title effect runs)
    setOwnWindowNetwork(session.siteName?.trim() || hostOf(siteUrl));
    useSiteAccent();
    // the modules the site has: a space in this window opens through its own paths
    useSiteModules();
    const route = useRoute();
    const { history } = useNavigation();

    // closed (Esc, Close): the window goes. Unsaved changes in it were asked about before the
    // detail went (the history's guard), so this close asks nothing; it is still an ordinary
    // close, so the window's place and size are kept as for its close button
    useEffect(() => {
        if (!route.detail) void closeThisWindowAsked();
    }, [route.detail]);

    // until the detail names itself (shell/pane.tsx; its effect runs after this one)
    useLayoutEffect(() => {
        document.title = ownWindowTitle(TITLES[route.detail?.kind ?? ''] ?? APP_NAME);
    }, [route.detail?.kind]);

    // back to this window: still the session it opened under? (a sign-out or another sign-in
    // closes it from Rust too; this covers a window that missed that). Nothing unsaved in it
    // can be saved under another session, so it goes without a question
    useEffect(() => {
        const check = () =>
            void getSession().then(
                (now) => {
                    if (!sameSession(now, session)) forceCloseThisWindow();
                },
                () => undefined,
            );
        window.addEventListener('focus', check);
        return () => window.removeEventListener('focus', check);
    }, [session]);

    // the menu bar's Back and Forward follow this window's history while it has focus (menu.rs)
    useEffect(() => {
        const show = () => setNavState(history.canGoBack, history.canGoForward);
        show();
        return history.subscribe(show);
    }, [history]);

    // the menu bar's Back, Forward and Refresh while this window has focus (menu.rs sends them here)
    const queryClient = useQueryClient();
    const [announcement, announce] = useAnnouncer();
    const runMenu = useCallback(
        (id: SecondaryCommand) => {
            if (id === 'back') history.back();
            else if (id === 'forward') history.forward();
            else {
                announce(t('Refreshing…'));
                void queryClient.refetchQueries({ type: 'active' }, { throwOnError: true }).then(
                    () => announce(t('Up to date')),
                    () => announce(t('Could not refresh')),
                );
            }
        },
        [history, queryClient, announce],
    );
    useEffect(() => {
        if (!inApp) return;
        let stopped = false;
        let unlisten: (() => void) | null = null;
        void listen<string>(MENU_EVENT, (event) => {
            if (isSecondaryCommand(event.payload)) runMenu(event.payload);
        }).then(
            (fn) => {
                if (stopped) fn();
                else unlisten = fn;
            },
            (e: unknown) => console.error('menu events', e),
        );
        return () => {
            stopped = true;
            unlisten?.();
        };
    }, [runMenu]);

    // site links open here (a post, a profile...), others in the browser
    useEffect(() => {
        let opener: LinkOpener | null = makeLinkOpener(api, siteUrl, (detail) => history.push({ list: history.current.list, detail }));
        const stop = captureLinks(onLinkError, () => opener);
        return () => {
            opener = null;
            stop();
        };
    }, [api, siteUrl, history, onLinkError]);

    // the few keys a window of its own has: Esc closes what it shows, Cmd+[ and Cmd+] go back and forward
    const onKey = useCallback(
        (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.isComposing || document.querySelector('dialog[open]')) return;
            const mod = platform.mac ? e.metaKey : e.ctrlKey;
            if (e.key === 'Escape' && !isEditable(e.target)) {
                e.preventDefault();
                history.push({ list: history.current.list, detail: null });
            } else if (mod && e.code === 'BracketLeft') {
                e.preventDefault();
                history.back();
            } else if (mod && e.code === 'BracketRight') {
                e.preventDefault();
                history.forward();
            }
        },
        [history],
    );
    useEffect(() => {
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onKey]);

    return (
        <AnnounceContext.Provider value={announce}>
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            <main className="secondary-window">{route.detail ? <DetailPane route={route} /> : null}</main>
            <MenuHost />
        </AnnounceContext.Provider>
    );
}

