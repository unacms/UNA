/**
 * The app's navigation: a typed route (a list section and an optional detail), its string form
 * for history and later deep links, and an in-memory history with back and forward.
 */

export const SECTIONS = ['home', 'explore', 'notifications', 'messages', 'connections', 'people', 'posts', 'discussions', 'events', 'media', 'tasks', 'search', 'profile', 'groups', 'spaces', 'settings', 'page'] as const;
export type Section = (typeof SECTIONS)[number];

/** The parts of Settings (the list pane lists them, the detail pane shows one); Account first. */
export const SETTINGS_TABS = ['account', 'appearance', 'notifications', 'keyboard', 'startup', 'about'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

/** Settings, open at one of its parts. */
export function settingsRoute(tab: SettingsTab = 'account'): Route {
    return { list: { section: 'settings' }, detail: { kind: 'settings', tab } };
}

/**
 * The tabs of Connections (the site's Connections pages: friends, the friend requests received
 * and sent, following, followers); Friends is the default and is not written out.
 */
export const CONNECTIONS_TABS = ['friends', 'requests', 'sent', 'following', 'followers'] as const;
export type ConnectionsTab = (typeof CONNECTIONS_TABS)[number];

/** Connections at one of its tabs: /connections, /connections?tab=requests. */
export function connectionsPage(tab: ConnectionsTab = 'friends'): ListRoute {
    return tab === 'friends' ? { section: 'connections' } : { section: 'connections', connections: tab };
}

/** Connections at one of its tabs, with nothing open beside it. */
export function connectionsRoute(tab: ConnectionsTab = 'friends'): Route {
    return { list: connectionsPage(tab), detail: null };
}

/**
 * The feeds a section switches between, the default first. A list route names its feed only
 * when it is not the default, so `sectionRoute('home')` is Following.
 */
export const SECTION_FEEDS = {
    home: ['following', 'for-you', 'hot'],
    explore: ['latest', 'hot'],
    /** Discussions: the most recently replied to first (latest), or the newest started (new). */
    discussions: ['latest', 'new'],
    /** Posts (the Posts module's): the newest first (latest), the most viewed (popular), or one's own in every state (mine). */
    posts: ['latest', 'popular', 'mine'],
    /** Events: the ones to come (soonest first), the ones one is going to, the ones that ended (the latest first). */
    events: ['upcoming', 'going', 'past'],
    /** Media: one tab per media module the site has (Videos, Photos, Albums, Files), those the site lacks left out. */
    media: ['videos', 'photos', 'albums', 'files'],
    /** My tasks: the open ones assigned to one (due soonest first), or those completed. */
    tasks: ['open', 'completed'],
    /** Groups and Spaces: all those one may find (newest first), or the ones one is a member of (Yours, most recently joined first). */
    groups: ['all', 'joined'],
    spaces: ['all', 'joined'],
    /** People (the network's people directory, Persons' pages): the newest (Recent), the most recently signed in (Active), those online now (Online), or one's friends (Friends). */
    people: ['recent', 'active', 'online', 'friends'],
} as const satisfies Partial<Record<Section, readonly string[]>>;

export type FeedName = (typeof SECTION_FEEDS)[keyof typeof SECTION_FEEDS][number];

/** What a list shows of its items: notifications have All (no filter) and Unread. */
export const LIST_FILTERS = { notifications: ['unread'] } as const satisfies Partial<Record<Section, readonly string[]>>;
export type ListFilter = (typeof LIST_FILTERS)['notifications'][number];

/**
 * The result tabs of a search a module of the site has a search of its own for (GET
 * /search/posts ... /search/tasks): `articles` are the Posts module's posts, as in a profile's
 * tabs (`posts` is the feed's).
 */
export const SEARCH_MODULE_TABS = ['articles', 'photos', 'albums', 'videos', 'files', 'polls', 'tasks'] as const;
export type SearchModuleTab = (typeof SEARCH_MODULE_TABS)[number];
/** The result tabs of a search; People is the default. */
export const SEARCH_TABS = ['people', 'posts', 'groups', 'spaces', 'events', 'discussions', ...SEARCH_MODULE_TABS] as const;
export type SearchTab = (typeof SEARCH_TABS)[number];

/** The longest query a search takes (the API's limit). */
export const SEARCH_MAX = 100;

/**
 * The parts of a context's page (a group's, a space's, an event's); Posts is the default.
 * Subspaces only on a space's page, Attendees (its members) only on an event's, Members on the
 * others', Events, Videos, Photos, Albums and Discussions where the site lets them go into the context
 * (`content_kinds`), Tasks, Polls and the Posts module's posts (`articles`: Posts is the feed) likewise; the page offers the tabs that apply (group-view.tsx contextTabs).
 */
export const GROUP_TABS = ['posts', 'spaces', 'events', 'tasks', 'articles', 'videos', 'photos', 'albums', 'files', 'polls', 'discussions', 'members', 'attendees', 'about'] as const;
export type GroupTab = (typeof GROUP_TABS)[number];

/** Whether a context of this kind has the tab at all: Subspaces only on a space's page, Attendees only on an event's (its Members). */
export function contextHasTab(kind: ContextPageKind, tab: string): tab is GroupTab {
    if (!(GROUP_TABS as readonly string[]).includes(tab)) return false;
    if (tab === 'spaces') return kind === 'space';
    if (tab === 'attendees') return kind === 'event';
    if (tab === 'members') return kind !== 'event';
    return true;
}

/** The kinds of context page, with the section each one's page and list are in. */
export type ContextPageKind = 'group' | 'space' | 'event';
export const CONTEXT_SECTIONS = { group: 'groups', space: 'spaces', event: 'events' } as const satisfies Record<ContextPageKind, Section>;
/** The query parameter a section's page names its context with: /groups?group=67, /spaces?space=725, /events?event=821. */
const CONTEXT_PARAMS: Partial<Record<Section, string>> = { groups: 'group', spaces: 'space', events: 'event' };

/** The kind of context whose pages and list a section holds, or null. */
export function sectionContext(section: Section): ContextPageKind | null {
    return section === 'groups' ? 'group' : section === 'spaces' ? 'space' : section === 'events' ? 'event' : null;
}

/**
 * A list: a section, the feed or filter it shows, for Search the words (`q`, trimmed, never
 * empty when present) and the result tab (only when it is not People). Some sections are pages
 * that fill the content pane: Groups or Spaces with a `group` (the context's profile id) is that
 * group's or space's page (none: the ones to browse) at `groupTab`, and Profile is a profile's
 * page, `profile` (none: the acting profile) at `profileTab`. Default tabs are not written out.
 */
export type ListRoute = {
    section: Section;
    feed?: FeedName;
    filter?: ListFilter;
    q?: string;
    tab?: SearchTab;
    group?: string;
    groupTab?: GroupTab;
    profile?: string;
    profileTab?: ProfileTab;
    /** The tab of Connections, when it is not Friends. */
    connections?: ConnectionsTab;
    /** Posts' or Discussions' list of one category (its id), as a Categories block opens it. */
    category?: string;
    /**
     * Tasks: whose tasks the section shows. None of these: My tasks, assigned to one (`taskRole`
     * `created`: those one added; `feed` `completed`: the completed ones). `taskView` `timers`:
     * My timers. `taskContext`: a context's tasks (`taskList`: one of its lists, `inbox` its
     * Inbox), open or (`feed`) completed; with `taskView` `budget`, its budget instead.
     */
    taskRole?: 'created';
    taskView?: 'timers' | 'budget';
    taskContext?: string;
    taskList?: string;
    /**
     * `page`: a page of the site the app has no screen of its own for, drawn from its blocks
     * (GET /layout/resolve): its path there (`/page/<uri>`, with its query). A sidebar item of the
     * site's menus opens one (shell/sidebar-navigation.tsx).
     */
    page?: string;
};

/** A path on the site GET /layout/resolve takes: one path, from its root, without a host. */
export function isSitePath(path: string): boolean {
    return path.startsWith('/') && !path.startsWith('//') && path.length <= 2048 && !/[\s#]/.test(path);
}

/** A page of the site in the content pane (`/page?path=%2Fpage%2Fabout`); null for no such path. */
export function sitePage(path: string): ListRoute | null {
    return isSitePath(path) ? { section: 'page', page: path } : null;
}

/**
 * The Tasks section at My tasks, My timers, a context's tasks (a list of it) or a context's
 * budget (`view` `budget` with its `context`); the defaults are not written out.
 */
export function tasksPage(page: { role?: 'assigned' | 'created'; view?: 'timers' | 'budget'; context?: string; list?: string | null; completed?: boolean } = {}): ListRoute {
    if (page.view === 'timers') return { section: 'tasks', taskView: 'timers' };
    if (page.view === 'budget') return page.context ? { section: 'tasks', taskContext: page.context, taskView: 'budget' } : { section: 'tasks' };
    const list: ListRoute = { section: 'tasks' };
    if (page.context) {
        list.taskContext = page.context;
        if (page.list) list.taskList = page.list;
    } else if (page.role === 'created') list.taskRole = 'created';
    if (page.completed) list.feed = 'completed';
    return list;
}

function tasksQuery(list: ListRoute): string {
    const params = new URLSearchParams();
    if (list.taskView === 'timers') params.set('view', 'timers');
    else if (list.taskView === 'budget' && list.taskContext) {
        params.set('context', list.taskContext);
        params.set('view', 'budget');
    } else {
        if (list.taskContext) {
            params.set('context', list.taskContext);
            if (list.taskList) params.set('list', list.taskList);
        } else if (list.taskRole === 'created') params.set('role', 'created');
        if (list.feed === 'completed') params.set('feed', 'completed');
    }
    const q = params.toString();
    return q ? `?${q}` : '';
}

/** The Tasks list route of a path's query, or null when it is not one tasksQuery writes. */
function parseTasksQuery(query: string): ListRoute | null {
    const params = new URLSearchParams(query);
    const keys = [...params.keys()];
    if (keys.some((k) => !['view', 'role', 'context', 'list', 'feed'].includes(k)) || new Set(keys).size !== keys.length) return null;
    const view = params.get('view');
    const role = params.get('role');
    const context = params.get('context');
    const taskList = params.get('list');
    const feed = params.get('feed');
    if (view !== null && view !== 'timers' && view !== 'budget') return null;
    if (role !== null && role !== 'created') return null;
    if (feed !== null && feed !== 'completed') return null;
    if (context !== null && !ID.test(context)) return null;
    if (taskList !== null && (context === null || (taskList !== 'inbox' && !ID.test(taskList)))) return null;
    const list = tasksPage({ view: view ?? undefined, role: role ?? undefined, context: context ?? undefined, list: taskList, completed: feed !== null } as Parameters<typeof tasksPage>[0]);
    // one form only
    return tasksQuery(list) === `?${query}` ? list : null;
}

/** The sections whose list can show one category: Posts and Discussions. */
export const CATEGORY_SECTIONS = ['posts', 'discussions'] as const;
export type CategorySection = (typeof CATEGORY_SECTIONS)[number];

export function isCategorySection(section: Section): section is CategorySection {
    return (CATEGORY_SECTIONS as readonly string[]).includes(section);
}

/**
 * Posts' or Discussions' list of one category (none: all of them), at a feed of the section,
 * its default one not written out. One's own posts (Mine) are of every category: that feed
 * drops it.
 */
export function categoryPage(section: CategorySection, category: string | null, feed?: FeedName): ListRoute {
    const list = feed ? feedRoute(section, feed) : { section };
    return category && list.feed !== 'mine' ? { ...list, category } : list;
}

/** A group's page in the content pane, at one of its tabs. */
export function groupPage(id: string, tab: GroupTab = 'posts'): ListRoute {
    return contextPage('group', id, tab);
}

/** A group's or a space's page in the content pane, at one of its tabs. */
export function contextPage(kind: ContextPageKind, id: string, tab: GroupTab = 'posts'): ListRoute {
    const section = CONTEXT_SECTIONS[kind];
    return tab === 'posts' ? { section, group: id } : { section, group: id, groupTab: tab };
}

/** The detail route of a context (a window of its own shows it); Posts is not written out. */
export function contextDetailRoute(kind: ContextPageKind, id: string, tab: GroupTab = 'posts'): DetailRoute {
    return tab === 'posts' ? { kind, id } : { kind, id, tab };
}

/** A profile's page in the content pane (no id: the acting profile's), at one of its tabs. */
export function profilePage(id: string | null, tab: ProfileTab = 'posts'): ListRoute {
    const list: ListRoute = { section: 'profile' };
    if (id) list.profile = id;
    if (tab !== 'posts') list.profileTab = tab;
    return list;
}

/** A group's page, with nothing open beside it. */
export function groupRoute(id: string, tab: GroupTab = 'posts'): Route {
    return { list: groupPage(id, tab), detail: null };
}

/** A group's or a space's page, with nothing open beside it. */
export function contextRoute(kind: ContextPageKind, id: string, tab: GroupTab = 'posts'): Route {
    return { list: contextPage(kind, id, tab), detail: null };
}

/** Whether a list route is a page (a profile, a group, a space) rather than a list of things to open. */
export function isPage(list: ListRoute): boolean {
    return list.section === 'profile' || (!!sectionContext(list.section) && !!list.group);
}

/**
 * The page a list route shows as the detail a window of its own takes (Open in New Window on a
 * page), or null for a list. One's own profile page names no id: `ownId` is the acting profile.
 */
export function pageDetail(list: ListRoute, ownId?: string): DetailRoute | null {
    const context = sectionContext(list.section);
    if (context && list.group) return contextDetailRoute(context, list.group, list.groupTab);
    if (list.section !== 'profile') return null;
    const id = list.profile ?? ownId;
    return id ? profileRoute(id, list.profileTab) : null;
}

/**
 * The main window's form of a route: a profile or a group is a page in the content pane, not a
 * detail beside a list, so a route that opens one as a detail (a link, a notification, an older
 * path, a deep link) opens its page instead. Windows of their own keep them as details.
 */
export function pageRoute(route: Route): Route {
    const d = route.detail;
    if (d?.kind === 'profile') return { list: profilePage(d.id, d.tab), detail: null };
    if (d?.kind === 'group' || d?.kind === 'space' || d?.kind === 'event') return { list: contextPage(d.kind, d.id, d.tab), detail: null };
    // a part of a section shows beside that section's own list, never beside another's
    const own = d ? DETAIL_SECTIONS[d.kind] : undefined;
    if (own && route.list.section !== own) return { list: { section: own }, detail: d };
    return route;
}

/**
 * Details that are a part of one section and show only beside its list: a part of Settings
 * beside Settings' parts, a new conversation beside the inbox. Opened from anywhere else (a
 * link, an older path, a stray openDetail), the section comes with them, so nothing of Settings
 * ever stands beside the notifications. Items (a post, a video) open beside the list they were
 * picked in.
 */
const DETAIL_SECTIONS: Partial<Record<DetailRoute['kind'], Section>> = { settings: 'settings', 'new-message': 'messages' };

const ID = /^[1-9][0-9]{0,18}$/;

/** The list route of a search: the words trimmed, the default tab not written out. */
export function searchRoute(q: string, tab: SearchTab = 'people'): ListRoute {
    const words = q.trim().slice(0, SEARCH_MAX);
    const list: ListRoute = { section: 'search' };
    if (words) list.q = words;
    if (tab !== 'people') list.tab = tab;
    return list;
}

/** The filters a section's list has (none for most). */
export function sectionFilters(section: Section): readonly ListFilter[] {
    return (LIST_FILTERS as Partial<Record<Section, readonly ListFilter[]>>)[section] ?? [];
}

/** The feeds of a section (none for sections that are not feeds). */
export function sectionFeeds(section: Section): readonly FeedName[] {
    return (SECTION_FEEDS as Partial<Record<Section, readonly FeedName[]>>)[section] ?? [];
}

/** The feed a list route shows: its own, or its section's default. */
export function listFeed(list: ListRoute): FeedName | null {
    return list.feed ?? sectionFeeds(list.section)[0] ?? null;
}

/** The list route of a section's feed; the default feed is not written out. */
export function feedRoute(section: Section, feed: FeedName): ListRoute {
    const feeds = sectionFeeds(section);
    return feeds.includes(feed) && feeds[0] !== feed ? { section, feed } : { section };
}

/** The parts of a profile's page; Posts (the timeline) is the default, `articles` the Posts module's posts. */
export const PROFILE_TABS = ['posts', 'friends', 'followers', 'following', 'events', 'articles', 'videos', 'photos', 'albums', 'files', 'polls', 'about'] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

export type DetailRoute =
    /** A post; `comment` is a comment to show in it, `thread` the top-level comment a reply is listed under. */
    | { kind: 'post'; id: string; comment?: string; thread?: string }
    | { kind: 'conversation'; id: string }
    /** A discussion; `comment` is a reply to show in it, `thread` the top-level reply it is listed under. */
    | { kind: 'discussion'; id: string; comment?: string; thread?: string }
    /** A new discussion, in the group with this profile id when one is given. */
    | { kind: 'new-discussion'; groupId?: string }
    /** A video (GET /videos/{id}): its player, text and comments beside the list. */
    | { kind: 'video'; id: string }
    /** Adding a video (an upload or a link), in the context with this profile id when one is given. */
    | { kind: 'new-video'; contextId?: string }
    /** A photo (GET /photos/{id}): the picture, its text and comments beside the list. */
    | { kind: 'photo'; id: string }
    /** Adding photos (one for each upload), in the context with this profile id when one is given. */
    | { kind: 'new-photos'; contextId?: string }
    /** An album (GET /albums/{id}): its photos as a grid, its text and comments beside the list. */
    | { kind: 'album'; id: string }
    /** Making an album, in the context with this profile id when one is given. */
    | { kind: 'new-album'; contextId?: string }
    /** A file (GET /files/{id}): its preview where it has one, Download, its description and comments beside the list. */
    | { kind: 'file'; id: string }
    /** Adding files (one for each upload), in the context with this profile id when one is given. */
    | { kind: 'new-files'; contextId?: string }
    /** A task (GET /tasks/{id}): done or not, where it is, when it is due, who does it, its text and comments beside the list. */
    | { kind: 'task'; id: string }
    /** A poll (GET /polls/{id}): its answers to vote in or its results, and its comments beside the list. */
    | { kind: 'poll'; id: string }
    /**
     * A post of the Posts module (GET /posts/{id}): its cover, title, whole text and comments beside
     * the list. Not `post`, which is a feed item (an activity) and its thread.
     */
    | { kind: 'article'; id: string }
    /** Writing a post of the Posts module, in the context with this profile id when one is given. */
    | { kind: 'new-article'; contextId?: string }
    /** A new conversation, with this profile as its first recipient when one is given. */
    | { kind: 'new-message'; profileId?: string }
    /** A profile (in a window of its own; the main window shows it as a page); `tab` only when it is not Posts. */
    | { kind: 'profile'; id: string; tab?: ProfileTab }
    /**
     * A group, space or event (in a window of its own; the main window shows it as a page); `tab`
     * only when it is not Posts. One member for the three kinds: their tabs times their kinds are
     * more than TypeScript checks member by member.
     */
    | { kind: ContextPageKind; id: string; tab?: GroupTab }
    /** A part of Settings. */
    | { kind: 'settings'; tab: SettingsTab }
    /** Editing a profile of one's own (its name, about, picture and cover). */
    | { kind: 'edit-profile'; id: string };

/** The detail route of a profile's tab; Posts is not written out. */
export function profileRoute(id: string, tab: ProfileTab = 'posts'): DetailRoute {
    return tab === 'posts' ? { kind: 'profile', id } : { kind: 'profile', id, tab };
}

export type Route = { list: ListRoute; detail: DetailRoute | null };

export function sectionRoute(section: Section): Route {
    return { list: { section }, detail: null };
}

export function detailPath(detail: DetailRoute): string {
    switch (detail.kind) {
        case 'edit-profile':
            return `${detail.kind}/${encodeURIComponent(detail.id)}`;
        case 'settings':
            return `${detail.kind}/${detail.tab}`;
        case 'new-message':
            return detail.profileId ? `${detail.kind}/${encodeURIComponent(detail.profileId)}` : detail.kind;
        case 'profile':
        case 'group':
        case 'space':
        case 'event':
            return `${detail.kind}/${encodeURIComponent(detail.id)}${detail.tab && detail.tab !== 'posts' ? `/${detail.tab}` : ''}`;
        case 'post':
        case 'discussion':
            return `${detail.kind}/${encodeURIComponent(detail.id)}${detail.comment ? `/${commentPart(detail.comment, detail.thread)}` : ''}`;
        case 'new-discussion':
            return detail.groupId ? `${detail.kind}/${encodeURIComponent(detail.groupId)}` : detail.kind;
        case 'new-video':
        case 'new-photos':
        case 'new-album':
        case 'new-files':
        case 'new-article':
            return detail.contextId ? `${detail.kind}/${encodeURIComponent(detail.contextId)}` : detail.kind;
        default:
            return `${detail.kind}/${encodeURIComponent(detail.id)}`;
    }
}

/** A comment in a post's path: "comment-99", or "comment-99-in-55" for a reply under comment 55. */
function commentPart(comment: string, thread?: string): string {
    return `comment-${encodeURIComponent(comment)}${thread ? `-in-${encodeURIComponent(thread)}` : ''}`;
}

const COMMENT_PART = /^comment-([1-9][0-9]*)(?:-in-([1-9][0-9]*))?$/;

function listQuery(list: ListRoute): string {
    if (list.section === 'tasks') return tasksQuery(list);
    if (list.section === 'page') return list.page ? `?path=${encodeURIComponent(list.page)}` : '';
    if (list.category && isCategorySection(list.section)) return `?${list.feed ? `feed=${list.feed}&` : ''}category=${encodeURIComponent(list.category)}`;
    if (list.feed) return `?feed=${list.feed}`;
    if (list.section === 'connections') return list.connections && list.connections !== 'friends' ? `?tab=${list.connections}` : '';
    const contextParam = CONTEXT_PARAMS[list.section];
    if (contextParam) return list.group ? `?${contextParam}=${encodeURIComponent(list.group)}${list.groupTab && list.groupTab !== 'posts' ? `&tab=${list.groupTab}` : ''}` : '';
    if (list.section === 'profile') {
        const params = new URLSearchParams();
        if (list.profile) params.set('id', list.profile);
        if (list.profileTab && list.profileTab !== 'posts') params.set('tab', list.profileTab);
        const query = params.toString();
        return query ? `?${query}` : '';
    }
    if (list.section === 'search') {
        const params = new URLSearchParams();
        if (list.q) params.set('q', list.q);
        if (list.tab && list.tab !== 'people') params.set('tab', list.tab);
        const query = params.toString();
        return query ? `?${query}` : '';
    }
    return list.filter ? `?filter=${list.filter}` : '';
}

/** The list part of a route as a path, e.g. "/home", "/connections?tab=requests", "/home?feed=hot", "/posts?feed=popular&category=3", "/notifications?filter=unread", "/search?q=lily&tab=posts", "/groups?group=67&tab=members", "/spaces?space=725&tab=spaces" or "/profile?id=8&tab=friends". Keys the list's scroll memory. */
export function listPath(list: ListRoute): string {
    return `/${list.section}${listQuery(list)}`;
}

/** "/home", "/home/post/12", "/home/post/12?feed=hot", "/messages/conversation/7", "/notifications/post/12/comment-99-in-55". */
export function routeToPath(route: Route): string {
    const list = `/${route.list.section}`;
    return (route.detail ? `${list}/${detailPath(route.detail)}` : list) + listQuery(route.list);
}

function isSection(value: string): value is Section {
    return (SECTIONS as readonly string[]).includes(value);
}

/** The route of a path made by routeToPath, or null for anything else. */
export function parseRoute(path: string): Route | null {
    const [pathname = '', query, ...more] = path.split('?');
    if (more.length) return null;
    const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
    const [section, kind, rawId, tab, ...rest] = parts;
    if (!section || !isSection(section) || rest.length) return null;
    // only a profile, group, space or event (its tab) and a post or discussion (a comment in it) have a fourth part
    if (tab !== undefined && kind !== 'profile' && kind !== 'group' && kind !== 'space' && kind !== 'event' && kind !== 'post' && kind !== 'discussion') return null;
    let list: ListRoute = { section };
    if (section === 'search') {
        const parsed = parseSearchQuery(query);
        if (!parsed) return null;
        list = parsed;
    } else if (sectionContext(section) && query !== undefined && !new URLSearchParams(query).has('feed')) {
        const param = CONTEXT_PARAMS[section] ?? 'group';
        const params = new URLSearchParams(query);
        const group = params.get(param);
        const groupTab = params.get('tab');
        if (group === null || !ID.test(group) || [...params.keys()].some((k) => k !== param && k !== 'tab')) return null;
        const context = sectionContext(section) ?? 'group';
        if (groupTab !== null && !contextHasTab(context, groupTab)) return null;
        list = contextPage(context, group, (groupTab ?? 'posts') as GroupTab);
        // one form only: group first, the default tab not written out
        if (listQuery(list) !== `?${query}`) return null;
    } else if (section === 'connections' && query !== undefined) {
        const params = new URLSearchParams(query);
        const tab = params.get('tab');
        if ([...params.keys()].some((k) => k !== 'tab') || tab === null || !(CONNECTIONS_TABS as readonly string[]).includes(tab)) return null;
        list = connectionsPage(tab as ConnectionsTab);
        // the default tab is never written out, so a path has one form only
        if (listQuery(list) !== `?${query}`) return null;
    } else if (section === 'profile' && query !== undefined) {
        const params = new URLSearchParams(query);
        const profile = params.get('id');
        const profileTab = params.get('tab');
        if ([...params.keys()].some((k) => k !== 'id' && k !== 'tab')) return null;
        if (profile !== null && !ID.test(profile)) return null;
        if (profileTab !== null && !(PROFILE_TABS as readonly string[]).includes(profileTab)) return null;
        list = profilePage(profile, (profileTab ?? 'posts') as ProfileTab);
        if (listQuery(list) !== `?${query}`) return null;
    } else if (section === 'page' && query !== undefined) {
        const params = new URLSearchParams(query);
        const page = params.get('path');
        if ([...params.keys()].some((k) => k !== 'path') || page === null) return null;
        const parsed = sitePage(page);
        if (!parsed || listQuery(parsed) !== `?${query}`) return null;
        list = parsed;
    } else if (section === 'tasks' && query !== undefined) {
        const parsed = parseTasksQuery(query);
        if (!parsed) return null;
        list = parsed;
    } else if (query !== undefined && isCategorySection(section) && new URLSearchParams(query).has('category')) {
        const params = new URLSearchParams(query);
        const category = params.get('category');
        const feed = params.get('feed');
        if (category === null || !ID.test(category) || [...params.keys()].some((k) => k !== 'category' && k !== 'feed')) return null;
        if (feed !== null && !sectionFeeds(section).includes(feed as FeedName)) return null;
        list = categoryPage(section, category, (feed ?? undefined) as FeedName | undefined);
        // one form only: the feed first, the default feed not written out, no category with Mine
        if (listQuery(list) !== `?${query}`) return null;
    } else if (query !== undefined) {
        const params = new URLSearchParams(query);
        const keys = [...params.keys()];
        const feed = params.get('feed');
        const filter = params.get('filter');
        if (keys.length !== 1) return null;
        if (feed !== null) {
            if (!sectionFeeds(section).includes(feed as FeedName)) return null;
            list = feedRoute(section, feed as FeedName);
        } else if (filter !== null) {
            if (!sectionFilters(section).includes(filter as ListFilter)) return null;
            list = { section, filter: filter as ListFilter };
        } else return null;
    }
    if (kind === undefined) return { list, detail: null };
    // the friend requests were a detail beside any list once (an older path, a una:// link):
    // they are Connections' Requests tab now
    if (kind === 'friend-requests') return rawId === undefined && tab === undefined ? connectionsRoute('requests') : null;
    if ((kind === 'new-message' || kind === 'new-discussion' || kind === 'new-video' || kind === 'new-photos' || kind === 'new-album' || kind === 'new-files' || kind === 'new-article') && rawId === undefined) return { list, detail: { kind } };
    if (rawId === undefined || rawId === '') return null;
    let id: string;
    try {
        id = decodeURIComponent(rawId);
    } catch {
        return null;
    }
    switch (kind) {
        case 'post':
        case 'discussion': {
            if (tab === undefined) return { list, detail: { kind, id } };
            const m = COMMENT_PART.exec(tab);
            if (!m?.[1]) return null;
            return { list, detail: m[2] ? { kind, id, comment: m[1], thread: m[2] } : { kind, id, comment: m[1] } };
        }
        case 'conversation':
            return tab === undefined ? { list, detail: { kind, id } } : null;
        case 'group':
        case 'space':
        case 'event':
            if (!ID.test(id)) return null;
            if (tab === undefined) return { list, detail: { kind, id } };
            if (tab === 'posts' || !contextHasTab(kind, tab)) return null;
            return { list, detail: { kind, id, tab } };
        case 'edit-profile':
            return ID.test(id) ? { list, detail: { kind, id } } : null;
        case 'settings':
            return (SETTINGS_TABS as readonly string[]).includes(id) ? { list, detail: { kind, tab: id as SettingsTab } } : null;
        case 'new-message':
            return { list, detail: { kind, profileId: id } };
        case 'new-discussion':
            return ID.test(id) ? { list, detail: { kind, groupId: id } } : null;
        case 'new-video':
        case 'new-photos':
        case 'new-album':
        case 'new-files':
        case 'new-article':
            return tab === undefined && ID.test(id) ? { list, detail: { kind, contextId: id } } : null;
        case 'video':
        case 'photo':
        case 'album':
        case 'file':
        case 'task':
        case 'poll':
        case 'article':
            return tab === undefined && ID.test(id) ? { list, detail: { kind, id } } : null;
        case 'profile':
            if (tab === undefined) return { list, detail: { kind, id } };
            // the default tab is never written out, so a path has one form only
            if (tab === 'posts' || !(PROFILE_TABS as readonly string[]).includes(tab)) return null;
            return { list, detail: { kind, id, tab: tab as ProfileTab } };
        default:
            return null;
    }
}

/** The list route of a search path's query, or null when it is not one routeToPath makes. */
function parseSearchQuery(query: string | undefined): ListRoute | null {
    if (query === undefined) return { section: 'search' };
    const params = new URLSearchParams(query);
    const keys = [...params.keys()];
    if (!keys.length || keys.some((k) => k !== 'q' && k !== 'tab') || new Set(keys).size !== keys.length) return null;
    const q = params.get('q');
    const tab = params.get('tab');
    if (q !== null && (q !== q.trim() || !q || q.length > SEARCH_MAX)) return null;
    // the default tab is never written out, so a path has one form only
    if (tab !== null && (tab === 'people' || !(SEARCH_TABS as readonly string[]).includes(tab))) return null;
    const list = searchRoute(q ?? '', (tab ?? 'people') as SearchTab);
    // one order of the parameters only: q first
    return listQuery(list) === `?${query}` ? list : null;
}

export function sameRoute(a: Route, b: Route): boolean {
    return routeToPath(a) === routeToPath(b);
}

type Listener = () => void;

/** Back/forward over routes, newest last. Pushing after going back drops the forward entries. */
export class RouteHistory {
    private entries: Route[];
    private index = 0;
    private listeners = new Set<Listener>();

    /**
     * `normalize` gives each route its form in this window before it is kept: the main window's
     * opens profiles and groups as pages (pageRoute); a window of its own passes one that keeps them.
     */
    constructor(
        initial: Route,
        private readonly limit = 100,
        private readonly normalize: (route: Route) => Route = pageRoute,
    ) {
        this.entries = [normalize(initial)];
    }

    get current(): Route {
        return this.entries[this.index] ?? this.entries[0]!;
    }

    get canGoBack(): boolean {
        return this.index > 0;
    }

    get canGoForward(): boolean {
        return this.index < this.entries.length - 1;
    }

    /** Paths, oldest first, and the current position (for tests and debugging). */
    snapshot(): { paths: string[]; index: number } {
        return { paths: this.entries.map(routeToPath), index: this.index };
    }

    push(next: Route): void {
        const route = this.normalize(next);
        if (sameRoute(route, this.current)) return;
        this.entries = [...this.entries.slice(0, this.index + 1), route];
        if (this.entries.length > this.limit) this.entries = this.entries.slice(this.entries.length - this.limit);
        this.index = this.entries.length - 1;
        this.emit();
    }

    replace(next: Route): void {
        const route = this.normalize(next);
        if (sameRoute(route, this.current)) return;
        this.entries = this.entries.map((r, i) => (i === this.index ? route : r));
        this.emit();
    }

    /** Start over at one route, with nothing to go back or forward to (another profile acts now). */
    reset(route: Route): void {
        this.entries = [this.normalize(route)];
        this.index = 0;
        this.emit();
    }

    /**
     * A detail that no longer exists (a deleted post): every entry that shows it shows its list
     * instead, so neither the current route nor Back or Forward opens it again. Entries that
     * become the same as the one before them are merged.
     */
    forget(detail: DetailRoute): void {
        const path = detailPath(detail);
        // a post (or a discussion) goes with every comment in it that a route points to
        const shows = (d: DetailRoute) => detailPath(d) === path || ((detail.kind === 'post' || detail.kind === 'discussion') && d.kind === detail.kind && d.id === detail.id);
        if (!this.entries.some((r) => r.detail && shows(r.detail))) return;
        const before = this.current;
        const entries: Route[] = [];
        let index = 0;
        this.entries.forEach((r, i) => {
            const route = r.detail && shows(r.detail) ? { list: r.list, detail: null } : r;
            const last = entries[entries.length - 1];
            if (!last || !sameRoute(last, route)) entries.push(route);
            if (i === this.index) index = entries.length - 1;
        });
        this.entries = entries;
        this.index = index;
        // the current route object stays the same when it did not change, so nothing re-renders for it
        if (!sameRoute(before, this.current)) this.emit();
        else if (this.entries[this.index] !== before) this.entries[this.index] = before;
    }

    back(): boolean {
        if (!this.canGoBack) return false;
        this.index--;
        this.emit();
        return true;
    }

    forward(): boolean {
        if (!this.canGoForward) return false;
        this.index++;
        this.emit();
        return true;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit() {
        for (const l of this.listeners) l();
    }
}

/** Scroll positions by key (a list or detail path), so returning to a route lands where it was. */
export class ScrollMemory {
    private positions = new Map<string, number>();

    constructor(private readonly limit = 200) {}

    get(key: string): number | undefined {
        return this.positions.get(key);
    }

    clear(): void {
        this.positions.clear();
    }

    set(key: string, top: number): void {
        this.positions.delete(key);
        this.positions.set(key, top);
        if (this.positions.size > this.limit) {
            const oldest = this.positions.keys().next().value;
            if (oldest !== undefined) this.positions.delete(oldest);
        }
    }
}
