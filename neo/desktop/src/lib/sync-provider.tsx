/** The app's sync (lib/sync.ts) for React: the badges, a way to sync now, and what it announces. */
import { useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { UnaApi } from 'una-api';

import { inApp, syncNow } from './native';
import {
    announcementFor,
    applySync,
    type Badges,
    clickedNotification,
    newNotifications,
    type Notification,
    OPEN_NOTIFICATION_EVENT,
    type OpenNotificationPayload,
    setSyncRunner,
    startBrowserPoll,
    SYNC_EVENT,
    type SyncAnswer,
    type SyncPayload,
} from './sync';

type SyncValue = {
    /** The latest counts; null before the first sync. */
    badges: Badges | null;
    /** Sync now instead of at the next interval. */
    syncNow: () => void;
};

const SyncContext = createContext<SyncValue>({ badges: null, syncNow: () => {} });

export function useSync(): SyncValue {
    return useContext(SyncContext);
}

type Props = {
    api: UnaApi;
    /** The profile acting now: a click on a notification shown for another one opens the notifications. */
    profileId?: string;
    /** Says something in the window's live region (new notifications while the window has focus). */
    announce: (text: string) => void;
    /** A click on an OS notification: open what it is about (null: the notifications). */
    onOpenNotification: (notification: Notification | null) => void;
    children: ReactNode;
};

export function SyncProvider({ api, profileId, announce, onOpenNotification, children }: Props) {
    const queryClient = useQueryClient();
    const [badges, setBadges] = useState<Badges | null>(null);
    const last = useRef<Badges | null>(null);
    // each new notification is announced once, whatever answer brings it again
    const announced = useRef(new Set<string>());
    const runner = useRef<() => void>(() => {});
    const latest = useRef({ announce, onOpenNotification, profileId });
    useEffect(() => {
        latest.current = { announce, onOpenNotification, profileId };
    });

    const take = useCallback(
        (answer: SyncAnswer, notified: boolean, replay: boolean) => {
            applySync(queryClient, answer, last.current);
            last.current = answer.badges;
            setBadges(answer.badges);

            const fresh = newNotifications(answer).filter((n) => !announced.current.has(n.id));
            for (const n of fresh) announced.current.add(n.id);
            const text = replay ? null : announcementFor(fresh.length, !!answer.lists.notifications?.gap, notified, document.hasFocus());
            if (text) latest.current.announce(text);
        },
        [queryClient],
    );

    useEffect(() => {
        if (!inApp) {
            const poll = startBrowserPoll(api, (answer) => take(answer, false, false));
            runner.current = poll.wake;
            setSyncRunner(poll.wake);
            return () => {
                poll.stop();
                setSyncRunner(null);
            };
        }

        let stopped = false;
        const unlisten: (() => void)[] = [];
        const keep = (p: Promise<() => void>) =>
            void p.then(
                (fn) => (stopped ? fn() : unlisten.push(fn)),
                (e: unknown) => console.error('sync events', e),
            );
        keep(
            listen<SyncPayload | null>(SYNC_EVENT, (e) => {
                if (e.payload) take(e.payload.sync, e.payload.notified, false);
            }),
        );
        keep(
            listen<OpenNotificationPayload | null>(OPEN_NOTIFICATION_EVENT, (e) =>
                latest.current.onOpenNotification(clickedNotification(e.payload, latest.current.profileId)),
            ),
        );

        const now = () => {
            // the last answer Rust has: the badges at once, after a reload too
            void syncNow<SyncPayload>().then(
                (p) => {
                    if (p && !stopped && !last.current) take(p.sync, false, true);
                },
                (e: unknown) => console.error('sync', e),
            );
        };
        runner.current = now;
        setSyncRunner(now);
        now();
        return () => {
            stopped = true;
            for (const fn of unlisten) fn();
            setSyncRunner(null);
        };
    }, [api, take]);

    const value = useMemo<SyncValue>(() => ({ badges, syncNow: () => runner.current() }), [badges]);
    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
