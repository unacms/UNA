import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { type FocusEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { retryOnce, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { useListCommands } from '../../lib/list-commands';
import { useNavigation, useRoute } from '../../lib/navigation';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { connectionsRoute, detailPath, type ListFilter } from '../../lib/router';
import { type Notification, NOTIFICATIONS_KEY } from '../../lib/sync';
import { useSync } from '../../lib/sync-provider';
import { notificationRoute } from '../../lib/targets';
import { opensInWindow, useOpenInWindow } from '../../lib/open-in-window';
import { useListNavigation } from '../../lib/use-list-navigation';
import { Pane, paneHeadingId, ToolbarButton, usePaneBody } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { useFriendRequestsPreview } from '../profile/connections-list';
import { useNotificationActions } from './actions';
import { startOfToday, withDayHeadings } from './days';
import { NotificationRow } from './notification-row';

const PAGE = 30;
/** A first guess at a row's height until it is measured; day headings are always this. */
const ESTIMATE = 64;
const DAY_HEIGHT = 32;
/** Rows are separated by hairlines, not gaps (spec 4.2). */
/** Rows are cards 2px apart, as in Messages (no hairlines). */
const GAP = 2;
const PREFETCH = 5;

type Filter = 'all' | ListFilter;
const FILTERS: readonly Filter[] = ['all', 'unread'];
const FILTER_LABELS: Record<Filter, string> = { all: t('All'), unread: t('Unread') };
/** The list's name for each filter. */
const LIST_LABELS: Record<Filter, string> = { all: t('Notifications, All'), unread: t('Notifications, Unread') };
const PANEL_ID = 'notifications-panel';
const filterTabId = (f: Filter) => `notifications-tab-${f}`;

/** Measured row heights per filter, so coming back lays the list out as it was. */
const measured = new Map<string, VirtualItem[]>();

export const notificationsKey = (filter: Filter) => [...NOTIFICATIONS_KEY, filter] as const;

/** How often the inbox looks whether the day has changed (its headings count from today). */
export const TODAY_CHECK_MS = 60_000;

/**
 * A moment of today, which changes only when the day does: checked each minute and when the
 * window shows again (a Mac that slept through midnight), so Today becomes Yesterday.
 */
export function useToday(): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const check = () => {
            const time = Date.now();
            setNow((prev) => (startOfToday(new Date(time)) === startOfToday(new Date(prev)) ? prev : time));
        };
        const timer = setInterval(check, TODAY_CHECK_MS);
        document.addEventListener('visibilitychange', check);
        window.addEventListener('focus', check);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('focus', check);
        };
    }, []);
    return now;
}

/**
 * The notifications inbox in the list pane: All or Unread (in the route), as the API sends
 * them (grouped as on the site), newest first and virtualized. j and k (and the arrow keys on a
 * row) move, Enter or o opens what one is about in the detail pane and marks it read (and the
 * older ones: read state is one marker), e marks the focused one read, Shift+E all of them. New
 * ones arrive with the sync (lib/sync.ts) on top of the list.
 */
