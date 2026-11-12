/**
 * The sidebar as the network's site sets it up: UNA's Apps Sidebar menu (Studio > Navigation), from
 * GET /navigation (lib/site-navigation.ts; the server's side is
 * template/scripts/BxBaseApiV2Navigation.php, and docs/api-v2.md, "Navigation: how the apps'
 * sidebar is built and edited in Studio", says what a site owner edits where). Each group of the
 * site's is a list here, under its heading when it has one: one's main places with their
 * counters (the Apps Menu), the site menu's items, and the contexts one belongs to (Member Memberships: Your friends,
 * Your groups, Your spaces ...), each module a section of its own that folds away. Items the viewer may not use are the server's to leave out; items the app can't
 * open, siteModel's.
 *
 * What stays the app's own (not in the site's menus): the network switcher and the search field
 * above, the profile menu and Settings at the foot (sidebar.tsx), and the Tasks section's My
 * timers and task contexts, drawn where the site menu's Tasks item is (SidebarTasks). A site
 * without GET /navigation gets the fixed sidebar of app.tsx.
 *
 * The rules of every sidebar row hold: a row navigates the content pane and closes what is open
 * beside it (Navigation.go, history.push with no detail), rows are 36px with 20px icons, the
 * current one is aria-current="page", and every row is a button in the tab order.
 */
import { type ReactNode, useState } from 'react';

import type { Badges } from '../lib/sync';
import { Avatar } from '../components/avatar';
import { Icon } from '../components/icon';
import { language, t, tn } from '../lib/i18n';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../lib/open-in-window';
import { type ListRoute, listPath, type Section } from '../lib/router';
import { currentRow, type LiveBadge, type NavFollowingsModel, type NavGroupModel, type NavRowModel } from '../lib/site-navigation';
import { readStored, writeStored } from '../lib/storage';
import { SidebarTasks } from '../features/tasks/sidebar-tasks';
import { NavRow } from './sidebar';

type Props = {
    groups: readonly NavGroupModel[];
    /** The content pane's list now (for the current row). */
    list: ListRoute;
    ownId?: string;
    rail: boolean;
    mac: boolean;
    badges: Badges | null;
    /** A row was pressed: show this list with nothing beside it. */
    onGo: (list: ListRoute) => void;
    /** A row was chosen (the overlay sidebar closes). */
    onPicked?: () => void;
    /** The icon rail's own rows after the site's (Search, which the rail has no field for). */
    railExtra?: readonly NavRowModel[];
};

/** The number a row shows and what it says: the sync's live count, or the site's counter. */
export function rowBadge(row: Pick<NavRowModel, 'live' | 'counter'>, badges: Badges | null): { n: number; spoken: string } | null {
    const live: Record<LiveBadge, number | undefined> = { notifications: badges?.notifications, messages: badges?.messages, requests: badges?.friend_requests };
    const n = row.live ? (live[row.live] ?? row.counter ?? 0) : (row.counter ?? 0);
    if (!n) return null;
    if (row.live === 'requests') return { n, spoken: tn(n, ', {{count}} friend request waiting', ', {{count}} friend requests waiting') };
    if (row.live) return { n, spoken: tn(n, ', {{count}} unread', ', {{count}} unread') };
    return { n, spoken: `, ${n}` };
}

/** All's name: the heading's (All your groups). */
export function allLabel(title: string): string {
    // English writes a heading in lower case inside a phrase; other languages keep it (German nouns have their capital)
    return t('All {{title}}', { title: language() === 'en' ? `${title.charAt(0).toLowerCase()}${title.slice(1)}` : title });
}

/** Browse's name for the sections a followed module opens, each a sentence of its own. */
const BROWSE_LABELS: Partial<Record<Section, string>> = {
    people: t('Browse people'),
    groups: t('Browse groups'),
    spaces: t('Browse spaces'),
    events: t('Browse events'),
    posts: t('Browse posts'),
    discussions: t('Browse discussions'),
    media: t('Browse media'),
    tasks: t('Browse tasks'),
    connections: t('Browse connections'),
};

