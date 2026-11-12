import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { type KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { EmptyState } from '../../components/empty-state';
import { Icon, type IconName } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';

import { ago, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useListCommands } from '../../lib/list-commands';
import { confirmAction } from '../../lib/native';
import { type MenuEntry, showMenu, useMenuExpanded } from '../../lib/native-menu';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { paneHeadingId, type PaneName } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { ACTION_LABELS, announcement, type ConnectionList, connectionListKey, FRIEND_REQUESTS_KEY, type GraphAction, SENT_REQUESTS_KEY } from './graph';
import { ProfileAvatar, ProfileName } from './profile-link';
import { useGraphAction } from './relation-buttons';

type Page = Schema<'Page_Connected'>;
type Connected = Schema<'Connected'>;

/** The views of the network's people directory (GET /persons): People's Recent, Active and Online. */
export type PeopleView = 'recent' | 'active' | 'online';

/**
 * Whose people a list shows: a profile's friends, followers or whom it follows; the friend
 * requests waiting for the acting profile; the ones it sent that wait for an answer; or the
 * network's people in one of the directory's views (People).
 */
export type ConnectionsSource = { kind: 'list'; profileId: string; list: ConnectionList } | { kind: 'requests' } | { kind: 'sent' } | { kind: 'people'; view: PeopleView };

/** The query key of a view of the people directory. */
export const peopleKey = (view: PeopleView) => ['people', view] as const;

/** The date the site sends for a join date it does not show the viewer. */
const UNKNOWN_DATE = '1970-01-01T00:00:00Z';

export const PAGE_SIZE = 30;

function sourceKey(source: ConnectionsSource): readonly unknown[] {
    if (source.kind === 'requests') return FRIEND_REQUESTS_KEY;
    if (source.kind === 'sent') return SENT_REQUESTS_KEY;
    if (source.kind === 'people') return peopleKey(source.view);
    return connectionListKey(source.profileId, source.list);
}

async function loadPage(api: UnaApi, source: ConnectionsSource, cursor: string | undefined): Promise<Page> {
    const query = { cursor, limit: PAGE_SIZE };
    if (source.kind === 'requests') return unwrap(await api.GET('/me/friend-requests', { params: { query } }));
    if (source.kind === 'sent') return unwrap(await api.GET('/me/friend-requests/sent', { params: { query } }));
    if (source.kind === 'people') {
        // people, not connections: a row's date is when the person joined (unknown where their page is private)
        const people = unwrap(await api.GET('/persons', { params: { query: { ...query, view: source.view } } }));
        return { items: people.items.map((profile) => ({ profile, since: profile.created_at })), next_cursor: people.next_cursor };
    }
    const params = { params: { path: { id: source.profileId }, query } };
    switch (source.list) {
        case 'friends':
            return unwrap(await api.GET('/profiles/{id}/friends', params));
        case 'followers':
            return unwrap(await api.GET('/profiles/{id}/followers', params));
        case 'following':
            return unwrap(await api.GET('/profiles/{id}/following', params));
    }
}

/**
 * The first page of the friend requests (the same pages Connections' Requests tab reads), for
 * the pictures on Notifications' requests row; read only while some wait.
 */
export function useFriendRequestsPreview(enabled: boolean): Schema<'Profile'>[] {
    const { api } = useApp();
    const query = useInfiniteQuery({
        queryKey: FRIEND_REQUESTS_KEY,
        queryFn: ({ pageParam }) => loadPage(api, { kind: 'requests' }, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        enabled,
        staleTime: 60_000,
    });
    return query.data?.pages[0]?.items.map((c) => c.profile) ?? [];
}

/** "March 2026": when a connection started, to the month. */
export function monthText(iso: string): string {
    return new Date(iso).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
}

/** The second line of a connection's row (spec 4.4); a person in People: when they joined, or nothing when that is not known. */
export function connectionSince(source: ConnectionsSource, since: string): string {
    if (source.kind === 'people') return since === UNKNOWN_DATE || Number.isNaN(Date.parse(since)) ? '' : t('Joined {{month}}', { month: monthText(since) });
    if (source.kind === 'requests') return t('Asked {{when}}', { when: ago(since) });
    if (source.kind === 'sent') return t('Sent {{when}}', { when: ago(since) });
    return source.list === 'friends' ? t('Friends since {{month}}', { month: monthText(since) }) : t('Following since {{month}}', { month: monthText(since) });
}

const EMPTY_ICON: Record<'requests' | 'sent' | 'people' | ConnectionList, IconName> = { requests: 'user-plus', sent: 'user-plus', people: 'users', friends: 'users', followers: 'users', following: 'users' };

/** Pages without one profile (a request answered, a friendship ended). */
export function withoutProfile(data: InfiniteData<Page> | undefined, profileId: string): InfiniteData<Page> | undefined {
    if (!data) return data;
    return { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((c) => c.profile.id !== profileId) })) };
}

