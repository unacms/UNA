/**
 * The sidebar as the network's site sets it up (GET /navigation): UNA's Apps Sidebar menu, edited
 * in Studio > Navigation (docs/api-v2.md, "Navigation: how the apps' sidebar is built and edited
 * in Studio"; the server's side is template/scripts/BxBaseApiV2Navigation.php). This file turns
 * the answer into rows: where each item goes in the content pane (targetList), the icon the app
 * falls back to, which live badge it carries, and which row is the current one. The sidebar draws
 * them (shell/sidebar-navigation.tsx).
 *
 * The answer is kept with the network's offline data (persist.ts `navigation`), so the sidebar of
 * the last run shows at once. A site without the route (404) gets the app's fixed sidebar, as
 * does a network whose first answer has not come yet.
 */
import { useQuery } from '@tanstack/react-query';

import type { Schema } from 'una-api';

import type { IconName } from '../components/icon';
import { SECTION_ICONS, type ShownIcon } from './section-icons';
import { ApiError, unwrap } from './api';
import { useApp } from './context';
import { connectionsPage, type ConnectionsTab, contextPage, type DetailRoute, feedRoute, type FeedName, type ListRoute, profilePage, sectionFeeds, sitePage } from './router';
import type { CommandId } from './shortcuts';
import { contextKindOf, profileDetail } from './site-modules';

export type Navigation = Schema<'Navigation'>;
export type NavigationItem = Schema<'NavigationItem'>;
export type NavigationTarget = Schema<'NavigationTarget'>;
export type NavigationContext = Schema<'NavigationContext'>;

export const NAVIGATION_KEY = ['navigation'] as const;

/**
 * GET /navigation for the desktop app: the answer, null for a site without the route (its fixed
 * sidebar), undefined until it is known. Kept 5 minutes, and offline (persist.ts).
 */