/** Browse's name: the section it opens (Browse groups), not the heading (Your groups). */
export function browseLabel(browse: ListRoute): string {
    return browse.section === 'page' ? t('Browse all') : (BROWSE_LABELS[browse.section] ?? t('Browse {{section}}', { section: browse.section }));
}

function collapsedKey(key: string): string {
    return `sidebar-followings-collapsed:${key}`;
}

function savedCollapsed(key: string): boolean {
    return readStored(collapsedKey(key)) === '1';
}

function saveCollapsed(key: string, collapsed: boolean): void {
    writeStored(collapsedKey(key), collapsed ? '1' : null);
}

export function SidebarNavigation({ groups, list, ownId, rail, mac, badges, onGo, onPicked, railExtra = [] }: Props) {
    const rows: { key: string; list: ListRoute }[] = [];
    for (const g of groups) {
        if (g.kind === 'items') rows.push(...g.rows);
        else
            for (const m of g.modules) {
                if (m.browse) rows.push({ key: `${m.key}|browse`, list: m.browse });
                if (m.all) rows.push({ key: `${m.key}|all`, list: m.all });
                for (const c of m.contexts) rows.push({ key: `${m.key}|${c.id}`, list: c.list });
            }
    }
    rows.push(...railExtra);
    const current = currentRow(rows, list, ownId);
    const go = (to: ListRoute) => {
        onGo(to);
        onPicked?.();
    };
    const row = (r: NavRowModel) => {
        const badge = rowBadge(r, badges);
        return (
            <NavRow
                key={r.key}
                label={r.label}
                siteIcon={{ name: r.icon, fallback: r.fallbackIcon }}
                keys={r.command}
                badge={badge?.n}
                spokenBadge={badge?.spoken}
                rail={rail}
                mac={mac}
                current={current === r.key ? 'page' : undefined}
                onClick={() => go(r.list)}
            />
        );
    };

    if (rail) {
        // icons only: every row, a followed module as its section (its contexts need names)
        const all: NavRowModel[] = [];
        for (const g of groups) {
            if (g.kind === 'items') all.push(...g.rows);
            // a followed module as its section, unless a row goes there already
            else
                for (const m of g.modules) {
                    // a module as where all of its contexts are (Your groups: the ones one is in), else its section
                    const to = m.all ?? m.browse;
                    if (to && !all.some((r) => listPath(r.list) === listPath(to))) all.push({ key: `${m.key}|${m.all ? 'all' : 'browse'}`, label: m.title, icon: m.icon, fallbackIcon: m.fallbackIcon, list: to, counter: null });
                }
        }
        return (
            <div className="sidebar-site-nav">
                <ul className="nav-list">{[...all, ...railExtra].map(row)}</ul>
            </div>
        );
    }

    return (
        <div className="sidebar-site-nav">
            {groups.map((g) =>
                g.kind === 'items' ? (
                    <ItemsGroup key={g.key} groupKey={g.key} title={g.title} rows={g.rows} row={row} onPicked={onPicked} />
                ) : (
                    <div key={g.key} className="sidebar-followings">
                        {g.title ? <h2 className="sidebar-group-title">{g.title}</h2> : null}
                        {g.modules.map((m) => (
                            <FollowingsModule key={m.key} module={m} current={current} onGo={go} />
                        ))}
                    </div>
                ),
            )}
        </div>
    );
}

/**
 * A group of the site's items: its rows, under a heading that folds them where the site gives it
 * one (Browse; folded or not is remembered on this computer, as the Tasks section and Your groups
 * are). Where the site's menu has Tasks, the app's Tasks section (its own heading, folding)
 * follows the group as a section of its own: drawn in the group's middle, the rows after it read
 * as part of Tasks once it is folded.
 */