/**
 * What a row's More menu offers on one's own lists (Connections): Message for a person, and the
 * step that ends the connection the list is of. Received and sent requests have their buttons
 * in the row instead; followers have nothing to end (UNA has no removing a follower).
 */
export function rowMenuActions(source: ConnectionsSource): GraphAction[] {
    if (source.kind !== 'list') return [];
    if (source.list === 'friends') return ['unfriend'];
    if (source.list === 'following') return ['unfollow'];
    return [];
}

type Props = {
    source: ConnectionsSource;
    /** The list's accessible name, e.g. "Mila’s friends". */
    label: string;
    emptyText: string;
    /** Under the empty list's title, what fills it. */
    emptyHint?: string;
    /**
     * One's own lists, managed (Connections): a More menu on each row to message the person or
     * end the connection. A profile's tabs show the people only.
     */
    manage?: boolean;
};

/** The name buttons of the list's rows, in order: what the arrow keys and j and k move between. */
function rowNames(list: HTMLElement | null): HTMLElement[] {
    return list ? Array.from(list.querySelectorAll<HTMLElement>('[data-row-name]')) : [];
}

/**
 * People connected to a profile (its friends, followers or whom it follows), or the friend
 * requests waiting for the viewer with Accept and Decline, or the ones the viewer sent with
 * Cancel, or the network's people (People's Recent, Active, Online). Names open the profile. The rows are one list for the keyboard: Up and Down (j and k
 * from the list pane) move between the names, Home and End to the first and last, Enter (o)
 * opens the profile. Answering a request or ending a connection takes the row off the list and
 * focus goes to the row that took its place.
 */
export function ConnectionsList({ source, label, emptyText, emptyHint, manage = false }: Props) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const key = sourceKey(source);
    const [announcementText, announce] = useAnnouncer();
    const root = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const focusIndex = useRef<number | null>(null);

    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }): Promise<Page> => loadPage(api, source, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const empty = emptyListText(query, items.length, emptyText);
    // a page without one (People's views are not paged by connection rows): a person listed twice across pages shows once
    const shown = source.kind === 'people' ? items.filter((c, i) => items.findIndex((o) => o.profile.id === c.profile.id) === i) : items;

    // after a row went: the row that took its place, or the one before, or the pane's heading
    useLayoutEffect(() => {
        const i = focusIndex.current;
        if (i === null) return;
        focusIndex.current = null;
        const rows = list.current?.querySelectorAll<HTMLElement>(':scope > li') ?? [];
        const row = rows[Math.min(i, rows.length - 1)];
        const target = row?.querySelector<HTMLElement>('button[data-answer]') ?? row?.querySelector<HTMLElement>('[data-row-name]');
        if (target) target.focus();
        else {
            const pane = (root.current?.closest<HTMLElement>('[data-pane]')?.dataset.pane ?? 'list') as PaneName;
            document.getElementById(paneHeadingId(pane))?.focus();
        }
    });

    const removed = (index: number, profileId: string, text: string) => {
        focusIndex.current = index;
        queryClient.setQueryData<InfiniteData<Page>>(key, (d) => withoutProfile(d, profileId));
        announce(text);
    };

    // the arrow keys between the rows' names (Tab goes through each row's buttons as well)
    const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
        const names = rowNames(list.current);
        const at = names.indexOf(e.target as HTMLElement);
        if (at < 0) return;
        const to = e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? names.length - 1 : null;
        if (to === null) return;
        e.preventDefault();
        names[Math.max(0, Math.min(to, names.length - 1))]?.focus();
    };

    // j, k and o from anywhere in the list pane, as on the feeds
    useListCommands((command) => {
        const names = rowNames(list.current);
        if (!names.length) return false;
        const active = document.activeElement;
        const at = names.findIndex((n) => n === active || !!n.closest('li')?.contains(active));
        switch (command) {
            case 'next-item':
                names[at < 0 ? 0 : Math.min(at + 1, names.length - 1)]?.focus();
                return true;
            case 'previous-item':
                names[at < 0 ? 0 : Math.max(at - 1, 0)]?.focus();
                return true;
            case 'open-item':
                if (at < 0) return false;
                names[at]?.click();
                return true;
            default:
                return false;
        }
    });

    return (
        <div ref={root} className="connections">
            <p className="sr-only" role="status" aria-live="polite">
                {announcementText.text ? <span key={announcementText.seq}>{announcementText.text}</span> : null}
            </p>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!empty} icon={EMPTY_ICON[source.kind === 'list' ? source.list : source.kind]} title={empty} hint={empty === emptyText ? emptyHint : undefined} />
            {shown.length ? (
                // the rows' own keys (Up, Down, Home, End) on their name buttons
                <ul ref={list} className="list rows" aria-label={label} onKeyDown={onKeyDown}>
                    {shown.map((c, i) => (
                        <ConnectedRow key={c.profile.id} connected={c} source={source} manage={manage} onRemoved={(text) => removed(i, c.profile.id, text)} />
                    ))}
                </ul>
            ) : null}
            {query.hasNextPage ? (
                <button type="button" className="btn btn-wide" onClick={() => void query.fetchNextPage()} aria-disabled={query.isFetchingNextPage || undefined} aria-busy={query.isFetchingNextPage}>
                    {query.isFetchingNextPage ? t('Loading…') : t('Load more')}
                </button>
            ) : null}
        </div>
    );
}

