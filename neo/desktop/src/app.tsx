import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import type { Schema } from 'una-api';

import { ShortcutsDialog, type ShortcutsDialogHandle } from './components/shortcuts-dialog';
import { UpdateDialog } from './components/update-dialog';
import { Splash } from './components/splash';
import { AnnounceContext } from './lib/announce';
import { makeApi, type Refusal, unwrap } from './lib/api';
import { useReloadWhenApiBack, useRetryWithCheck } from './lib/api-availability';
import { listenForCommands } from './lib/command-bus';
import { AppContext, type AppContextValue, useApp } from './lib/context';
import { deepLinkTarget, parseDeepLink } from './lib/deep-link';
import { TabsProvider, useNavigation } from './lib/navigation';
import {
    captureLinks,
    DEEP_LINK_EVENT,
    getSession,
    inApp,
    type LinkOpener,
    listSessions,
    openExternal,
    sameSession,
    sessionKey,
    sessionLabel,
    signedInText,
    type SessionSummary,
    setNavState,
    showWindow,
    signOut as nativeSignOut,
    switchSession,
    syncNow,
    takeDeepLinks,
    tokenRefused,
    type Session,
} from './lib/native';
import { forgetFailures } from './lib/media';
import { setWindowTitle } from './lib/chrome';
import { errorMessage } from './lib/errors';
import { t, tn } from './lib/i18n';
import { opensInWindow } from './lib/open-in-window';
import { cacheStore, type CachePersister, persistCache, removeCache, restoreCache } from './lib/persist';
import { dragRegion, overlayTitleBar, platform } from './lib/platform';
import { pageDetail, type Route, sectionRoute } from './lib/router';
import { TabsModel, tabsStorageKey } from './lib/tabs';
import { appSettings, chooseTheme } from './lib/settings';
import { appUpdates, scheduleChecks, updatesAvailable } from './lib/updates';
import { setSiteModules, useSiteHasTag } from './lib/site-modules';
import { networkNumber, type CommandId } from './lib/shortcuts';
import type { Notification } from './lib/sync';
import { SyncProvider, useSync } from './lib/sync-provider';
import { makeLinkOpener } from './lib/link-opener';
import { sectionIcon } from './lib/section-icons';
import { themeAnnouncement, type Theme } from './lib/theme';
import { useAnnouncer } from './features/feed/feed-list';
import { useNotificationActions } from './features/notifications/actions';
import { subscribeTaskAddShown, taskAddShown } from './features/tasks/tasks';
import { profileSummaryKey } from './screens/conversation';
import { SignIn } from './screens/sign-in';
import { type CommandHandler, Shell } from './shell/shell';
import type { NavItem } from './shell/sidebar';
import { useHasDiscussions } from './features/discussions/discussions';
import { APP_NAME, ISSUES_URL } from './lib/brand';


const THEME_COMMANDS: Partial<Record<CommandId, Theme>> = { 'theme-system': 'system', 'theme-light': 'light', 'theme-dark': 'dark' };

/**
 * Why the keychain read failed: Rust's message (auth.rs `keychain_error`) without the sentence
 * the alert already says. Rust says it from the same language file, so the sentence around the
 * reason is this one.
 */
