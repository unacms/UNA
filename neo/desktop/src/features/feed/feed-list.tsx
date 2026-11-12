import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ActivityCard } from '../../components/activity-card';
import { Avatar } from '../../components/avatar';
import { EmptyState } from '../../components/empty-state';
import { Icon, type IconName } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { useListCommands } from '../../lib/list-commands';
import { useNavigation } from '../../lib/navigation';
import { useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText } from '../../lib/paging';
import { useListNavigation } from '../../lib/use-list-navigation';
import { paneHeadingId, usePaneBody, usePaneName } from '../../shell/pane';
import { activityDetail } from '../posts/posts';
import { FEED_PANEL_ID } from './feed-tabs';
import type { Feed } from './use-feed';

type Announcement = { text: string; seq: number };

/**
 * The list's live region. Messages announced in the same commit (more posts loaded, new ones
 * waiting) are read together instead of the last one replacing the others, and each message is
 * a new text node (keyed by `seq`), so the same words twice are read twice.
 */
export function useAnnouncer(): [Announcement, (text: string) => void] {
    const [message, setMessage] = useState<Announcement>({ text: '', seq: 0 });
    const batch = useRef<string[] | null>(null);
    const announce = useCallback((text: string) => {
        if (!text) return;
        if (!batch.current) {
            batch.current = [];
            queueMicrotask(() => {
                batch.current = null;
            });
        }
        batch.current.push(text);
        const joined = batch.current.join(' ');
        setMessage((m) => ({ text: joined, seq: m.seq + 1 }));
    }, []);
    return [message, announce];
}

/** Gap between posts, in px: none, rows are separated by hairlines (spec 4.1). */
const GAP = 0;
/** A first guess at a post's height until it is measured (the seeded feed's rows average about 140). */
const ESTIMATE = 140;
/** Load the next page when the last rendered post is this close to the end. */
const PREFETCH = 5;

/**
 * Measured post heights per feed, so going back to a feed lays it out as it was; with the
 * width they were measured at, since a post's height follows the pane's width (text wraps).
 */
const measured = new Map<string, { width: number; items: VirtualItem[] }>();

/** The heights kept for a feed, if they were measured at this width. */
export function keptMeasurements(cacheKey: string, width: number): VirtualItem[] | undefined {
    const kept = measured.get(cacheKey);
    return kept && Math.abs(kept.width - width) < 1 ? kept.items : undefined;
}

/**
 * Sizes the virtualizer holds for the posts in the DOM, measured again from the DOM: the
 * ResizeObserver corrects a post that changes size, but a size taken from the kept heights
 * (at another width, or before the fonts settled) is only replaced once it reports.
 */
export function remeasureRows(list: HTMLElement | null, resize: (index: number, size: number) => void) {
    if (!list) return;
    for (const el of list.querySelectorAll<HTMLElement>(':scope > [data-index]')) {
        const index = Number(el.dataset.index);
        if (Number.isInteger(index) && el.isConnected) resize(index, Math.round(el.getBoundingClientRect().height));
    }
}

/** What an empty feed shows (spec 4.6): an icon, a title, a hint and its actions. */
export type EmptySpec = { icon?: IconName; title: string; hint?: ReactNode; actions?: ReactNode };

type Props = {
    feed: Feed;
    /** Keys the remembered heights; the feed's query key as text. */
    cacheKey: string;
    /** The feed's accessible name, e.g. "Home, Following". */
    label: string;
    emptyText?: string;
    /** The empty state, with its icon and actions; else `emptyText` as a quiet line. */
    empty?: EmptySpec;
    /** The post open in the detail pane. */
    selectedId: string | null;
    /** The tab that shows this feed, when there are tabs (FeedTabs). */
    tabId?: string;
    /** j, k, o and . act on this list (the list pane's); false for a feed in the detail pane. */
    listCommands?: boolean;
};

/**
 * A feed as the ARIA feed pattern: a virtualized role="feed" whose posts are articles with
 * aria-posinset and aria-setsize. Only the posts near the viewport are in the DOM. j and k (and
 * the arrow keys on a post) move between posts, Enter or o opens one in the detail pane, and
 * newer posts wait behind a pill (or .) instead of moving what is being read.
 */