export function Notifications() {
    const { api } = useApp();
    const route = useRoute();
    const { showFilter } = useNavigation();
    const { badges } = useSync();
    const { open, markRead } = useNotificationActions();
    const [announcement, announce] = useAnnouncer();
    const [error, setError] = useState<string | null>(null);
    const filter: Filter = route.list.section === 'notifications' && route.list.filter ? route.list.filter : 'all';

    const list = useInfiniteQuery({
        queryKey: notificationsKey(filter),
        queryFn: async ({ pageParam }) =>
            unwrap(await api.GET('/notifications', { params: { query: { cursor: pageParam as string | undefined, limit: PAGE, unread_only: filter === 'unread' } } })),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        retry: retryOnce,
    });
    // a page can be empty and still have a next one (the API left out what it may not show, or
    // read ones in the Unread list): the list fetches on rather than showing nothing
    useFillEmptyPages(list);
    const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
    const unread = (badges?.notifications ?? 0) > 0 || items.some((n) => !n.read);
    const openPath = route.detail ? detailPath(route.detail) : null;

    const run = useCallback(
        (n: Notification) => {
            setError(null);
            open(n).catch((e: unknown) => setError(errorMessage(e)));
        },
        [open],
    );

    const markAll = useCallback(async () => {
        if (!unread) {
            announce(t('Nothing is unread'));
            return;
        }
        setError(null);
        try {
            await markRead(null);
            announce(t('All notifications marked as read'));
        } catch (e) {
            setError(errorMessage(e));
        }
    }, [markRead, announce, unread]);

    const empty = filter === 'unread' ? t('No unread notifications') : t('You’re all caught up');
    const emptyText = emptyListText(list, items.length, empty);
    const unreadCount = badges?.notifications ?? 0;

    return (
        <Pane
            pane="list"
            title={t('Notifications')}
            subtitle={unreadCount ? (unreadCount > 99 ? t('99+ unread') : tn(unreadCount, '{{count}} unread', '{{count}} unread')) : undefined}
            ready={!list.isLoading}
            busy={list.isLoading}
            scope={<SegmentedTabs label={t('Show')} values={FILTERS} labels={FILTER_LABELS} current={filter} onChange={(f) => showFilter(f === 'all' ? null : f)} panelId={PANEL_ID} tabId={filterTabId} />}
            // the section's action in the toolbar; with nothing unread it stays (focusable, saying why)
            actions={<ToolbarButton icon="check-check" label={t('Mark all as read')} commandId="mark-all-read" disabled={!unread} note={t('nothing is unread')} onClick={() => void markAll()} />}
        >
            <div className="column">
                {/* above the feed, not in it: a feed owns only articles, and this is no notification */}
                <FriendRequestsRow />
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {error ? (
                    <p className="error" role="alert">
                        {error}
                    </p>
                ) : null}
                <div role="tabpanel" id={PANEL_ID} aria-labelledby={filterTabId(filter)}>
                    <NotificationList
                        key={filter}
                        items={items}
                        cacheKey={filter}
                        label={LIST_LABELS[filter]}
                        pageCount={list.data?.pages.length ?? 0}
                        hasMore={!!list.hasNextPage}
                        loadingMore={list.isFetchingNextPage}
                        failed={list.isError}
                        loadMore={() => void list.fetchNextPage()}
                        openPath={openPath}
                        onOpen={run}
                        onMarkRead={(n) => {
                            setError(null);
                            markRead(n).then(
                                () => announce(t('Marked as read')),
                                (e: unknown) => setError(errorMessage(e)),
                            );
                        }}
                        onMarkAll={() => void markAll()}
                        announce={announce}
                    />
                    <SkeletonRows loading={list.isLoading} shape="notification" />
                    {list.isError && !list.data ? <InlineError message={errorMessage(list.error)} onRetry={() => void list.refetch()} busy={list.isFetching} /> : null}
                    <EmptyState
                        shown={!!emptyText}
                        icon={filter === 'unread' ? 'check-check' : 'bell'}
                        title={emptyText || empty}
                        hint={emptyText === empty && filter === 'all' ? t('Comments, reactions and new followers show up here.') : undefined}
                    />
                </div>
            </div>
        </Pane>
    );
}

type ListProps = {
    items: Notification[];
    cacheKey: string;
    label: string;
    /** Pages loaded: one more is announced, not notifications the sync put on top. */
    pageCount: number;
    hasMore: boolean;
    loadingMore: boolean;
    failed: boolean;
    loadMore: () => void;
    /** The detail open now, as a path, to mark the row that opened it. */
    openPath: string | null;
    onOpen: (n: Notification) => void;
    onMarkRead: (n: Notification) => void;
    onMarkAll: () => void;
    announce: (text: string) => void;
};

