import { useQueryClient } from '@tanstack/react-query';
import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { canCommentOn, focusedPost, focusWhenPresent, openFocusedAuthor, replyToFocusedComment, toggleFocusedReaction } from '../lib/focused-entry';
import { focusInListPane, isListCommand, type ListCommandHandler, ListCommandsProvider } from '../lib/list-commands';
import { useApp } from '../lib/context';
import { useActiveTab, useNavigation, useRoute } from '../lib/navigation';
import { nameNetwork, openExternal } from '../lib/native';
import { opensInWindow, useOpenInWindow } from '../lib/open-in-window';
import { platform } from '../lib/platform';
import { connectionsRoute, type DetailRoute, detailPath, isPage, type ListRoute, pageDetail, type Route, sameRoute, type Section } from '../lib/router';
import { profileDetail, useSiteHasTag } from '../lib/site-modules';
import { type CommandId, tabNumber } from '../lib/shortcuts';
import { useAnnouncer } from '../features/feed/feed-list';
import { commentBoxId } from '../features/thread/comment-tree';
import { CONVERSATION_REPLY_FIELD } from '../screens/conversation';
import { ComposeProvider, NEW_POST_FIELD, useCompose } from '../features/compose/compose-sheet';
import { Feed } from '../screens/feed';
import { Messages } from '../screens/messages';
import { forgetPreopenedEntry, isPreopened, preopenedId, resumePreopened, setPreopened } from '../features/messages/preopen';
import { Discussions } from '../features/discussions/discussion-list';
import { Posts } from '../features/posts/post-list';
import { activityDetail } from '../features/posts/posts';
import { Notifications } from '../screens/notifications';
import { Profile } from '../screens/profile';
import { type PaletteEntry, RecentEntries } from '../features/palette/commands';
import { CommandPalette } from '../features/palette/palette';
import { profileSummaryKey, FRIEND_REQUESTS_KEY, SENT_REQUESTS_KEY, connectionsKey } from '../features/profile/graph';
import { useSwitchProfile } from '../features/profile/use-switch-profile';
import { SEARCH_FIELD, SearchView, SidebarSearchContext } from '../features/search/search-view';
import { ContextsBrowse, GroupsBrowse } from '../features/groups/group-list';
import { GroupView } from '../features/groups/group-view';
import { SidebarContexts, SidebarGroups } from '../features/groups/sidebar-groups';
import { SettingsList } from '../features/settings/settings-list';
import { EventsBrowse } from '../features/events/event-list';
import { MediaBrowse, mediaTabs } from '../features/media/media-browse';
import { SitePage } from '../features/page-blocks/site-page';
import { ConnectionsPage } from '../features/connections/connections-page';
import { PeoplePage } from '../features/people/people-page';
import { focusTaskAdd } from '../features/tasks/task-list';
import { TaskBoard } from '../features/tasks/task-board';
import { TaskBudgetView } from '../features/tasks/task-budget';
import { MyTimers } from '../features/tasks/task-timers';
import { SidebarTasks } from '../features/tasks/sidebar-tasks';
import { MenuHost } from '../components/menu-popover';
import { useSiteAccent, useSiteInfo } from '../lib/branding';
import { setSidebarShown, setWindowTitle, useDetailTitle, windowTitle } from '../lib/chrome';
import { errorMessage } from '../lib/errors';
import { t } from '../lib/i18n';
import { sectionRoute, settingsRoute } from '../lib/router';
import { useMediaQuery } from '../lib/use-media-query';
import { DetailPane } from './detail-pane';
import { FULL_SIDEBAR, Layout, type SidebarMode } from './layout';
import { paneHeadingId, type PaneName, SectionIconContext } from './pane';
import { type NavItem, Sidebar } from './sidebar';
import { BottomBar } from './bottom-bar';
import { AgentChatsContext, AgentChatsStore, agentChatsStorageKey } from '../features/agents/agents';
import { AgentDock } from '../features/agents/agent-dock';
import { AgentPanels } from '../features/agents/agent-panel';
import { StatusBanner } from './status-banner';
import { TopBar } from './top-bar';
import { tabTitle } from './tab-strip';
import { SidebarNavigation } from './sidebar-navigation';
import { appRealtime, useRealtime, useRealtimeStatus } from '../lib/realtime';
import { currentRowIcon, type NavRowModel, sidebarModel, useSiteNavigation } from '../lib/site-navigation';
import { sectionIcon as sectionIconOf, type ShownIcon } from '../lib/section-icons';
import { useSiteModules } from '../lib/site-modules';
import { readStored, writeStored } from '../lib/storage';
import { useSync } from '../lib/sync-provider';
import { APP_NAME } from '../lib/brand';