function keychainReason(error: string): string {
    const [before = '', after = ''] = t("{{app}} couldn't read your sign-in from the keychain: {{reason}}", { app: APP_NAME, reason: '\u0001' }).split('\u0001');
    if (before && error.startsWith(before) && error.endsWith(after)) return error.slice(before.length, error.length - after.length);
    return error.replace(/^UNA couldn[’']t read your sign-in from the keychain[:.]?\s*/i, '');
}

/** On macOS the page draws under the title bar; screens without a header drag the window from this strip. */
function WindowDrag() {
    return overlayTitleBar ? <div className="window-drag" {...dragRegion} /> : null;
}

/** The SignedIn of a session: another network or another sign-in starts it over. */
function sessionId(s: Session): string {
    return `${sessionKey(s)}#${s.generation}`;
}

export function App() {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    // signing in to another network while one is open
    const [adding, setAdding] = useState(false);
    // where the next session opens (a una:// link of another network)
    const [openAt, setOpenAt] = useState<Route | null>(null);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [status, setStatus] = useState('');
    const shell = useRef<CommandHandler | null>(null);
    const shortcuts = useRef<ShortcutsDialogHandle>(null);
    // site links that open in the app while signed in (SignedIn sets it)
    const links = useRef<LinkOpener | null>(null);
    // the open session's saving of what was read (SignedIn sets it), and its navigation
    const persister = useRef<CachePersister | null>(null);
    const navigateTo = useRef<((route: Route) => void) | null>(null);
    const current = useRef<{ session: Session | null | undefined; sessions: SessionSummary[]; adding: boolean }>({ session: undefined, sessions: [], adding: false });
    const queryClient = useQueryClient();

    useEffect(() => {
        current.current = { session, sessions, adding };
    }, [session, sessions, adding]);

    const setNavigator = useCallback((go: ((route: Route) => void) | null, of?: (route: Route) => void) => {
        if (go) navigateTo.current = go;
        else if (navigateTo.current === of) navigateTo.current = null;
    }, []);

    const refreshSessions = useCallback(() => {
        void listSessions().then(setSessions, () => setSessions([]));
    }, []);

    // the keychain could not be read (access denied, locked): signed out here, nothing deleted
    const [keychainError, setKeychainError] = useState<string | null>(null);
    // failed reads so far: the alert is drawn again for each, so each failure is announced
    const [keychainFailures, setKeychainFailures] = useState(0);
    const [retrying, setRetrying] = useState(false);
    const loadSession = useCallback(async () => {
        try {
            const found = await getSession();
            setKeychainError(null);
            setKeychainFailures(0);
            setSession(found);
            refreshSessions();
        } catch (e) {
            setKeychainError(keychainReason(errorMessage(e)));
            setKeychainFailures((n) => n + 1);
            setSession(null);
            // Started at login (--hidden), the window is still closed: the read happened without
            // one, and its alert must be seen (the sync waits for a good read, so nothing else
            // would say anything). Opened normally, the window is up already.
            void showWindow(true);
        }
    }, [refreshSessions]);

    // The window starts hidden (no white flash) and is shown once the first render is committed,
    // the "Signing in…" splash. Only then is the sign-in read: the keychain may ask the person
    // first, and its prompt must have a window to belong to (src-tauri/src/auth.rs). Not from
    // requestAnimationFrame: a hidden web view may never run frames, so the show would wait for
    // lib.rs's fallback. The window and page backgrounds match, so nothing flashes.
    useEffect(() => {
        void (async () => {
            await showWindow();
            await loadSession();
        })();
        return captureLinks(setLinkError, () => links.current);
    }, [loadSession]);

    const retryKeychain = useCallback(() => {
        if (retrying) return;
        setRetrying(true);
        void loadSession().finally(() => setRetrying(false));
    }, [loadSession, retrying]);

    // the window title names the screen; Shell names the section once signed in
    useEffect(() => {
        if (session === null || session?.needsSignIn) setWindowTitle(t('Sign in – {{app}}', { app: APP_NAME }));
        else if (session === undefined) setWindowTitle(APP_NAME);
    }, [session]);
    // Add network: the open network stays mounted under the sign-in screen (its place,
    // history and links); Back or Cancel gives it its title and the focus it had again
    useEffect(() => {
        if (!adding) return;
        const title = document.title;
        const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setWindowTitle(t('Sign in – {{app}}', { app: APP_NAME }));
        return () => {
            setWindowTitle(title);
            // after the commit, once the network is shown (no longer inert) again
            if (focused) queueMicrotask(() => focused.isConnected && focused.focus());
        };
    }, [adding]);

    /** Leave the open session's data: saved first when it stays signed in (a switch), then dropped from memory. */
    const leaveSession = useCallback(
        async (save: boolean) => {
            const p = persister.current;
            persister.current = null;
            if (p && save) await p.flush();
            p?.stop();
            queryClient.clear();
            // the next network says which modules it has; until then contexts open as groups
            setSiteModules(null);
        },
        [queryClient],
    );

    // one switch or sign-out at a time
    const [busy, setBusy] = useState<'switching' | 'signing-out' | null>(null);
    const busyRef = useRef(false);

    const switchTo = useCallback(
        (key: string, route?: Route) => {
            const { session: now, sessions: list } = current.current;
            if (now && sessionKey(now) === key) {
                setAdding(false);
                if (route) navigateTo.current?.(route);
                return;
            }
            if (busyRef.current) return;
            busyRef.current = true;
            setBusy('switching');
            const target = list.find((s) => s.key === key);
            void switchSession(key)
                .then(async (next) => {
                    await leaveSession(true);
                    setOpenAt(route ?? null);
                    setAdding(false);
                    setSession(next);
                    setStatus(target ? t('Switched to {{name}}', { name: sessionLabel(target) }) : t('Switched to the network'));
                    void syncNow().catch(() => null);
                })
                .catch((e: unknown) => setLinkError(errorMessage(e)))
                .finally(() => {
                    busyRef.current = false;
                    setBusy(null);
                    refreshSessions();
                });
        },
        [leaveSession, refreshSessions],
    );

    /** Sign out of a session's network: only while it is still the open one. */
    const signOutOf = useCallback(
        (of: Session) => {
            if (busyRef.current || !sameSession(current.current.session ?? null, of)) return;
            busyRef.current = true;
            setBusy('signing-out');
            const key = sessionKey(of);
            // nothing of it is saved from here on, and what was saved goes
            persister.current?.stop();
            persister.current = null;
            void nativeSignOut(of)
                .catch(() => null)
                .then(async (next) => {
                    queryClient.clear();
                    setSiteModules(null);
                    await removeCache(cacheStore, key).catch(() => undefined);
                    setOpenAt(null);
                    setSession(next);
                    if (next) setStatus(t('Signed out. Now in {{name}}', { name: sessionLabel({ siteUrl: next.siteUrl, siteName: next.siteName ?? '', accountName: next.accountName ?? '' }) }));
                    // the badge and tray go blank at once
                    void syncNow().catch(() => null);
                })
                .finally(() => {
                    busyRef.current = false;
                    setBusy(null);
                    refreshSessions();
                });
        },
        [queryClient, refreshSessions],
    );

    // A request the site answered 401, or one whose session was over. Never a sign-out by itself:
    // Rust renews the session at once (the site's clock may run ahead), and what failed loads
    // again; when the site refuses that too, the network stays in the list, signed out, and its
    // sign-in screen asks to sign in again. Requests that fail together ask once.
    const asking = useRef(new Set<string>());
    const refusedIn = useCallback(
        (of: Session, why: Refusal) => {
            const id = `${sessionId(of)}|${why}`;
            if (asking.current.has(id) || busyRef.current) return;
            asking.current.add(id);
            void tokenRefused()
                .then(async (next) => {
                    // switched or signed out meanwhile: that one is over already
                    if (busyRef.current || !sameSession(current.current.session ?? null, of)) return;
                    if (next && sameSession(next, of) && !next.needsSignIn) {
                        await queryClient.invalidateQueries({ predicate: (q) => q.state.status === 'error' });
                        return;
                    }
                    await leaveSession(true);
                    setOpenAt(null);
                    setSession(next);
                    if (next?.needsSignIn) setStatus(t('{{name}}: signed out by the network. Sign in again.', { name: sessionLabel({ siteUrl: next.siteUrl, siteName: next.siteName ?? '', accountName: next.accountName ?? '' }) }));
                })
                // the site could not be reached: nothing changed, what failed says so
                .catch((e: unknown) => console.error('token refused', e))
                .finally(() => {
                    asking.current.delete(id);
                    refreshSessions();
                });
        },
        [leaveSession, queryClient, refreshSessions],
    );

    const onSignedIn = useCallback(
        (next: Session) => {
            // the network open under the sign-in screen is over now: a request of it that
            // finds its session gone signs nothing out meanwhile (signOutOf waits on busy)
            busyRef.current = true;
            void leaveSession(true)
                .then(() => {
                    setOpenAt(null);
                    setAdding(false);
                    setSession(next);
                    // the browser had the person (Rust brings the window forward): say where they are now
                    setStatus(signedInText(next));
                })
                .finally(() => {
                    busyRef.current = false;
                    refreshSessions();
                });
        },
        [leaveSession, refreshSessions],
    );

    // una:// links (src-tauri/src/deep_link.rs): a place in this network or another signed in to
    const openLink = useCallback(
        (link: string) => {
            const parsed = parseDeepLink(link);
            if (!parsed) {
                setLinkError(t('That link does not open anything in the app'));
                return;
            }
            const { session: now, sessions: list } = current.current;
            // with no network open, a link naming one still signed in switches to it
            const target = deepLinkTarget(parsed, list, now?.siteUrl ?? '');
            if (!now && target.kind === 'here') {
                setLinkError(t('Sign in to open that link'));
                return;
            }
            if (target.kind === 'here') {
                setAdding(false);
                navigateTo.current?.(target.route);
            } else if (target.kind === 'switch') switchTo(target.key, target.route);
            else setLinkError(t('Sign in to {{site}} to open that link', { site: target.site }));
        },
        [switchTo],
    );
    const waitingLinks = useRef<string[]>([]);
    useEffect(() => {
        if (!inApp) return;
        let stopped = false;
        let unlisten: (() => void) | null = null;
        const take = () => {
            void takeDeepLinks().then((list) => {
                // before the session is known, they wait for it
                if (current.current.session === undefined) waitingLinks.current.push(...list);
                else list.forEach((link) => openLink(link));
            });
        };
        take();
        void listen(DEEP_LINK_EVENT, take).then((fn) => {
            if (stopped) fn();
            else unlisten = fn;
        });
        return () => {
            stopped = true;
            unlisten?.();
        };
    }, [openLink]);
    useEffect(() => {
        if (session === undefined || !waitingLinks.current.length) return;
        const list = waitingLinks.current;
        waitingLinks.current = [];
        list.forEach(openLink);
    }, [session, openLink]);

    // menu items, shortcuts, mouse buttons and the command palette
    const runCommand = useCallback(
        (id: CommandId) => {
            if (id === 'show-shortcuts') {
                setShortcutsOpen(true);
                return;
            }
            // A menu item chosen while the sheet is open acts on the window behind it. The
            // sheet closes first, at once and without restoring focus, so the page is no
            // longer inert when the command moves focus, and the restore does not undo it.
            shortcuts.current?.dismiss();
            setShortcutsOpen(false);
            if (id === 'check-updates') {
                void appUpdates.check({ manual: true });
                return;
            }
            if (id === 'report-issue') {
                void openExternal(ISSUES_URL).catch((e: unknown) => setLinkError(errorMessage(e)));
                return;
            }
            const theme = THEME_COMMANDS[id];
            if (theme) {
                void chooseTheme(theme).catch((e: unknown) => console.error('theme', e));
                setStatus(themeAnnouncement(theme));
                return;
            }
            const n = networkNumber(id);
            if (n !== null) {
                const target = current.current.sessions[n - 1];
                if (target) switchTo(target.key);
                else setStatus(t('No network {{n}}: add one from the File menu', { n }));
                return;
            }
            if (id === 'add-network') {
                if (current.current.session) setAdding(true);
                return;
            }
            // the open network waits under the sign-in screen: its commands wait too
            if (current.current.adding) return;
            shell.current?.(id);
        },
        [switchTo],
    );
    useEffect(() => listenForCommands(runCommand, platform), [runCommand]);
    // a new version: looked for at start and daily, unless Settings > About turned that off
    useEffect(() => (updatesAvailable ? scheduleChecks(appUpdates, () => appSettings.current.checkForUpdates) : undefined), []);
    // what an automatic check found is said once, where the dialog is not open to say it
    useEffect(() => {
        let said: string | null = null;
        return appUpdates.subscribe(() => {
            const { pending, current: state } = appUpdates;
            if (!pending || state.dialogOpen || said === pending.version) return;
            said = pending.version;
            setStatus(t('{{app}} {{version}} is available: Update is at the foot of the sidebar', { app: APP_NAME, version: pending.version }));
        });
    }, []);

    const others = sessions.filter((s) => !session || s.key !== sessionKey(session));
    // the open network was signed out by its site: its sign-in screen, the network kept
    const again = session?.needsSignIn && !adding ? session : null;

    return (
        <>
            <p className="sr-only" role="status" aria-live="polite">
                {busy === 'signing-out' ? t('Signing out…') : busy === 'switching' ? t('Switching network…') : status}
            </p>
            {linkError ? (
                <div className="banner" role="alert">
                    <span>{linkError}</span>
                    <button className="btn btn-quiet small" onClick={() => setLinkError(null)}>
                        {t('Dismiss')}
                    </button>
                </div>
            ) : null}
            {session === undefined ? (
                <>
                    <WindowDrag />
                    <Splash />
                </>
            ) : (
                <>
                    {!session || adding || session.needsSignIn ? (
                        <>
                            <WindowDrag />
                            <SignIn
                                key={again ? sessionId(again) : 'sign-in'}
                                again={again ?? undefined}
                                onSignOutOf={again ? () => signOutOf(again) : undefined}
                                signingOut={busy === 'signing-out'}
                                notice={
                                    keychainError && !session ? (
                                        // a new element for each failed read: a role=alert is announced when it is inserted
                                        <div key={keychainFailures} className="keychain-alert" role="alert">
                                            <p>{keychainFailures > 1 ? t('{{app}} still couldn’t read your sign-in from the keychain.', { app: APP_NAME }) : t('{{app}} couldn’t read your sign-in from the keychain.', { app: APP_NAME })}</p>
                                            {keychainError ? <p className="muted small">{keychainError}</p> : null}
                                            <button type="button" className="btn" onClick={retryKeychain} aria-disabled={retrying || undefined} aria-busy={retrying || undefined}>
                                                {t('Try again')}
                                            </button>
                                        </div>
                                    ) : null
                                }
                                onSignedIn={onSignedIn}
                                onCancel={session && adding ? () => setAdding(false) : undefined}
                                others={session && !again ? [] : others}
                                onSwitch={(key) => switchTo(key)}
                            />
                        </>
                    ) : null}
                    {session && !session.needsSignIn ? (
                        // kept while adding a network, hidden and inert: Back finds it where it was
                        <div className="session-host" hidden={adding} inert={adding}>
                            <SignedIn
                                key={sessionId(session)}
                                session={session}
                                sessions={sessions}
                                openAt={openAt}
                                onSignOut={signOutOf}
                                onRefused={refusedIn}
                                signingOut={busy === 'signing-out'}
                                commands={shell}
                                links={links}
                                persister={persister}
                                setNavigator={setNavigator}
                                runCommand={runCommand}
                                switchNetwork={switchTo}
                                addNetwork={() => setAdding(true)}
                            />
                        </div>
                    ) : null}
                </>
            )}
            <ShortcutsDialog handle={shortcuts} open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} mac={platform.mac} />
            <UpdateDialog />
        </>
    );
}

type SignedInProps = {
    session: Session;
    sessions: SessionSummary[];
    /** Where it opens (a una:// link), else Home. */
    openAt: Route | null;
    onSignOut: (session: Session) => void;
    /** The site answered 401 to this token, or a request got none (see App refusedIn). */
    onRefused: (session: Session, why: Refusal) => void;
    signingOut: boolean;
    commands: RefObject<CommandHandler | null>;
    links: RefObject<LinkOpener | null>;
    persister: RefObject<CachePersister | null>;
    /** Where a una:// link of this network goes (null: none, of this navigator). */
    setNavigator: (go: ((route: Route) => void) | null, of?: (route: Route) => void) => void;
    runCommand: (id: CommandId) => void;
    switchNetwork: (key: string) => void;
    addNetwork: () => void;
};

function SignedIn({ session, sessions, openAt, onSignOut, onRefused, signingOut, commands, links, persister, setNavigator, runCommand, switchNetwork, addNetwork }: SignedInProps) {
    const signOut = useCallback(() => onSignOut(session), [onSignOut, session]);
    // a new session: pictures that failed in the one before (its una-media 503s during the
    // switch, a site that was slow) get their chances again
    useEffect(() => forgetFailures(), []);
    const api = useMemo(() => makeApi(session, (why) => onRefused(session, why)), [session, onRefused]);
    const queryClient = useQueryClient();
    const key = sessionKey(session);
    // the tabs of this network, each with its own history and scroll memory, as they were at
    // the last launch (lib/tabs.ts); a una:// link opens in the one shown
    const [tabs] = useState(() => new TabsModel(sectionRoute('home'), tabsStorageKey(key), undefined, openAt));
    // the tab shown: the menu's Back and Forward and una:// links follow its history
    useSyncExternalStore(
        (l) => tabs.subscribe(l),
        () => tabs.snapshot,
    );
    const history = tabs.active.history;

    // what this network had last time, before anything is asked of the site (offline reading)
    const [restored, setRestored] = useState(false);
    useEffect(() => {
        let live = true;
        let saving: CachePersister | null = null;
        void restoreCache(queryClient, cacheStore, key).finally(() => {
            if (!live) return;
            saving = persistCache(queryClient, cacheStore, key);
            (persister as { current: CachePersister | null }).current = saving;
            setRestored(true);
        });
        return () => {
            live = false;
            saving?.stop();
            const ref = persister as { current: CachePersister | null };
            if (ref.current === saving) ref.current = null;
        };
    }, [queryClient, key, persister]);

    // a una:// link of this network opens here; the menu's Back and Forward follow the history
    useEffect(() => {
        const go = (route: Route) => tabs.active.history.push(route);
        setNavigator(go);
        const show = () => {
            // the open detail, else the page shown (a profile, a group): what Open in New Window takes;
            // and whether Cmd+N adds a task to a list shown (New Task) or writes a post
            const detail = history.current.detail ?? pageDetail(history.current.list);
            setNavState(history.canGoBack, history.canGoForward, !!detail && opensInWindow(detail), taskAddShown());
        };
        show();
        const unsubscribe = history.subscribe(show);
        const unsubscribeTasks = subscribeTaskAddShown(show);
        return () => {
            unsubscribe();
            unsubscribeTasks();
            setNavigator(null, go);
            setNavState(false, false);
        };
    }, [history, tabs, setNavigator]);

    const me = useQuery({ queryKey: ['me'], queryFn: async () => unwrap(await api.GET('/me')), enabled: restored });
    // the network's API was turned off and answers again: whatever is on screen loads again,
    // the "could not load" screen below included (it has no status banner)
    useReloadWhenApiBack(session.siteUrl);
    const refetchMe = me.refetch;
    const meAgain = useRetryWithCheck(
        session.siteUrl,
        useCallback(() => void refetchMe(), [refetchMe]),
    );

    const messageTo = useCallback(
        (profile: Schema<'Profile'>) => {
            // the new conversation shows the name at once instead of loading the profile
            queryClient.setQueryData(profileSummaryKey(profile.id), profile);
            tabs.active.history.push({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: profile.id } });
        },
        [tabs, queryClient],
    );

    if (me.isError && !me.data) {
        return (
            <>
                <WindowDrag />
                <div className="center-page">
                    <p className="error" role="alert">
                        {errorMessage(me.error)}
                    </p>
                    <button className="btn btn-primary" onClick={meAgain.retry} disabled={me.isFetching || meAgain.checking} aria-busy={me.isFetching || meAgain.checking}>
                        {t('Try again')}
                    </button>
                    <button className="btn" onClick={signOut} disabled={signingOut} aria-busy={signingOut}>
                        {t('Sign out')}
                    </button>
                </div>
            </>
        );
    }
    if (!me.data) {
        return (
            <>
                <WindowDrag />
                <Splash />
            </>
        );
    }

    const active = me.data.profiles.find((p) => p.id === me.data.active_profile_id) ?? me.data.profiles[0];
    const ctx: AppContextValue = { api, siteUrl: session.siteUrl, me: me.data, signOut, signingOut, messageTo, runCommand, sessions, sessionKey: key, switchNetwork, addNetwork };

    return (
        <AppContext.Provider value={ctx}>
            <TabsProvider tabs={tabs}>
                <Synced profile={active} commands={commands} links={links} />
            </TabsProvider>
        </AppContext.Provider>
    );
}