/** The rows, virtualized like a feed (features/feed/feed-list.tsx), with the list's keys. */
function NotificationList({ items, cacheKey, label, pageCount, hasMore, loadingMore, failed, loadMore, openPath, onOpen, onMarkRead, onMarkAll, announce }: ListProps) {
    const scroller = usePaneBody();
    const openInWindow = useOpenInWindow();
    const listRef = useRef<HTMLDivElement>(null);
    const [margin, setMargin] = useState(0);

    useLayoutEffect(() => {
        const el = listRef.current;
        const sc = scroller.current;
        if (!el || !sc) return;
        const measure = () => setMargin(Math.round(el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop));
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        for (let node: Element | null = el; node && node !== sc; node = node.parentElement) {
            for (let prev = node.previousElementSibling; prev; prev = prev.previousElementSibling) observer.observe(prev);
        }
        return () => observer.disconnect();
    }, [scroller]);

    // the virtual rows: a day heading before each new day, then that day's notifications. Only
    // notifications are stops for the keys (data-index is the notification's own index)
    // counted from today, which moves on at midnight (checked each minute and when the window shows again)
    const today = useToday();
    const rows = useMemo(() => withDayHeadings(items, new Date(today)), [items, today]);
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scroller.current,
        estimateSize: (i) => (rows[i]?.kind === 'day' ? DAY_HEIGHT : ESTIMATE),
        overscan: 6,
        gap: GAP,
        scrollMargin: margin,
        // rows are measured by their place among the virtual rows (data-row); data-index is the
        // notification's own index (the keys' stops), which day headings shift
        indexAttribute: 'data-row',
        getItemKey: (i) => {
            const r = rows[i];
            return r ? (r.kind === 'day' ? r.id : r.n.id) : i;
        },
        initialMeasurementsCache: measured.get(cacheKey),
    });
    useEffect(() => {
        const v = virtualizer;
        return () => {
            measured.set(cacheKey, v.measurementsCache);
        };
    }, [virtualizer, cacheKey]);

    const pendingFocus = useRef<number | null>(null);
    const focusRow = useCallback((index: number): boolean => {
        const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
        if (!el) return false;
        el.focus({ preventScroll: true });
        return true;
    }, []);

    const ids = useMemo(() => items.map((n) => n.id), [items]);
    const rowOf = useMemo(() => {
        const at: number[] = [];
        rows.forEach((r, i) => {
            if (r.kind === 'notification') at[r.index] = i;
        });
        return at;
    }, [rows]);
    const nav = useListNavigation({
        count: items.length,
        keys: ids,
        onOpen: (index) => {
            const n = items[index];
            if (n) onOpen(n);
        },
        onActivate: (index) => {
            virtualizer.scrollToIndex(rowOf[index] ?? index, { align: 'auto' });
            pendingFocus.current = focusRow(index) ? null : index;
        },
    });
    useLayoutEffect(() => {
        const want = pendingFocus.current;
        if (want !== null && focusRow(want)) pendingFocus.current = null;
    });

    const virtualItems = virtualizer.getVirtualItems();

    useListCommands((command) => {
        switch (command) {
            case 'next-item':
            case 'previous-item': {
                if (nav.active < 0) {
                    const top = scroller.current?.scrollTop ?? 0;
                    const inView = virtualItems.find((v) => v.end > top && rows[v.index]?.kind === 'notification') ?? virtualItems.find((v) => rows[v.index]?.kind === 'notification');
                    const row = inView ? rows[inView.index] : undefined;
                    return row?.kind === 'notification' ? nav.activate(row.index) : false;
                }
                return nav.move(command === 'next-item' ? 'next' : 'previous');
            }
            case 'open-item':
                return nav.open();
            case 'mark-read': {
                const n = items[nav.active];
                if (!n) return false;
                if (!n.read) onMarkRead(n);
                return true;
            }
            case 'mark-all-read':
                onMarkAll();
                return true;
            default:
                return false;
        }
    });

    // the next page loads as the end comes into view
    const lastRendered = virtualItems[virtualItems.length - 1]?.index ?? -1;
    useEffect(() => {
        if (hasMore && !loadingMore && !failed && rows.length > 0 && lastRendered >= rows.length - PREFETCH) loadMore();
    }, [hasMore, loadingMore, failed, rows.length, lastRendered, loadMore]);

    // a page that finished loading is announced; new notifications on top are the sync's to say
    const pages = useRef(pageCount);
    useEffect(() => {
        if (pages.current && pageCount > pages.current) announce(tn(items.length, '{{count}} notifications loaded', '{{count}} notifications loaded'));
        pages.current = pageCount;
    }, [pageCount, items.length, announce]);

    // Focus in the list stays in it when the row that has it goes (read, in the Unread list):
    // it moves to the row now in the active place, or to the list's heading when none is left.
    // A row the virtualizer took out because it was scrolled away is still in the list: focus
    // is not pulled back to it.
    const focusInList = useRef(false);
    const focusedId = useRef<string | null>(null);
    const onFocusIn = useCallback((e: FocusEvent<HTMLDivElement>) => {
        focusInList.current = true;
        focusedId.current = (e.target as Element).closest<HTMLElement>('[data-id]')?.dataset.id ?? null;
    }, []);
    const onFocusOut = useCallback((e: FocusEvent<HTMLDivElement>) => {
        const next = e.relatedTarget as Node | null;
        if (next && listRef.current?.contains(next)) return;
        const left = e.target;
        // focus that went somewhere left the list; focus that went nowhere left it too, unless
        // the element that had it is the one that was removed
        requestAnimationFrame(() => {
            if (next || left.isConnected) focusInList.current = false;
        });
    }, []);
    useLayoutEffect(() => {
        if (!focusInList.current) return;
        const el = document.activeElement;
        if (el && el !== document.body && el.isConnected) return;
        if (focusedId.current !== null && ids.includes(focusedId.current)) return;
        if (nav.active >= 0 && items.length) {
            virtualizer.scrollToIndex(rowOf[nav.active] ?? nav.active, { align: 'auto' });
            pendingFocus.current = focusRow(nav.active) ? null : nav.active;
        } else {
            focusInList.current = false;
            document.getElementById(paneHeadingId('list'))?.focus();
        }
    }, [items, ids, nav.active, virtualizer, focusRow, rowOf]);

    const setSize = hasMore ? -1 : items.length;

    return (
        <>
            <div
                ref={listRef}
                className="feed notifications"
                role="feed"
                aria-label={label}
                aria-busy={loadingMore || undefined}
                onFocus={onFocusIn}
                onBlur={onFocusOut}
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualItems.map((v) => {
                    const row = rows[v.index];
                    if (!row) return null;
                    if (row.kind === 'day') {
                        // not a heading: a feed may own only articles; each row says its day instead
                        return (
                            <div key={row.id} className="day-heading" aria-hidden="true" data-row={v.index} style={{ transform: `translateY(${v.start - margin}px)` }}>
                                {row.label}
                            </div>
                        );
                    }
                    const n = row.n;
                    const target = notificationRoute(n);
                    return (
                        <NotificationRow
                            key={n.id}
                            notification={n}
                            selected={!!target && detailPath(target) === openPath}
                            onOpen={() => onOpen(n)}
                            onOpenInWindow={openInWindow && target && opensInWindow(target) ? () => openInWindow(target) : undefined}
                            rowRef={virtualizer.measureElement}
                            index={row.index}
                            virtualIndex={v.index}
                            setSize={setSize}
                            offset={v.start - margin}
                            day={row.day}
                            {...nav.itemProps(row.index)}
                        />
                    );
                })}
            </div>
            {failed && items.length ? (
                <div className="feed-foot" role="alert">
                    <span className="error">{t('Could not load more notifications.')}</span>
                    <button type="button" className="btn small" onClick={loadMore}>
                        {t('Try again')}
                    </button>
                </div>
            ) : loadingMore ? (
                <p className="feed-foot muted">{t('Loading more…')}</p>
            ) : null}
        </>
    );
}

/**
 * Friend requests waiting, above the notifications while there are any: up to three of their
 * pictures, how many, and Review, which goes to Connections' Requests tab (the content pane:
 * the notifications are not left open beside them).
 */
function FriendRequestsRow() {
    const { history } = useNavigation();
    const count = useSync().badges?.friend_requests ?? 0;
    const preview = useFriendRequestsPreview(count > 0);
    if (!count) return null;
    const many = count > 99;
    const people = preview.slice(0, 3);
    return (
        <div className="requests-row">
            {people.length ? (
                <span className="avatar-stack" aria-hidden="true">
                    {people.map((p) => (
                        <Avatar key={p.id} profile={p} size={24} />
                    ))}
                </span>
            ) : null}
            <span className="requests-text">{many ? t('99+ friend requests') : tn(count, '{{count}} friend request', '{{count}} friend requests')}</span>
            <button
                type="button"
                className="btn small"
                aria-label={many ? t('Review friend requests, 99+ waiting') : tn(count, 'Review friend requests, {{count}} waiting', 'Review friend requests, {{count}} waiting')}
                onClick={() => history.push(connectionsRoute('requests'))}
            >
                {t('Review')}
            </button>
        </div>
    );
}