/** Runs a command the app shell handles; App sends it the ones it doesn't handle itself. */
export type CommandHandler = (id: CommandId) => void;

const SECTION_COMMANDS: Partial<Record<CommandId, Section>> = { 'go-home': 'home', 'go-explore': 'explore', 'go-notifications': 'notifications', 'go-messages': 'messages', 'go-profile': 'profile' };

const PANES = ['sidebar', 'list', 'detail'] as const;
type AnyPane = (typeof PANES)[number];

function ListPane({ list }: { list: ListRoute }) {
    switch (list.section) {
        case 'home':
            return <Feed key="home" section="home" />;
        case 'explore':
            return <Feed key="explore" section="explore" />;
        case 'notifications':
            return <Notifications />;
        case 'messages':
            return <Messages />;
        case 'connections':
            // one's friends, requests received and sent, following and followers, a tab each
            return <ConnectionsPage />;
        case 'people':
            // the network's people: Recent, Active, Online (Persons' pages), and one's friends
            return <PeoplePage />;
        case 'posts':
            // the Posts module's posts: the newest, the most viewed, or one's own
            return <Posts />;
        case 'discussions':
            return <Discussions />;
        case 'search':
            return <SearchView />;
        case 'profile':
            // a page: someone's profile, or one's own
            return <Profile list={list} />;
        case 'groups':
            // a group's page, or the groups to browse
            return list.group ? <GroupView key={list.group} id={list.group} tab={list.groupTab ?? 'posts'} /> : <GroupsBrowse joined={list.feed === 'joined'} />;
        case 'spaces':
            // a space's page, or the top level spaces to browse
            return list.group ? <GroupView key={`space-${list.group}`} id={list.group} tab={list.groupTab ?? 'posts'} kind="space" /> : <ContextsBrowse kind="space" joined={list.feed === 'joined'} />;
        case 'events':
            // an event's page, or the events: upcoming, one's own, past
            return list.group ? <GroupView key={`event-${list.group}`} id={list.group} tab={list.groupTab ?? 'posts'} kind="event" /> : <EventsBrowse />;
        case 'media':
            // the media modules' lists: Videos, Photos, Albums
            return <MediaBrowse />;
        case 'tasks':
            // My timers, a context's budget, or a board: My tasks (assigned or created), a context's tasks or one of its lists
            if (list.taskView === 'budget' && list.taskContext) return <TaskBudgetView key={`budget-${list.taskContext}`} contextId={list.taskContext} />;
            return list.taskView === 'timers' ? <MyTimers /> : <TaskBoard key={list.taskContext ? `context-${list.taskContext}` : `mine-${list.taskRole ?? 'assigned'}`} list={list} />;
        case 'settings':
            return <SettingsList />;
        case 'page':
            // a page of the site's that the app has no screen for: its blocks (a sidebar item opens one)
            return <SitePage key={list.page ?? ''} path={list.page ?? null} />;
    }
}

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

function paneElement(name: AnyPane): HTMLElement | null {
    const el = document.querySelector<HTMLElement>(`[data-pane="${name}"]`);
    // a pane behind the detail cover is inert, a closed detail pane is hidden
    return el && !el.closest('[inert], [hidden]') ? el : null;
}