type SyncedProps = { profile?: Schema<'Profile'>; commands: RefObject<CommandHandler | null>; links: RefObject<LinkOpener | null> };

/**
 * The signed-in window with the sync (lib/sync.ts) under it: badges, new notifications, clicks on
 * OS notifications, and site links that open in the app.
 */
function Synced({ profile, commands, links }: SyncedProps) {
    const { api, siteUrl, me } = useApp();
    const { history } = useNavigation();
    const { open } = useNotificationActions();
    const [announcement, announce] = useAnnouncer();

    const onOpenNotification = useCallback(
        (n: Notification | null) => {
            if (n) open(n, true).catch((e: unknown) => announce(errorMessage(e)));
            else history.push(sectionRoute('notifications'));
        },
        [open, history, announce],
    );

    // a link to this site that shows a post, profile, group or conversation opens here
    useEffect(() => {
        const ref = links as { current: LinkOpener | null };
        const opener = makeLinkOpener(api, siteUrl, (detail) => history.push({ list: history.current.list, detail }));
        ref.current = opener;
        return () => {
            if (ref.current === opener) ref.current = null;
        };
    }, [api, siteUrl, history, links]);

    return (
        <SyncProvider api={api} profileId={me.active_profile_id} announce={announce} onOpenNotification={onOpenNotification}>
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            <AnnounceContext.Provider value={announce}>
                <BadgedShell siteUrl={siteUrl} profile={profile} commands={commands} />
            </AnnounceContext.Provider>
        </SyncProvider>
    );
}