function ItemsGroup({ groupKey, title, rows, row, onPicked }: { groupKey: string; title: string; rows: readonly NavRowModel[]; row: (r: NavRowModel) => ReactNode; onPicked?: () => void }) {
    const items = rows.filter((r) => !r.tasks);
    const tasks = items.length < rows.length;
    const foldKey = `group|${groupKey}`;
    const [collapsed, setCollapsed] = useState(() => !!title && savedCollapsed(foldKey));
    const listId = `sidebar-group-${groupKey.replace(/[^a-z0-9-]/gi, '-')}`;
    const toggle = () => {
        setCollapsed(!collapsed);
        saveCollapsed(foldKey, !collapsed);
    };
    return (
        <>
            {items.length || title ? (
                <div className={title ? 'sidebar-nav-group sidebar-groups' : 'sidebar-nav-group'}>
                    {title ? (
                        <h2 className="sidebar-heading">
                            <button type="button" className="sidebar-disclosure" aria-expanded={!collapsed} aria-controls={listId} onClick={toggle}>
                                <span className="truncate">{title}</span>
                                <span className="disclosure-chevron">
                                    <Icon name="chevron-right" size={12} strong />
                                </span>
                            </button>
                        </h2>
                    ) : null}
                    {!collapsed ? (
                        <ul id={listId} className="nav-list" aria-label={title || undefined}>
                            {items.map(row)}
                        </ul>
                    ) : null}
                </div>
            ) : null}
            {tasks ? <SidebarTasks onPicked={onPicked} /> : null}
        </>
    );
}

/**
 * A module of Member Memberships (or Member Following): a section of its own, under a heading that
 * folds it (Your groups), the contexts with their pictures, and Browse where the app has the section.
 */
function FollowingsModule({ module: m, current, onGo }: { module: NavFollowingsModel; current: string | null; onGo: (list: ListRoute) => void }) {
    const openInWindow = useOpenInWindow();
    const [collapsed, setCollapsed] = useState(() => savedCollapsed(m.key));
    const listId = `sidebar-followings-${m.key.replace(/[^a-z0-9-]/gi, '-')}`;
    const toggle = () => {
        setCollapsed(!collapsed);
        saveCollapsed(m.key, !collapsed);
    };
    return (
        <div className="sidebar-groups">
            <h2 className="sidebar-heading">
                <button type="button" className="sidebar-disclosure" aria-expanded={!collapsed} aria-controls={listId} onClick={toggle}>
                    <span className="truncate">{m.title}</span>
                    <span className="disclosure-chevron">
                        <Icon name="chevron-right" size={12} strong />
                    </span>
                </button>
            </h2>
            {!collapsed ? (
                <ul id={listId} className="nav-list" aria-label={m.title}>
                    {m.contexts.map((c) => (
                        <li key={c.id}>
                            <button
                                type="button"
                                className="nav-item nav-group"
                                aria-current={current === `${m.key}|${c.id}` ? 'page' : undefined}
                                onClick={(e) => {
                                    if (openInWindow && isWindowGesture(e)) {
                                        openInWindow(c.detail);
                                        return;
                                    }
                                    onGo(c.list);
                                }}
                                onDoubleClick={() => openInWindow?.(c.detail)}
                                onKeyDown={(e) => {
                                    if (!openInWindow || !isWindowKey(e)) return;
                                    e.preventDefault();
                                    openInWindow(c.detail);
                                }}
                            >
                                <span className="nav-icon">
                                    <Avatar profile={c.context} size={20} />
                                </span>
                                <span className="nav-label truncate" dir="auto">
                                    {c.name}
                                </span>
                            </button>
                        </li>
                    ))}
                    {/* more than the sidebar shows: all of them (All your groups), before Browse */}
                    {m.more && m.all ? (
                        <li>
                            <button
                                type="button"
                                className="nav-item"
                                aria-current={current === `${m.key}|all` ? 'page' : undefined}
                                onClick={() => onGo(m.all!)}
                            >
                                <span className="nav-icon">
                                    <Icon name="list" size={20} />
                                </span>
                                <span className="nav-label truncate">{allLabel(m.title)}</span>
                            </button>
                        </li>
                    ) : null}
                    {m.browse ? (
                        <li>
                            <button
                                type="button"
                                className="nav-item"
                                aria-current={current === `${m.key}|browse` ? 'page' : undefined}
                                onClick={() => onGo(m.browse!)}
                            >
                                <span className="nav-icon">
                                    <Icon name="layout-grid" size={20} />
                                </span>
                                <span className="nav-label truncate">{browseLabel(m.browse)}</span>
                            </button>
                        </li>
                    ) : null}
                </ul>
            ) : null}
        </div>
    );
}
