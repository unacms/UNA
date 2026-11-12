/**
 * One sync for the whole app (GET /sync): the badge counts and the notifications that came,
 * instead of an unread query per badge. In the app it runs in Rust (src-tauri/src/sync.rs), so
 * it keeps going while the window is hidden, and puts the counts on the dock and tray and the
 * new notifications on the screen; the page gets each answer as a `sync` event. In a plain
 * browser (`vite dev`) the page polls itself, with the same intervals.
 *
 * What an answer changes here (`applySync`): the badges; new notifications (the answer's
 * `changes` of type `notification`) go on top of the inbox's lists; a
 * list whose count changed in a way the answer doesn't explain (read elsewhere, a reset) or
 * that got more than one answer brings (`more`) is fetched again; and new notifications are
 * announced in the page while it has focus (`announcementFor`), where the OS was not asked to
 * show them.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { Schema, UnaApi } from 'una-api';

import { unwrap } from './api';
import { tn } from './i18n';

export type SyncAnswer = Schema<'SyncResponse'>;
export type Badges = Schema<'Badges'>;
export type Notification = Schema<'Notification'>;
type NotificationPage = Schema<'Page_Notification'>;

/** What Rust sends with each answer (sync.rs, SYNC_EVENT); null once signed out. */
export type SyncPayload = { sync: SyncAnswer; notified: boolean };

export const SYNC_EVENT = 'sync';
/** A click on an OS notification (sync.rs, OPEN_EVENT). */
export const OPEN_NOTIFICATION_EVENT = 'open-notification';

/**
 * What Rust sends when an OS notification is clicked: the notification (null when it stands for
 * several, or is not known) and the profile it was shown for.
 */
export type OpenNotificationPayload = { notification: Notification | null; profile_id: string | null };

/** The inbox's lists: all notifications, and the unread ones. */
export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const CONVERSATIONS_KEY = ['conversations'] as const;
/** Each open conversation (screens/conversation.tsx): its unread flag. */
export const CONVERSATION_KEY = ['conversation'] as const;
export const FRIEND_REQUESTS_KEY = ['friend-requests'] as const;

/**
 * The notification a click on an OS notification opens, or null for the notifications. One shown
 * for another profile (the account switched profiles since) is not opened: it would open that
 * profile's item as this one, and marking it read would move this profile's read marker.
 */
export function clickedNotification(payload: OpenNotificationPayload | null | undefined, activeProfileId: string | undefined): Notification | null {
    const n = payload?.notification ?? null;
    if (!n) return null;
    if (payload?.profile_id && activeProfileId && payload.profile_id !== activeProfileId) return null;
    return n;
}

/**
 * What the page says about new notifications: nothing when the OS showed them (the window was
 * not focused), when the page has no focus (nobody is reading it) or when there are none.
 */
export function announcementFor(count: number, more: boolean, notified: boolean, pageFocused: boolean): string | null {
    if (!count || notified || !pageFocused) return null;
    if (more) return tn(count, '{{count}}+ new notifications', '{{count}}+ new notifications');
    return tn(count, '{{count}} new notification', '{{count}} new notifications');
}

/** The interval and back-off of the page's own poll, the same as the Rust one (sync.rs). */
export function nextDelay(failures: number, visible: boolean): number {
    if (failures <= 0) return visible ? 30_000 : 60_000;
    return Math.min(30_000 * 2 ** Math.min(failures - 1, 10), 600_000);
}

/**
 * The new notifications of an answer, newest first: its changes of type `notification`, whose
 * `data` is the Notification as GET /notifications answers it. Other types are skipped.
 */
export function newNotifications(answer: SyncAnswer): Notification[] {
    return answer.changes.filter((c) => c.type === 'notification' && !c.gone && c.data).map((c) => c.data as unknown as Notification);
}

/** Notifications put on top of a list, those it has already left out. */
export function prependNotifications(data: InfiniteData<NotificationPage> | undefined, fresh: readonly Notification[]): InfiniteData<NotificationPage> | undefined {
    if (!data || !fresh.length) return data;
    const [first, ...rest] = data.pages;
    if (!first) return data;
    const known = new Set(data.pages.flatMap((p) => p.items.map((n) => n.id)));
    const added = fresh.filter((n) => !known.has(n.id));
    if (!added.length) return data;
    return { ...data, pages: [{ ...first, items: [...added, ...first.items] }, ...rest] };
}