/** Into the sidebar that just opened over the panes (which are inert now): its current row. */
function focusSidebarRow(): void {
    const pane = document.querySelector<HTMLElement>('[data-pane="sidebar"]');
    if (!pane || pane.contains(document.activeElement)) return;
    (pane.querySelector<HTMLElement>('.nav-item[aria-current="page"]') ?? pane.querySelector<HTMLElement>('.nav-item'))?.focus();
}

/** Which page a list route shows: a new one (another group or profile) takes focus to its heading; a tab of the same one does not. */
function pageKey(list: ListRoute): string {
    return isPage(list) ? `${list.section}/${list.group ?? list.profile ?? ''}` : list.section;
}

function focusHeading(pane: PaneName): boolean {
    const heading = document.getElementById(paneHeadingId(pane));
    if (!heading || heading.closest('[inert], [hidden]')) return false;
    heading.focus();
    return true;
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

/** The signed-in window: sidebar, list and detail panes, the compose sheet, and what commands do in them. */
export function Shell(props: Props) {
    return (
        <ComposeProvider>
            <ShellFrame {...props} />
        </ComposeProvider>
    );
}

function ShellFrame({ siteUrl, items, requests = 0, profile, commands }: Props) {
    const compose = useCompose();
    const route = useRoute();
    const { history, go, openDetail, closeDetail, showSearch } = useNavigation();
    const openInWindow = useOpenInWindow();
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
            void queryClient.invalidateQueries({ queryKey: ['connection-list', profile.id] });
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

    const previous = useRef<Route>(route);
    // the tab shown (its history): another one is a tab switch, not a navigation
    const shownHistory = useRef(history);
    // an element to focus after the next navigation (Cmd+N: the new post box)
    const pendingFocus = useRef<string | null>(null);
    // what had focus when a detail opened, to go back to when it closes
    const openers = useRef(new Map<string, HTMLElement>());
    // the last focused element in each pane, for F6
    const lastFocus = useRef(new Map<AnyPane, HTMLElement>());
    // the list the list commands (j, k, o, .) act on
    const listCommands = useRef<ListCommandHandler | null>(null);

    // What opened a detail is what had focus when the route changed, before React renders the
    // detail (whose autoFocus would take focus first). A detail replaced from inside the detail
    // pane (a new conversation once sent) keeps the opener of the one it replaces.
    useEffect(() => {
        let last = history.current;
        return history.subscribe(() => {
            const before = last;
            const now = history.current;
            last = now;
            // Back or Forward to an entry where the inbox opened it by itself: preopened again
            // (here, before the route renders, so the conversation mounts waiting to be read)
            resumePreopened(now);
            if (!now.detail) return;
            // the inbox opened it by itself: nothing opened it, and focus stays where it is
            if (isPreopened(now.detail)) return;
            const path = detailPath(now.detail);
            if (before.detail && detailPath(before.detail) === path) return;
            const active = document.activeElement;
            if (!(active instanceof HTMLElement) || active === document.body) return;
            if (!active.closest('[data-pane="detail"]')) {
                openers.current.set(path, active);
                return;
            }
            const carried = before.detail ? openers.current.get(detailPath(before.detail)) : undefined;
            if (carried) openers.current.set(path, carried);
        });
    }, [history]);

    // Focus follows navigation: a new section focuses the list's heading, an opened detail its
    // heading (unless something in it took focus itself, like a new message's text box), a
    // closed detail what opened it. Screen readers read the heading that got focus.
    // the conversation the inbox opened by itself (preopen.ts) while it is the one open
    const preopenedPath = useRef<string | null>(null);
    useLayoutEffect(() => {
        if (shownHistory.current !== history) {
            shownHistory.current = history;
            previous.current = route;
            pendingFocus.current = null;
            // chosen in the strip: focus stays on the tab; otherwise (Cmd+1, a new or a closed
            // tab) the content's heading, as a new section
            if (!document.activeElement?.closest('[role="tab"]')) focusHeading('list');
            return;
        }
        const before = previous.current;
        if (sameRoute(before, route)) return;
        previous.current = route;
        // a preopened conversation is preopened only while it is open
        if (preopenedId() !== null && !isPreopened(route.detail)) setPreopened(null);
        const closingPreopened = !route.detail && !!before.detail && preopenedPath.current === detailPath(before.detail);
        preopenedPath.current = route.detail && isPreopened(route.detail) ? detailPath(route.detail) : null;
        const sectionChanged = before.list.section !== route.list.section || pageKey(before.list) !== pageKey(route.list);

        const want = pendingFocus.current;
        pendingFocus.current = null;
        if (want) {
            // the detail it is in may still be loading; if it never comes, the detail's heading
            focusWhenPresent(want, 3000, route.detail ? paneHeadingId('detail') : undefined);
            return;
        }
        if (route.detail && (!before.detail || detailPath(before.detail) !== detailPath(route.detail))) {
            if (isPreopened(route.detail)) {
                // shown beside the inbox, not gone to: focus stays in the sidebar or the list
                // (Messages entered with it, by Back or Forward: the list's heading, as a section)
                if (sectionChanged) focusHeading('list');
                return;
            }
            if (!document.activeElement?.closest('[data-pane="detail"]')) focusHeading('detail');
            return;
        }
        if (sectionChanged) {
            focusHeading('list');
            return;
        }
        if (closingPreopened && before.detail) {
            // closed where it was opened: Back to that entry opens it as any other
            forgetPreopenedEntry(before);
            // nothing opened it: focus stays where it is, unless it was in the pane that closed
            // (then the conversation's row in the list)
            const active = document.activeElement;
            if (active instanceof HTMLElement && active !== document.body && active.isConnected && !active.closest('[inert], [hidden]')) return;
            const id = before.detail.kind === 'conversation' ? before.detail.id : '';
            const row = document.querySelector<HTMLElement>(`[data-pane="list"] [data-conversation="${CSS.escape(id)}"]`);
            if (row && !row.closest('[inert], [hidden]')) row.focus();
            else focusHeading('list');
            return;
        }
        if (!route.detail && before.detail) {
            const opener = openers.current.get(detailPath(before.detail));
            // a virtualized feed may have drawn the post's row anew: the post it opened is the row with its id
            const postId = before.detail.kind === 'post' ? before.detail.id : null;
            const row = postId ? (Array.from(document.querySelectorAll<HTMLElement>('[data-pane="list"] article[data-id]')).find((el) => el.dataset.id === postId) ?? null) : null;
            const target = opener?.isConnected ? opener : row;
            if (target && !target.closest('[inert], [hidden]')) target.focus();
            else focusHeading('list');
        }
    }, [route, history]);

    useEffect(() => {
        const onFocusIn = (e: FocusEvent) => {
            const pane = (e.target as Element | null)?.closest?.<HTMLElement>('[data-pane]')?.dataset.pane;
            if (pane && (PANES as readonly string[]).includes(pane)) lastFocus.current.set(pane as AnyPane, e.target as HTMLElement);
        };
        document.addEventListener('focusin', onFocusIn);
        return () => document.removeEventListener('focusin', onFocusIn);
    }, []);

    const label =
        items.find((i) => i.section === route.list.section)?.label ?? (route.list.section === 'people' ? t('People') : route.list.section === 'groups' ? t('Groups') : route.list.section === 'spaces' ? t('Spaces') : route.list.section === 'events' ? t('Events') : route.list.section === 'media' ? t('Media') : route.list.section === 'tasks' ? t('Tasks') : route.list.section === 'settings' ? t('Settings') : route.list.section === 'search' ? t('Search') : 'UNA');
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

    const detailOpen = !!route.detail;
    const focusPane = useCallback(
        (name: AnyPane): boolean => {
            // an empty detail pane has nothing to act on, and its only heading is not drawn
            if (name === 'detail' && !detailOpen) return false;
            const pane = paneElement(name);
            if (!pane) return false;
            const last = lastFocus.current.get(name);
            if (last?.isConnected && pane.contains(last)) {
                last.focus();
                return true;
            }
            if (name !== 'sidebar') return focusHeading(name);
            const item = pane.querySelector<HTMLElement>('[aria-current="page"]') ?? pane.querySelector<HTMLElement>('button');
            item?.focus();
            return !!item;
        },
        [detailOpen],
    );

    // the banner's Try again went while the keyboard was on it: on to what it was about
    const retryGone = useCallback(() => {
        if (!focusPane('list')) focusPane('sidebar');
    }, [focusPane]);

    const cyclePane = useCallback(
        (step: 1 | -1) => {
            const current = (document.activeElement?.closest<HTMLElement>('[data-pane]')?.dataset.pane ?? 'sidebar') as AnyPane;
            const start = Math.max(0, PANES.indexOf(current));
            for (let i = 1; i <= PANES.length; i++) {
                const next = PANES[(start + step * i + PANES.length * 2) % PANES.length];
                if (next && focusPane(next)) return;
            }
        },
        [focusPane],
    );

    const run = useCallback<CommandHandler>(
        (id) => {
            // c (and r on a post): the focused post's comment box, here in the thread or in the thread it opens
            const commentOnFocusedPost = () => {
                const post = focusedPost();
                const itemId = post?.dataset.itemId;
                const postId = post?.dataset.id;
                if (!post || !itemId || !postId) return;
                // a post of the Posts module opens its own view, which has the same comments
                const articleId = post.dataset.articleId;
                const detail: DetailRoute = articleId ? { kind: 'article', id: articleId } : { kind: 'post', id: postId };
                const isOpen = () => {
                    const open = history.current.detail;
                    return open?.kind === detail.kind && open.id === detail.id;
                };
                if (!canCommentOn(post)) {
                    // nothing to go to: the thread opens (its heading takes focus) and says why
                    announce(t('Comments are closed on this post'));
                    if (!isOpen()) openDetail(detail);
                    return;
                }
                const box = document.getElementById(commentBoxId(itemId));
                if (post.closest('[data-pane="detail"]') && box) {
                    box.focus();
                    return;
                }
                // the thread may still be loading, or refuse the post: then its heading gets focus
                if (isOpen()) focusWhenPresent(commentBoxId(itemId), 3000, paneHeadingId('detail'));
                else {
                    pendingFocus.current = commentBoxId(itemId);
                    openDetail(detail);
                }
            };

            if (id === 'command-palette') {
                // open already (a menu click reaches here): back to its field
                if (paletteOpen) document.querySelector<HTMLElement>('.palette input')?.focus();
                else setPaletteOpen(true);
                return;
            }
            // a menu command chosen while the palette is open acts on the window: the palette goes first
            if (paletteOpen) setPaletteOpen(false);

            const section = SECTION_COMMANDS[id];
            if (section) {
                go(section);
                return;
            }
            if (isListCommand(id)) {
                if (focusInListPane()) listCommands.current?.(id);
                return;
            }
            const n = tabNumber(id);
            if (n !== null) {
                if (tabs && !tabs.selectNumber(n)) announce(t('No tab {{n}}', { n }));
                return;
            }
            switch (id) {
                case 'open-settings': {
                    // open already: its heading (and the part shown), else Account
                    const open = history.current;
                    if (open.list.section === 'settings' && open.detail) focusHeading('detail');
                    else history.push(settingsRoute());
                    return;
                }
                case 'toggle-sidebar':
                    toggleSidebar();
                    return;
                case 'hide-sidebar':
                    hideSidebar();
                    return;
                case 'new-tab':
                    if (!tabs) return;
                    if (!tabs.open(sectionRoute('home'), { title: t('Home'), icon: 'house' })) announce(t('Too many tabs open: close one first'));
                    return;
                case 'close-tab': {
                    if (!tabs) return;
                    const tab = tabs.active;
                    if (!tabs.close(tab.id, () => announce(t('Closed {{title}}', { title: tabTitle(tab) })))) announce(t('The last tab stays open'));
                    return;
                }
                case 'reopen-tab':
                    if (!tabs) return;
                    if (!tabs.reopen()) announce(tabs.canReopen ? t('Too many tabs open: close one first') : t('No closed tab to reopen'));
                    return;
                case 'next-tab':
                    tabs?.selectNext(1);
                    return;
                case 'previous-tab':
                    tabs?.selectNext(-1);
                    return;
                case 'new-post':
                    // on a context's Tasks tab: a task in the list focus is in (its add field)
                    if (!compose?.isOpen && focusTaskAdd()) return;
                    // the compose sheet, over whatever is shown; open already, its text box
                    if (compose?.isOpen) document.getElementById(NEW_POST_FIELD)?.focus();
                    else compose?.open();
                    return;
                case 'open-in-window': {
                    // the open conversation or post, else the profile or group page shown
                    const detail = history.current.detail ?? pageDetail(history.current.list, profile?.id);
                    if (detail && opensInWindow(detail) && openInWindow) openInWindow(detail);
                    else announce(t('Nothing open goes in a window of its own'));
                    return;
                }
                case 'new-message':
                    // a new conversation, its recipient field focused, beside the inbox
                    history.push({ list: { section: 'messages' }, detail: { kind: 'new-message' } });
                    return;
                case 'back':
                    history.back();
                    return;
                case 'forward':
                    history.forward();
                    return;
                case 'close-detail':
                    closeDetail();
                    return;
                case 'go-search': {
                    // the field (the sidebar's, or the Search list's under an icon rail), with
                    // its words selected; Search opens first when it is not shown
                    const current = history.current;
                    const field = document.getElementById(SEARCH_FIELD);
                    if (current.list.section === 'search' && field instanceof HTMLInputElement && !field.closest('[inert], [hidden]')) {
                        field.focus();
                        field.select();
                        return;
                    }
                    pendingFocus.current = SEARCH_FIELD;
                    go('search');
                    return;
                }
                case 'sign-out':
                    app.signOut();
                    return;
                case 'open-author':
                    openFocusedAuthor();
                    return;
                case 'react': {
                    // said once the site answered; a refusal shows (and is read) on the post itself
                    void toggleFocusedReaction()?.then((r) => {
                        if ('reacted' in r) announce(r.reacted ? t('Reacted') : t('Reaction taken back'));
                    });
                    return;
                }
                case 'comment':
                    commentOnFocusedPost();
                    return;
                case 'reply': {
                    if (replyToFocusedComment()) return;
                    // a focused post, in either pane: its own comment box
                    if (focusedPost()) {
                        commentOnFocusedPost();
                        return;
                    }
                    // elsewhere in the detail pane: the conversation's reply box, or the thread's comment box
                    const detail = paneElement('detail');
                    const active = document.activeElement;
                    if (!detail || !(active instanceof HTMLElement) || !detail.contains(active)) return;
                    detail.querySelector<HTMLElement>(`#${CONVERSATION_REPLY_FIELD}, [id^="comment-box-"]`)?.focus();
                    return;
                }
                case 'next-pane':
                    cyclePane(1);
                    return;
                case 'previous-pane':
                    cyclePane(-1);
                    return;
                case 'refresh':
                    announce(t('Refreshing…'));
                    // without throwOnError a failed query resolves the refetch all the same
                    void queryClient.refetchQueries({ type: 'active' }, { throwOnError: true }).then(
                        () => announce(t('Up to date')),
                        () => announce(t('Could not refresh')),
                    );
                    return;
                case 'open-site':
                    void openExternal(siteUrl).catch((e: unknown) => announce(errorMessage(e)));
                    return;
                default:
                    return;
            }
        },
        [go, history, openDetail, closeDetail, cyclePane, queryClient, siteUrl, announce, compose, paletteOpen, app, toggleSidebar, hideSidebar, openInWindow, profile?.id, tabs],
    );

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
                    if (!queryClient.getQueryData(['activity', a.activity.id])) queryClient.setQueryData(['activity', a.activity.id], a.activity, { updatedAt: 0 });
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
                                                  { section: 'search', label: t('Search'), command: 'go-search', icon: 'search' },
                                                  { section: 'groups', label: t('Groups'), icon: 'users-round' },
                                                  ...(spaces ? [{ section: 'spaces', label: t('Spaces'), icon: 'orbit' } as const] : []),
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