function ConnectedRow({ connected: c, source, manage, onRemoved }: { connected: Connected; source: ConnectionsSource; manage: boolean; onRemoved: (text: string) => void }) {
    const { messageTo } = useApp();
    const run = useGraphAction(c.profile);
    const [busy, setBusy] = useState<GraphAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const more = useRef<HTMLButtonElement>(null);
    const owner = `connection-${c.profile.id}`;
    const expanded = useMenuExpanded(owner);
    const name = c.profile.display_name;
    // the buttons in the row: Accept and Decline on a request received, Cancel on one sent
    const buttons: GraphAction[] = source.kind === 'requests' ? ['accept', 'decline'] : source.kind === 'sent' ? ['cancel'] : [];
    const menuActions = manage ? rowMenuActions(source) : [];
    const canMessage = manage && c.profile.kind === 'person';
    const sinceText = connectionSince(source, c.since);

    const act = async (action: GraphAction) => {
        if (busy) return;
        if (action === 'unfriend') {
            const ok = await confirmAction({ title: t('Remove {{name}} from your friends?', { name }), message: t('You also stop following each other.'), okLabel: t('Remove friend') });
            if (!ok) return;
        }
        setBusy(action);
        setError(null);
        try {
            const status = await run(action);
            onRemoved(announcement(action, name, status));
        } catch (e) {
            setError(errorMessage(e));
            setBusy(null);
        }
    };

    const openMenu = () => {
        const el = more.current;
        if (!el) return;
        const entries: MenuEntry[] = [
            ...(canMessage ? [{ text: t('Send Message'), run: () => messageTo(c.profile) }] : []),
            ...(canMessage && menuActions.length ? (['separator'] as const) : []),
            ...menuActions.map((a) => ({ text: ACTION_LABELS[a], run: () => void act(a) })),
        ];
        void showMenu(entries, { anchor: el }, { label: t('More for {{name}}', { name }), owner }).catch((e: unknown) => console.error('menu', e));
    };

    return (
        <li className="list-row" data-busy={busy ? '' : undefined}>
            <ProfileAvatar profile={c.profile} size={36} />
            <div className="list-main">
                <span className={c.profile.badges?.length ? 'with-badges' : undefined}>
                    <ProfileName profile={c.profile} className="strong" rowName />
                    <ProfileBadges badges={c.profile.badges} />
                </span>
                {sinceText ? (
                    <time className="row-sub" dateTime={c.since} title={new Date(c.since).toLocaleString(locale())}>
                        {sinceText}
                    </time>
                ) : null}
                {error ? (
                    <p className="error small" role="alert">
                        {error}
                    </p>
                ) : null}
            </div>
            {buttons.length || canMessage || menuActions.length ? (
                <div className="row-actions">
                    {buttons.map((a) => (
                        <button
                            key={a}
                            type="button"
                            // one filled action per view: Accept is a plain button in every row (3.6)
                            className={`btn small${a === 'accept' ? '' : ' btn-quiet'}`}
                            data-answer={a === 'accept' || a === 'cancel' || undefined}
                            // the visible word starts the name (WCAG 2.5.3); the rest says who
                            aria-label={a === 'accept' ? t('Accept {{name}}', { name }) : a === 'cancel' ? t('Cancel request to {{name}}', { name }) : t('Decline {{name}}', { name })}
                            aria-disabled={busy !== null || undefined}
                            aria-busy={busy === a || undefined}
                            onClick={() => void act(a)}
                        >
                            {a === 'accept' ? <Icon name="check" size={14} /> : null}
                            <span>{ACTION_LABELS[a]}</span>
                        </button>
                    ))}
                    {canMessage || menuActions.length ? (
                        <button
                            ref={more}
                            type="button"
                            className="tb-btn"
                            aria-label={t('More for {{name}}', { name })}
                            aria-haspopup="menu"
                            aria-expanded={expanded}
                            aria-disabled={busy !== null || undefined}
                            aria-busy={busy !== null || undefined}
                            onClick={openMenu}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown' && e.altKey) {
                                    e.preventDefault();
                                    openMenu();
                                }
                            }}
                        >
                            <Icon name="ellipsis" />
                        </button>
                    ) : null}
                </div>
            ) : null}
        </li>
    );
}