/**
 * How long after the app marked notifications read a lower count is taken as that: the lists
 * already show it (markReadInCache), and fetching them again would take the rows just read out
 * of the Unread list, focus with them.
 */
export const LOCAL_READ_WINDOW = 60_000;

const localReads = new WeakMap<QueryClient, number>();

/**
 * Read state is one marker per profile: marking one notification read marks the older ones too
 * (null: all of them). The lists show it at once; the next sync brings the count.
 */
export function markReadInCache(queryClient: QueryClient, upToId: string | null, now = Date.now()): void {
    localReads.set(queryClient, now);
    const upTo = upToId === null ? Infinity : Number(upToId);
    queryClient.setQueriesData<InfiniteData<NotificationPage>>(NOTIFICATIONS_KEY, (data) =>
        data
            ? {
                  ...data,
                  pages: data.pages.map((p) => ({ ...p, items: p.items.map((n) => (!n.read && Number(n.id) <= upTo ? { ...n, read: true } : n)) })),
              }
            : data,
    );
}

/**
 * An answer into the caches. `before` is the badges of the answer before (null for the first):
 * a count that went down without the app doing it (read on the site, a request answered
 * there) refetches its list; new notifications are put on top. A change in unread messages
 * refetches the conversations and each open one, so the one on screen is marked read again.
 */
export function applySync(queryClient: QueryClient, answer: SyncAnswer, before: Badges | null, now = Date.now()): void {
    const fresh = newNotifications(answer);
    // more came than one answer brings: the rest follows at once, in parts, so the list is read again
    if (answer.reset || answer.more) {
        void queryClient.invalidateQueries(NOTIFICATIONS_KEY);
    } else if (fresh.length) {
        for (const [key] of queryClient.getQueriesData<InfiniteData<NotificationPage>>(NOTIFICATIONS_KEY)) {
            // the unread list takes only unread ones; the full list all of them
            const take = key[1] === 'unread' ? fresh.filter((n) => !n.read) : fresh;
            queryClient.setQueryData<InfiniteData<NotificationPage>>(key, (data) => prependNotifications(data, take));
        }
    }

    const counts = answer.badges;
    if (!before) return;
    const readHere = now - (localReads.get(queryClient) ?? -Infinity) < LOCAL_READ_WINDOW;
    if ((counts.notifications ?? 0) < (before.notifications ?? 0) && !fresh.length && !readHere) void queryClient.invalidateQueries(NOTIFICATIONS_KEY);
    if (counts.messages !== before.messages) {
        void queryClient.invalidateQueries(CONVERSATIONS_KEY);
        void queryClient.invalidateQueries(CONVERSATION_KEY);
    }
    if (counts.friend_requests !== before.friend_requests) void queryClient.invalidateQueries(FRIEND_REQUESTS_KEY);
}

let requested: (() => void) | null = null;

/** Sync now (after marking read, answering a request, a refresh); nothing when no sync runs. */
export function requestSync(): void {
    requested?.();
}

/** The sync the app runs now, for requestSync; set by SyncProvider. */
export function setSyncRunner(run: (() => void) | null): void {
    requested = run;
}

/**
 * The page's own poll, outside the app: GET /sync every 30 s while the page is visible, 60 s
 * otherwise, backing off while it fails. The client's conditional GETs make a repeat a 304.
 */
export function startBrowserPoll(api: UnaApi, onAnswer: (answer: SyncAnswer) => void): { wake: () => void; stop: () => void } {
    let cursor: string | undefined;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let running = false;

    const schedule = () => {
        if (stopped) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void run(), nextDelay(failures, document.visibilityState === 'visible'));
    };
    const run = async () => {
        if (stopped || running) return;
        running = true;
        try {
            const answer = unwrap(await api.GET('/sync', { params: { query: { cursor } } }));
            cursor = answer.cursor;
            failures = 0;
            if (!stopped) onAnswer(answer);
        } catch {
            failures++;
        } finally {
            running = false;
            schedule();
        }
    };
    void run();
    return {
        wake: () => void run(),
        stop: () => {
            stopped = true;
            if (timer) clearTimeout(timer);
        },
    };
}
