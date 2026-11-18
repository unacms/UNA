import { useQueryClient } from '@tanstack/react-query';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { type ListCommandHandler, ListCommandsProvider } from '../lib/list-commands';
import { useApp } from '../lib/context';
import { useActiveTab, useNavigation, useRoute } from '../lib/navigation';
import { nameNetwork } from '../lib/native';
import { platform } from '../lib/platform';
import { connectionsRoute, isPage, type ListRoute, type Route, sameRoute, type Section } from '../lib/router';
import { profileDetail, useSiteHasTag } from '../lib/site-modules';
import { useAnnouncer } from '../features/feed/feed-list';
import { ComposeProvider } from '../features/compose/compose-sheet';
import { activityDetail } from '../features/posts/posts';
import { type PaletteEntry, RecentEntries } from '../features/palette/commands';
import { CommandPalette } from '../features/palette/palette';
import { profileSummaryKey, FRIEND_REQUESTS_KEY, SENT_REQUESTS_KEY, connectionsKey, connectionListsKey } from '../features/profile/graph';
import { useSwitchProfile } from '../features/profile/use-switch-profile';
import { SEARCH_FIELD, SidebarSearchContext } from '../features/search/search-view';
import { SidebarContexts, SidebarGroups } from '../features/groups/sidebar-groups';
import { mediaTabs } from '../features/media/media-browse';
import { SidebarTasks } from '../features/tasks/sidebar-tasks';
import { MenuHost } from '../components/menu-popover';
import { useSiteAccent, useSiteInfo } from '../lib/branding';
import { setSidebarShown, setWindowTitle, useDetailTitle, windowTitle } from '../lib/chrome';
import { errorMessage } from '../lib/errors';
import { t } from '../lib/i18n';
import { useMediaQuery } from '../lib/use-media-query';
import { DetailPane } from './detail-pane';
import { FULL_SIDEBAR, Layout, type SidebarMode } from './layout';
import { SectionIconContext } from './pane';
import { type NavItem, Sidebar } from './sidebar';
import { BottomBar } from './bottom-bar';
import { AgentChatsContext, AgentChatsStore, agentChatsStorageKey } from '../features/agents/agents';
import { AgentDock } from '../features/agents/agent-dock';
import { AgentPanels } from '../features/agents/agent-panel';
import { StatusBanner } from './status-banner';
import { TopBar } from './top-bar';
import { SidebarNavigation } from './sidebar-navigation';
import { ListPane } from './section-panes';
import { type CommandHandler, useShellCommands } from './use-shell-commands';
import { focusHeading, useShellFocus } from './use-shell-focus';
import { sectionItem, sectionName } from '../lib/sections';
import { appRealtime, useRealtime, useRealtimeStatus } from '../lib/realtime';
import { currentRowIcon, type NavRowModel, sidebarModel, useSiteNavigation } from '../lib/site-navigation';
import { sectionIcon as sectionIconOf, type ShownIcon } from '../lib/section-icons';
import { useSiteModules } from '../lib/site-modules';
import { readStored, writeStored } from '../lib/storage';
import { useSync } from '../lib/sync-provider';
import { APP_NAME } from '../lib/brand';
import { activityKey } from '../features/feed/cache';

/** The icon rail's own row after the site's: it has no search field. */
const RAIL_SEARCH: NavRowModel = { key: 'app|search', label: t('Search'), icon: null, fallbackIcon: 'search', list: { section: 'search' }, command: 'go-search', counter: null };

/** Said in the developer console for a site menu item the app leaves out of the sidebar. */
function skippedNote(item: { id: string; title: string }, why: string): void {
    if (import.meta.env.DEV) console.info(`sidebar: "${item.title}" (${item.id}) is left out: ${why}`);
}

/** The user's choice for the sidebar of a wide window (icons only or names), on this computer. */
const SIDEBAR_KEY = 'una-desktop-sidebar';
/** The sidebar hidden (Cmd+Ctrl+S), on this computer. */
const SIDEBAR_HIDDEN_KEY = 'una-desktop-sidebar-hidden';

function savedHidden(): boolean {
    return readStored(SIDEBAR_HIDDEN_KEY) === '1';
}