export function useSiteNavigation(): Navigation | null | undefined {
    const { api } = useApp();
    const query = useQuery({
        queryKey: NAVIGATION_KEY,
        queryFn: async (): Promise<Navigation | null> => {
            try {
                return unwrap(await api.GET('/navigation', { params: { query: { platform: 'desktop-app' } } }));
            } catch (e) {
                // an older site: no such route
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        staleTime: 5 * 60_000,
    });
    return query.data;
}

/** Which of the sync's counts a row shows instead of the site's counter (it is live). */
export type LiveBadge = 'notifications' | 'messages' | 'requests';

/** A row of the sidebar: one item of the site's menus that the app can open. */
export type NavRowModel = {
    key: string;
    label: string;
    /** The Lucide icon the site names (Studio's), when the app has it. */
    icon: string | null;
    /** The app's own icon for where it goes, when the site names none the app has. */
    fallbackIcon: IconName;
    /** Where it goes: always the content pane, with nothing open beside it. */
    list: ListRoute;
    /** The site's Tasks item: the app draws its Tasks section there. */
    tasks?: boolean;
    command?: CommandId;
    live?: LiveBadge;
    /** The site's counter (one's posts ...); null for none. */
    counter: number | null;
};

/** A context (or a person) one follows, a row with its picture. */
export type NavContextModel = { id: string; name: string; context: NavigationContext; list: ListRoute; detail: DetailRoute };

/** A module of Member Following: its heading, the contexts, and a Browse row where the app has the section. */
/**
 * A module of Member Memberships (or Member Following): its contexts (at most 10), whether there
 * are more, where all of them open (`all`: All your groups) and where its contexts are browsed
 * (`browse`: Browse groups).
 */
export type NavFollowingsModel = { key: string; title: string; icon: string | null; fallbackIcon: IconName; browse: ListRoute | null; all: ListRoute | null; contexts: NavContextModel[]; more: boolean };

export type NavGroupModel =
    | { kind: 'items'; key: string; title: string; rows: NavRowModel[] }
    | { kind: 'followings'; key: string; title: string; modules: NavFollowingsModel[] };

type Ctx = {
    /** The acting profile: its own profile is the Profile section. */
    ownId?: string;
    /** Whether the content pane's Media has this tab (a media module the site lists). */
    hasMediaTab?: (tag: string) => boolean;
    /** Said in the developer console for each item the app leaves out (tests listen). */
    onSkipped?: (item: NavigationItem, why: string) => void;
};

const MEDIA_TAGS: readonly string[] = ['videos', 'photos', 'albums', 'files'];

/** The section's feed for a module's view, where the app's section has that feed. */
const FEED_VIEWS: Record<string, Record<string, FeedName>> = {
    posts: { popular: 'popular', mine: 'mine' },
    discussions: { new: 'new' },
    events: { joined: 'going' },
    groups: { joined: 'joined' },
    spaces: { joined: 'joined' },
    persons: { recent: 'recent', active: 'active', online: 'online', friends: 'friends' },
};

const CONNECTIONS_VIEWS: Record<string, ConnectionsTab> = { friends: 'friends', requests: 'requests', following: 'following', followers: 'followers' };

/** The sections the app has, by the site's name of them (a module's tag, or the system's own). */
const SECTIONS: Record<string, ListRoute['section']> = {
    home: 'home',
    explore: 'explore',
    notifications: 'notifications',
    conversations: 'messages',
    connections: 'connections',
    persons: 'people',
    posts: 'posts',
    discussions: 'discussions',
    events: 'events',
    groups: 'groups',
    spaces: 'spaces',
    tasks: 'tasks',
};

/**
 * Where a target opens in the content pane, or null when the app has no screen for it and the
 * site gives no page to draw: a section of the app (at a view of it where the app has one), one's
 * own profile, someone's profile, a context's page, or the site's page (`path`, page-blocks).
 */
export function targetList(target: NavigationTarget | null | undefined, ctx: Ctx = {}): ListRoute | null {
    if (!target) return null;
    const page = target.path ? sitePage(target.path) : null;
    switch (target.kind) {
        case 'section': {
            const name = target.section ?? '';
            if (MEDIA_TAGS.includes(name)) return ctx.hasMediaTab?.(name) === false ? page : feedRoute('media', name as FeedName);
            const section = SECTIONS[name];
            if (!section) return page;
            if (section === 'connections') return connectionsPage(CONNECTIONS_VIEWS[target.view ?? ''] ?? 'friends');
            const feed = FEED_VIEWS[name]?.[target.view ?? ''];
            return feed && sectionFeeds(section).includes(feed) ? feedRoute(section, feed) : { section };
        }
        case 'profile':
            if (!target.id) return page;
            return target.id === ctx.ownId ? { section: 'profile' } : profilePage(target.id);
        case 'context': {
            if (!target.id) return page;
            const kind = contextKindOf(target.module);
            return kind ? contextPage(kind, target.id) : profilePage(target.id);
        }
        case 'page':
            return page;
        default:
            return page;
    }
}

/** The app's name of where a target goes, for its fallback icon and its live badge. */
function placeOf(target: NavigationTarget | null | undefined, list: ListRoute, ownId?: string): string {
    if (target?.kind === 'section' && target.section) return target.section;
    if (target?.kind === 'profile' && target.id === ownId) return 'profile';
    if (list.section === 'page') return 'page';
    return list.section;
}

const COMMANDS: Record<string, CommandId> = { home: 'go-home', explore: 'go-explore', notifications: 'go-notifications', conversations: 'go-messages', profile: 'go-profile' };
const LIVE: Record<string, LiveBadge> = { notifications: 'notifications', conversations: 'messages', connections: 'requests' };

/** A list route's string for telling two rows that go to the same place apart. */
function listKey(list: ListRoute): string {
    return JSON.stringify(Object.entries(list).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * The sidebar's groups from the answer: each group's items the app can open, in the site's
 * order. An item that goes nowhere the app can draw is left out (said in the console), and so is
 * one that goes where a row above it goes already (the site menu's Groups and one's own Groups
 * are the same Groups section here). The viewer's profile group (Member Avatar) is the app's
 * profile button at the foot, so it draws no group.
 */
export function sidebarModel(nav: Navigation, ctx: Ctx = {}): NavGroupModel[] {
    const seen = new Set<string>();
    const commands = new Set<CommandId>();
    const skipped = ctx.onSkipped ?? (() => {});
    const out: NavGroupModel[] = [];
    for (const group of nav.groups) {
        if (group.kind === 'profile') continue;
        if (group.kind === 'followings') {
            const modules: NavFollowingsModel[] = [];
            for (const item of group.items) {
                const contexts = item.contexts.map((c) => ({
                    id: c.id,
                    name: c.display_name,
                    context: c,
                    list: c.kind === 'group' && contextKindOf(c.module) ? contextPage(contextKindOf(c.module)!, c.id) : profilePage(c.id),
                    detail: profileDetail(c),
                }));
                if (!contexts.length) continue;
                const browse = targetList(item.target, ctx);
                const all = targetList(item.all_target, ctx);
                modules.push({ key: item.id, title: item.title, icon: item.icon, fallbackIcon: SECTION_ICONS[placeOf(item.target, browse ?? { section: 'page' }, ctx.ownId)] ?? 'users-round', browse, all, contexts, more: item.more_contexts });
            }
            if (modules.length) out.push({ kind: 'followings', key: group.id, title: group.title, modules });
            continue;
        }
        const rows: NavRowModel[] = [];
        for (const item of group.items) {
            const list = targetList(item.target, ctx);
            if (!list) {
                skipped(item, item.target ? `no screen for ${item.target.kind} ${item.target.section ?? ''} and no page to draw` : 'it opens nowhere in the apps');
                continue;
            }
            const key = listKey(list);
            if (seen.has(key)) {
                skipped(item, 'a row above goes there already');
                continue;
            }
            seen.add(key);
            const place = placeOf(item.target, list, ctx.ownId);
            const command = COMMANDS[place];
            const row: NavRowModel = { key: item.id, label: item.title, icon: item.icon, fallbackIcon: SECTION_ICONS[place] ?? 'file-text', list, counter: item.counter };
            if (command && !commands.has(command)) {
                row.command = command;
                commands.add(command);
            }
            if (LIVE[place]) row.live = LIVE[place];
            if (list.section === 'tasks' && !list.taskContext && !list.taskView && !list.taskRole) row.tasks = true;
            rows.push(row);
        }
        if (rows.length) out.push({ kind: 'items', key: group.id, title: group.title, rows });
    }
    return out;
}

/** Keys of a list route that name a page of its own (a context, a profile, a site page): they must be the same both ways. */
const PAGE_KEYS = ['group', 'profile', 'page', 'taskContext'] as const;

/**
 * The row the content pane shows now: of the rows whose section it is, the one whose every part
 * (a feed, a tab) the list has, the most specific first. A page of its own (someone's profile, a
 * group) is only its own row's: the Groups row is not current on a group's page.
 */
export function currentRow(rows: readonly { key: string; list: ListRoute }[], list: ListRoute, ownId?: string): string | null {
    let best: string | null = null;
    let bestScore = -1;
    const norm = (l: ListRoute): ListRoute => (l.section === 'profile' && l.profile && l.profile === ownId ? { ...l, profile: undefined } : l);
    const now = norm(list);
    for (const row of rows) {
        const r = norm(row.list);
        if (r.section !== now.section) continue;
        if (PAGE_KEYS.some((k) => (r[k] ?? null) !== (now[k] ?? null))) continue;
        let score = 0;
        let fits = true;
        for (const [k, v] of Object.entries(r)) {
            if (k === 'section' || v === undefined) continue;
            if ((now as Record<string, unknown>)[k] !== v) {
                fits = false;
                break;
            }
            score++;
        }
        if (fits && score > bestScore) {
            best = row.key;
            bestScore = score;
        }
    }
    return best;
}

/**
 * The icon of the row that is current for `list` (its site's icon, else the app's for where it
 * goes): what the pane's title and the tab show, so they match the sidebar. Null when no row is.
 */
export function currentRowIcon(groups: readonly NavGroupModel[], list: ListRoute, ownId?: string): ShownIcon | null {
    const rows: { key: string; list: ListRoute; icon: ShownIcon }[] = [];
    for (const g of groups) {
        if (g.kind === 'items') for (const r of g.rows) rows.push({ key: r.key, list: r.list, icon: { name: r.icon, fallback: r.fallbackIcon } });
        else
            for (const m of g.modules) {
                const icon = { name: m.icon, fallback: m.fallbackIcon };
                if (m.browse) rows.push({ key: `${m.key}|browse`, list: m.browse, icon });
                if (m.all) rows.push({ key: `${m.key}|all`, list: m.all, icon });
            }
    }
    const key = currentRow(rows, list, ownId);
    return rows.find((r) => r.key === key)?.icon ?? null;
}