function BadgedShell({ siteUrl, profile, commands }: { siteUrl: string; profile?: Schema<'Profile'>; commands: RefObject<CommandHandler | null> }) {
    const { badges } = useSync();
    // a site without the Discussions module has no such row (GET /api/v2 `modules` says so); the
    // list is kept offline (persist.ts), so after the first run it is there on the first frame
    const discussions = useHasDiscussions() === true;
    // Events likewise, only where GET /api/v2 lists the module; Media where it lists a media module (Videos, Photos, Albums, Files)
    const events = useSiteHasTag('events') === true;
    const hasVideos = useSiteHasTag('videos') === true;
    const hasPhotos = useSiteHasTag('photos') === true;
    const hasAlbums = useSiteHasTag('albums') === true;
    const hasFiles = useSiteHasTag('files') === true;
    const media = hasVideos || hasPhotos || hasAlbums || hasFiles;
    const tasks = useSiteHasTag('tasks') === true;
    // the Posts module's posts, where GET /api/v2 lists it
    const posts = useSiteHasTag('posts') === true;
    // the people directory (Persons), where GET /api/v2 lists it
    const people = useSiteHasTag('persons') === true;
    const requests = badges?.friend_requests ?? 0;
    const items: NavItem[] = [
        { section: 'home', label: t('Home'), command: 'go-home', icon: 'house' },
        { section: 'explore', label: t('Explore'), command: 'go-explore', icon: 'compass' },
        { section: 'notifications', label: t('Notifications'), command: 'go-notifications', badge: badges?.notifications, icon: 'bell' },
        { section: 'messages', label: t('Messages'), command: 'go-messages', badge: badges?.messages, icon: 'message-circle' },
        { section: 'profile', label: t('Profile'), command: 'go-profile', icon: 'circle-user-round' },
        // friends, friend requests (the badge: those waiting), following and followers
        {
            section: 'connections',
            label: t('Connections'),
            icon: sectionIcon('connections'),
            badge: requests,
            spokenBadge: tn(requests, ', {{count}} friend request waiting', ', {{count}} friend requests waiting'),
        },
        // after the numbered rows (Cmd+1..5), so they keep their places and nothing above it
        // moves when the answer comes (on a site without Discussions it never does)
        ...(people ? [{ section: 'people', label: t('People'), icon: 'user-round' } as const] : []),
        ...(posts ? [{ section: 'posts', label: t('Posts'), icon: 'newspaper' } as const] : []),
        ...(discussions ? [{ section: 'discussions', label: t('Discussions'), icon: 'messages-square' } as const] : []),
        ...(events ? [{ section: 'events', label: t('Events'), icon: 'calendar' } as const] : []),
        ...(media ? [{ section: 'media', label: t('Media'), icon: 'film' } as const] : []),
        ...(tasks ? [{ section: 'tasks', label: t('Tasks'), icon: 'list-checks' } as const] : []),
    ];
    // Search is the sidebar's field, not a row; friend requests are Connections' badge and its Requests tab
    return <Shell siteUrl={siteUrl} items={items} requests={requests} profile={profile} commands={commands} />;
}