function saveHidden(hidden: boolean): void {
    writeStored(SIDEBAR_HIDDEN_KEY, hidden ? '1' : null);
}

function savedRail(): boolean {
    return readStored(SIDEBAR_KEY) === 'rail';
}

function saveRail(rail: boolean): void {
    writeStored(SIDEBAR_KEY, rail ? 'rail' : null);
}

/** Into the sidebar that just opened over the panes (which are inert now): its current row. */
function focusSidebarRow(): void {
    const pane = document.querySelector<HTMLElement>('[data-pane="sidebar"]');
    if (!pane || pane.contains(document.activeElement)) return;
    (pane.querySelector<HTMLElement>('.nav-item[aria-current="page"]') ?? pane.querySelector<HTMLElement>('.nav-item'))?.focus();
}

type Props = {
    siteUrl: string;
    items: NavItem[];
    /** Friend requests waiting: Connections opens at its Requests tab from the sidebar while some do. */
    requests?: number;
    profile?: Schema<'Profile'>;
    /** Where App finds this shell's command handler. */
    commands: RefObject<CommandHandler | null>;
};

export type { CommandHandler };

/** The signed-in window: sidebar, list and detail panes, the compose sheet, and what commands do in them. */
export function Shell(props: Props) {
    return (
        <ComposeProvider>
            <ShellFrame {...props} />
        </ComposeProvider>
    );
}