export function FeedList({ feed, cacheKey, label, emptyText = '', empty, selectedId, tabId, listCommands = true }: Props) {
    const scroller = usePaneBody();
    // where focus goes when no post is left to take it: the heading of the pane the feed is in
    const headingId = paneHeadingId(usePaneName());
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const list = useRef<HTMLDivElement>(null);
    const [margin, setMargin] = useState(0);
    const [announcement, announce] = useAnnouncer();
    const { query, items, newIds, newCount, manyNew, newAuthors } = feed;
    const hasMore = !!query.hasNextPage;

    // Where the list starts in the scroller. What is drawn above it (the new post box, a profile
    // card) can change height; loading and empty states are drawn below the list.
    useLayoutEffect(() => {
        const el = list.current;
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

    // The desktop app is not built with the React Compiler; the virtualizer's own re-renders are what keep this current.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scroller.current,
        estimateSize: () => ESTIMATE,
        overscan: 4,
        gap: GAP,
        scrollMargin: margin,
        getItemKey: (index) => items[index]?.id ?? index,
        initialMeasurementsCache: keptMeasurements(cacheKey, scroller.current?.clientWidth ?? 0),
    });
    useEffect(() => {
        const v = virtualizer;
        const sc = scroller.current;
        return () => {
            measured.set(cacheKey, { width: sc?.clientWidth ?? 0, items: v.measurementsCache });
        };
    }, [virtualizer, cacheKey, scroller]);
    // the pane's width changed (a drag, the window, the sidebar) or the fonts arrived: the
    // posts in view are measured again, so no post is placed after a height it no longer has
    useEffect(() => {
        const sc = scroller.current;
        if (!sc) return;
        const again = () => remeasureRows(list.current, (index, size) => virtualizer.resizeItem(index, size));
        let width = sc.clientWidth;
        again();
        let cancelled = false;
        void document.fonts?.ready.then(() => {
            if (!cancelled) again();
        });
        if (typeof ResizeObserver === 'undefined') {
            return () => {
                cancelled = true;
            };
        }
        const observer = new ResizeObserver(() => {
            if (Math.abs(sc.clientWidth - width) < 1) return;
            width = sc.clientWidth;
            again();
        });
        observer.observe(sc);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [scroller, virtualizer]);

    // focus a post once it is rendered (a key moved to one that was not in the DOM yet)
    const pendingFocus = useRef<{ index: number; id?: string } | null>(null);
    const focusPost = useCallback((index: number, id?: string): boolean => {
        const el = list.current?.querySelector<HTMLElement>(`[data-index="${index}"]`);
        if (!el || (id && el.dataset.id !== id)) return false;
        el.focus({ preventScroll: true });
        return true;
    }, []);

    const ids = useMemo(() => items.map((a) => a.id), [items]);
    const nav = useListNavigation({
        count: items.length,
        keys: ids,
        onOpen: (index) => {
            const a = items[index];
            if (a) openDetail(activityDetail(a));
        },
        onOpenInWindow: openInWindow
            ? (index) => {
                  const a = items[index];
                  if (a) openInWindow(activityDetail(a));
              }
            : undefined,
        onActivate: (index) => {
            virtualizer.scrollToIndex(index, { align: 'auto' });
            pendingFocus.current = focusPost(index) ? null : { index };
        },
    });
    useLayoutEffect(() => {
        const want = pendingFocus.current;
        if (want && focusPost(want.index, want.id)) pendingFocus.current = null;
    });

    // A post deleted from the list took the focused Delete button with it: focus goes to the
    // post that took its place (or the one before, the last), or to the heading when none is left.
    const removed = useRef<{ index: number; id: string } | null>(null);
    useLayoutEffect(() => {
        const gone = removed.current;
        if (!gone || ids.includes(gone.id)) return;
        removed.current = null;
        const focused = document.activeElement;
        if (focused && focused !== document.body && focused.isConnected) return;
        if (!nav.activate(Math.min(gone.index, ids.length - 1))) document.getElementById(headingId)?.focus();
    }, [ids, nav, headingId]);

    const virtualItems = virtualizer.getVirtualItems();

    const showNew = () => {
        const first = feed.showNew();
        announce(t('Showing the new posts'));
        if (first) {
            nav.activate(0);
            // the first post of the new page, once it replaced the old one in the DOM
            pendingFocus.current = { index: 0, id: first };
        } else {
            // the pill that had focus goes away
            document.getElementById(headingId)?.focus();
        }
        virtualizer.scrollToOffset(0);
    };

    useListCommands((command) => {
        switch (command) {
            case 'next-item':
            case 'previous-item': {
                // nothing active yet: start at the first post in view, not at the top of the feed
                if (nav.active < 0) {
                    const top = scroller.current?.scrollTop ?? 0;
                    const inView = virtualItems.find((v) => v.end > top) ?? virtualItems[0];
                    return inView ? nav.activate(inView.index) : false;
                }
                return nav.move(command === 'next-item' ? 'next' : 'previous');
            }
            case 'open-item':
                return nav.open();
            case 'show-new':
                if (!newCount) return false;
                showNew();
                return true;
            default:
                return false;
        }
    }, listCommands);

    // the next page loads as the end comes into view
    const lastRendered = virtualItems[virtualItems.length - 1]?.index ?? -1;
    const { fetchNextPage, isFetchingNextPage, isError } = query;
    useEffect(() => {
        if (hasMore && !isFetchingNextPage && !isError && items.length > 0 && lastRendered >= items.length - PREFETCH) void fetchNextPage();
    }, [hasMore, isFetchingNextPage, isError, items.length, lastRendered, fetchNextPage]);

    // said once per change: more posts loaded, newer ones waiting
    const pages = query.data?.pages.length ?? 0;
    const lastPage = useRef(pages);
    useEffect(() => {
        if (pages > lastPage.current && pages > 1) {
            const n = query.data?.pages[pages - 1]?.items.length ?? 0;
            // the total makes each load's message differ from the one before
            if (n) announce(tn(n, 'Loaded {{count}} more posts, {{total}} in all.', 'Loaded {{count}} more posts, {{total}} in all.', { total: items.length }));
        }
        lastPage.current = pages;
    }, [pages, query.data, items.length, announce]);
    // Only posts not announced before: the count hiding while the list refetches, or a poll
    // that finds the same posts again, says nothing.
    const announced = useRef(new Set<string>());
    useEffect(() => {
        const unheard = newIds.filter((id) => !announced.current.has(id));
        if (!unheard.length) return;
        for (const id of unheard) announced.current.add(id);
        // period is the list pane's key; a feed elsewhere has only its pill
        const waiting = manyNew && newCount !== 1 ? t('Many new posts.') : tn(newCount, '{{count}} new post.', '{{count}} new posts.');
        announce(listCommands ? `${waiting} ${t('Press period to show them.')}` : waiting);
    }, [newIds, newCount, manyNew, announce, listCommands]);

    const spec: EmptySpec = empty ?? { title: emptyText };
    const emptyMessage = emptyListText(query, items.length, spec.title);
    // "older items may still be there": the words change, the way out does not apply yet
    const final = emptyMessage === spec.title;
    const firstLoadFailed = query.isError && !query.data;
    const laterFailed = query.isError && !!query.data;
    const setSize = hasMore ? -1 : items.length;
    const pillText = manyNew && newCount !== 1 ? tn(newCount, '{{count}}+ new post', '{{count}}+ new posts') : tn(newCount, '{{count}} new post', '{{count}} new posts');

    return (
        <div className="feed-panel" role={tabId ? 'tabpanel' : undefined} id={tabId ? FEED_PANEL_ID : undefined} aria-labelledby={tabId}>
            {newCount > 0 ? (
                <div className="new-posts">
                    <button type="button" className="pill" onClick={showNew} aria-keyshortcuts={listCommands ? '.' : undefined}>
                        <Icon name="arrow-up" size={12} strong />
                        {newAuthors.length ? (
                            <span className="pill-avatars" aria-hidden="true">
                                {newAuthors.map((p) => (
                                    <Avatar key={p.id} profile={p} size={20} />
                                ))}
                            </span>
                        ) : null}
                        <span>{pillText}</span>
                    </button>
                </div>
            ) : null}
            <p className="sr-only" role="status" aria-live="polite">
                {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
            </p>
            <div
                ref={list}
                className="feed"
                role="feed"
                aria-label={label}
                aria-busy={isFetchingNextPage || undefined}
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualItems.map((v) => {
                    const a = items[v.index];
                    if (!a) return null;
                    return (
                        <ActivityCard
                            key={a.id}
                            activity={a}
                            selected={a.id === selectedId}
                            listItem={{
                                rowRef: virtualizer.measureElement,
                                index: v.index,
                                setSize,
                                offset: v.start - margin,
                                onRemove: () => {
                                    removed.current = { index: v.index, id: a.id };
                                },
                                ...nav.itemProps(v.index),
                            }}
                        />
                    );
                })}
            </div>

            <SkeletonRows loading={query.isLoading} shape="post" />
            {firstLoadFailed ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState
                shown={!!emptyMessage}
                icon={spec.icon}
                title={emptyMessage || spec.title}
                hint={final ? spec.hint : undefined}
                actions={final ? spec.actions : undefined}
            />

            {laterFailed ? (
                <div className="feed-foot" role="alert">
                    <span className="error">{t('Could not load posts: {{reason}}', { reason: errorMessage(query.error) })}</span>
                    <button type="button" className="btn small" onClick={() => void (hasMore ? fetchNextPage() : query.refetch())}>
                        {t('Try again')}
                    </button>
                </div>
            ) : isFetchingNextPage ? (
                <p className="feed-foot muted">{t('Loading more…')}</p>
            ) : hasMore && items.length ? (
                <div className="feed-foot">
                    <button type="button" className="btn btn-wide" onClick={() => void fetchNextPage()}>
                        {t('Load more')}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