function ShellFrame({ siteUrl, items, requests = 0, profile, commands }: Props) {
    const route = useRoute();
    const { history, go, openDetail, showSearch } = useNavigation();
    // GET /api/v2 `modules`: Spaces in the sidebar only where the site has them; it also keeps
    // the list contexts route by (site-modules.ts)
    const spaces = useSiteHasTag('spaces') === true;
    const app = useApp();
    const switchProfile = useSwitchProfile();
    const [paletteOpen, setPaletteOpen] = useState(false);
    // what was chosen in the palette, per profile, for this session
    const [recents] = useState(() => new Map<string, RecentEntries>());
    const profileKey = profile?.id ?? '';
    const recent = useMemo(() => {
        let r = recents.get(profileKey);
        if (!r) {
            r = new RecentEntries();
            recents.set(profileKey, r);
        }
        return r;
    }, [recents, profileKey]);
    const queryClient = useQueryClient();
    // live events (lib/realtime.ts) of the acting profile's channels: a change to its
    // friendships or follows reloads its friend requests and connections (Rust polls the sync
    // for the badge itself)
    useEffect(() => appRealtime.setViewer(profile?.id ?? null), [profile?.id]);
    useRealtime(useRealtimeStatus().channels.connections, () => {
        void queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_KEY });
        void queryClient.invalidateQueries({ queryKey: SENT_REQUESTS_KEY });
        if (profile) {
            void queryClient.invalidateQueries({ queryKey: connectionsKey(profile.id) });
            void queryClient.invalidateQueries({ queryKey: connectionListsKey(profile.id) });
        }
    });
    // the agent chats open in this window: per network and acting profile (another profile's
    // chats are not this one's to open)
    const agentChatsKey = app.sessionKey ? agentChatsStorageKey(`${app.sessionKey}|${profileKey}`) : null;
    const agentChats = useMemo(() => new AgentChatsStore(agentChatsKey), [agentChatsKey]);
    // each message a new text node, so 'Reacted' on the next post is read again
    const [announcement, announce] = useAnnouncer();

    // the sidebar: icons only below 820px unless opened (then over the panes), and as chosen
    // with Cmd+\ above
    const fullWidth = useMediaQuery(FULL_SIDEBAR);
    const [wideRail, setWideRail] = useState(savedRail);
    const [narrowOpen, setNarrowOpen] = useState(false);
    const [hidden, setHidden] = useState(savedHidden);
    const rail = fullWidth ? wideRail : !narrowOpen;
    const sidebarMode: SidebarMode = hidden ? 'hidden' : rail ? 'rail' : fullWidth ? 'full' : 'overlay';
    const focusToggle = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('.sidebar-toggle')?.focus());
    // Cmd+Ctrl+S: the sidebar away, or back (the top and bottom bars stay)
    const hideSidebar = useCallback(() => {
        const next = !hidden;
        setHidden(next);
        saveHidden(next);
        if (next) setNarrowOpen(false);
        announce(next ? t('Sidebar hidden') : t('Sidebar shown'));
        // focus in the sidebar that goes: the list's heading gets it
        if (next && document.activeElement?.closest('[data-pane="sidebar"]')) requestAnimationFrame(() => focusHeading('list'));
    }, [hidden, announce]);
    const toggleSidebar = useCallback(() => {
        // hidden: Cmd+\ brings it back as it was
        if (hidden) {
            hideSidebar();
            return;
        }
        const next = !rail;
        if (fullWidth) {
            setWideRail(next);
            saveRail(next);
        } else {
            setNarrowOpen(!next);
            // the names open over the panes, which go inert (dropping the focus they had):
            // focus goes in, and back to the toggle when they close (closeOverlay)
            if (!next) requestAnimationFrame(focusSidebarRow);
        }
        announce(next ? t('Sidebar shows icons only') : t('Sidebar shows names'));
        // a hidden search field had focus: the list's heading gets it
        if (next && document.activeElement?.id === SEARCH_FIELD) requestAnimationFrame(() => focusHeading('list'));
    }, [rail, fullWidth, announce, hidden, hideSidebar]);
    const closeOverlay = useCallback(() => {
        setNarrowOpen(false);
        focusToggle();
    }, []);
    // the View menu says what Cmd+\ does next
    useEffect(() => setSidebarShown(!rail, hidden), [rail, hidden]);
    // a pick in the overlay sidebar closes it, in the same render as the navigation, so the
    // panes are no longer inert when focus follows the route (a heading in an inert pane refuses it)
    const picked = useCallback(() => {
        if (sidebarMode === 'overlay') setNarrowOpen(false);
    }, [sidebarMode]);
    // A sidebar row shows its section in the content pane and closes what was open beside the
    // list (Navigation.go): never a detail beside another section's list. Connections comes in at
    // Requests while some wait (the row's badge counts them), at Friends otherwise; pressed again
    // inside it, it keeps its tab.
    const navigate = useCallback(
        (section: Section) => {
            if (section === 'connections' && requests > 0 && history.current.list.section !== 'connections') history.push(connectionsRoute('requests'));
            else go(section);
            picked();
        },
        [go, picked, requests, history],
    );

    // The sidebar the site sets up (GET /navigation, sidebar-navigation.tsx): the last answer kept
    // offline shows at once; until a first answer (and on a site without the route) the fixed one
    const navigation = useSiteNavigation();
    const { badges } = useSync();
    const modules = useSiteModules().data;
    const navGroups = useMemo(() => {
        if (!navigation) return null;
        const tabs = modules === undefined ? null : mediaTabs((modules ?? []).map((m) => m.tag));
        const groups = sidebarModel(navigation, { ownId: profile?.id, hasMediaTab: (tag) => (tabs ? (tabs as readonly string[]).includes(tag) : true), onSkipped: skippedNote });
        return groups.length ? groups : null;
    }, [navigation, modules, profile?.id]);
    // a row of it: its list in the content pane, nothing beside it (Connections at Requests while some wait, as above)
    const goList = useCallback(
        (list: ListRoute) => {
            if (list.section === 'connections' && !list.connections && requests > 0 && history.current.list.section !== 'connections') history.push(connectionsRoute('requests'));
            else history.push({ list, detail: null });
        },
        [history, requests],
    );

    // and any other way the route changes while it is open (a una:// link) closes it too
    const routeSeen = useRef<Route>(route);
    useEffect(() => {
        if (sameRoute(routeSeen.current, route)) return;
        routeSeen.current = route;
        setNarrowOpen(false);
    }, [route]);

    // the list the list commands (j, k, o, .) act on
    const listCommands = useRef<ListCommandHandler | null>(null);
    // focus follows navigation; F6 moves between the panes (use-shell-focus.ts)
    const { focusAfterNavigation, focusPane, cyclePane } = useShellFocus();

    const label =
        items.find((i) => i.section === route.list.section)?.label ?? sectionName(route.list.section);
    // the native window's title too: the Window menu, Mission Control and screen readers read
    // it. The open detail or the page names it ("Lily Carter – UNA Makers"), else the section.
    const site = useSiteInfo();
    // the network's colour as the accent while this window shows it
    useSiteAccent();
    const detailName = useDetailTitle();
    // an open detail, a profile's or a context's page, or a site page (About) names the tab and the window
    const shown = ((route.detail || isPage(route.list) || route.list.section === 'page') && detailName) || label;
    const title = windowTitle(shown, site.name);
    useEffect(() => {
        setWindowTitle(title);
    }, [title]);
    // the tab shown is named after it too (and History lists it)
    const tabState = useActiveTab();
    const tabs = tabState?.tabs ?? null;
    const activeTabId = tabState?.active.id;
    // a context's budget has its own (the sidebar's Budget row's), apart from the Tasks section's
    // the sidebar's current row's icon (the site's, as the sidebar draws it), else the section's
    const rowIcon = useMemo(() => (navGroups ? currentRowIcon(navGroups, route.list, profile?.id) : null), [navGroups, route.list, profile?.id]);
    const fixedIcon = items.find((i) => i.section === route.list.section)?.icon ?? sectionIconOf(route.list.section);
    const shownIcon = useMemo<ShownIcon>(
        () => (route.list.taskView === 'budget' ? { name: 'wallet', fallback: 'wallet' } : (rowIcon ?? { name: fixedIcon, fallback: fixedIcon })),
        [route.list.taskView, rowIcon, fixedIcon],
    );
    const tabIconName = shownIcon.name ?? shownIcon.fallback;
    useEffect(() => {
        if (tabs && activeTabId) tabs.name(activeTabId, shown, tabIconName);
    }, [tabs, activeTabId, shown, tabIconName, route]);
    // a sign-in that kept no name (an older version's): the name the site gave goes to Rust,
    // so the Window menu says "UNA Makers – Andrey" too, not the host
    const unnamed = !!app.sessions?.find((s) => s.key === app.sessionKey && !s.siteName.trim());
    useEffect(() => {
        if (!unnamed || !site.named || !app.sessionKey) return;
        void nameNetwork(app.sessionKey, site.name).catch((e: unknown) => console.error('network name', e));
    }, [unnamed, site.named, site.name, app.sessionKey]);
    // signed out, or the account failed to load: the title no longer names a section
    useEffect(() => () => setWindowTitle(APP_NAME), []);


    // the banner's Try again went while the keyboard was on it: on to what it was about
    const retryGone = useCallback(() => {
        if (!focusPane('list')) focusPane('sidebar');
    }, [focusPane]);

    // what each command does in this window (use-shell-commands.ts)
    const run = useShellCommands({ siteUrl, profileId: profile?.id, announce, paletteOpen, setPaletteOpen, toggleSidebar, hideSidebar, focusAfterNavigation, cyclePane, listCommands });

    // act as another profile of the account (the palette, the profile menu); said once it is done
    const actAs = useCallback(
        (profileId: string) => {
            const name = app.me.profiles.find((p) => p.id === profileId)?.display_name;
            switchProfile(profileId).then(
                () => announce(name === undefined ? t('Acting as the profile') : t('Acting as {{name}}', { name })),
                (e: unknown) => announce(errorMessage(e)),
            );
        },
        [app.me.profiles, switchProfile, announce],
    );

    // what the palette chose; focus is back where it was when the palette opened
    const choose = useCallback(
        (entry: PaletteEntry) => {
            const a = entry.action;
            switch (a.kind) {
                case 'list':
                    history.push({ list: a.list, detail: null });
                    return;
                case 'command':
                    // App's handler (it has the shortcut sheet and the theme), else this one
                    (app.runCommand ?? run)(a.id);
                    return;
                case 'switch-profile':
                    actAs(a.profileId);
                    return;
                case 'profile':
                    if (!queryClient.getQueryData(profileSummaryKey(a.profile.id))) queryClient.setQueryData(profileSummaryKey(a.profile.id), a.profile, { updatedAt: 0 });
                    // a group or a space as its own page, by its module
                    openDetail(profileDetail(a.profile));
                    return;
                case 'post':
                    // the thread shows the post at once while it loads its own copy: written as
                    // stale (updatedAt 0), so the thread fetches it and finds a post that is gone
                    if (!queryClient.getQueryData(activityKey(a.activity.id))) queryClient.setQueryData(activityKey(a.activity.id), a.activity, { updatedAt: 0 });
                    openDetail(activityDetail(a.activity));
                    return;
                case 'search':
                    showSearch(a.q, a.tab);
                    return;
            }
        },
        [history, app, run, actAs, queryClient, openDetail, showSearch],
    );
    const closePalette = useCallback(() => setPaletteOpen(false), []);

    useEffect(() => {
        const ref = commands as { current: CommandHandler | null };
        ref.current = run;
        return () => {
            if (ref.current === run) ref.current = null;
        };
    }, [commands, run]);

    return (
        <>
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            <AgentChatsContext.Provider value={agentChats}>
            <SectionIconContext.Provider value={shownIcon}>
                <ListCommandsProvider registry={listCommands}>
                    <SidebarSearchContext.Provider value={!rail}>
                        <Layout
                            sidebar={
                                <Sidebar
                                    // under an icon rail there is no search field: Search is a row, as are the groups
                                    items={
                                        rail
                                            ? [
                                                  ...items,
                                                  { ...sectionItem('search'), command: 'go-search' },
                                                  sectionItem('groups'),
                                                  ...(spaces ? [sectionItem('spaces')] : []),
                                              ]
                                            : // with names, Tasks is a section of its own under the rows (SidebarTasks)
                                              items.filter((i) => i.section !== 'tasks')
                                    }
                                    // someone else's profile page is no section of the sidebar's
                                    current={route.list.section === 'profile' && route.list.profile && route.list.profile !== profile?.id ? null : route.list.section}
                                    onNavigate={navigate}
                                    profile={profile}
                                    mac={platform.mac}
                                    navigation={
                                        navGroups ? (
                                            <SidebarNavigation
                                                groups={navGroups}
                                                list={route.list}
                                                ownId={profile?.id}
                                                rail={rail}
                                                mac={platform.mac}
                                                badges={badges}
                                                onGo={goList}
                                                onPicked={picked}
                                                railExtra={rail ? [RAIL_SEARCH] : []}
                                            />
                                        ) : undefined
                                    }
                                    extra={
                                        <>
                                            {items.some((i) => i.section === 'tasks') ? <SidebarTasks onPicked={picked} /> : null}
                                            <SidebarGroups onPicked={picked} />
                                            <SidebarContexts kind="space" onPicked={picked} />
                                        </>
                                    }
                                    rail={rail}
                                    onOpenSettings={() => {
                                        run('open-settings');
                                        picked();
                                    }}
                                    settingsOpen={route.list.section === 'settings'}
                                    onCommand={(id) => {
                                        picked();
                                        (app.runCommand ?? run)(id);
                                    }}
                                    onSwitchProfile={(id) => {
                                        picked();
                                        actAs(id);
                                    }}
                                />
                            }
                            // each tab's screens are its own: another tab mounts them anew (its scroll comes back from its memory)
                            list={<ListPane key={activeTabId} list={route.list} />}
                            detail={<DetailPane key={activeTabId} route={route} />}
                            detailOpen={!!route.detail}
                            sidebarMode={sidebarMode}
                            onCloseOverlay={closeOverlay}
                            banner={<StatusBanner siteUrl={app.siteUrl} announce={announce} onRetryGone={retryGone} />}
                            tabId={activeTabId}
                            top={<TopBar rail={rail} hidden={hidden} onToggle={toggleSidebar} />}
                            bottom={<BottomBar siteUrl={siteUrl} onGo={goList} agents={<AgentDock />} />}
                            overlay={<AgentPanels />}
                        />
                    </SidebarSearchContext.Provider>
                </ListCommandsProvider>
            </SectionIconContext.Provider>
            </AgentChatsContext.Provider>
            <CommandPalette open={paletteOpen} onClose={closePalette} onChoose={choose} recent={recent} />
            <MenuHost />
        </>
    );
}
