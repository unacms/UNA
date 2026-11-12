import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { ensureOk } from '../../lib/api';
import { useApp } from '../../lib/context';
import { openExternal } from '../../lib/native';
import { useNavigation } from '../../lib/navigation';
import { markReadInCache, type Notification, NOTIFICATIONS_KEY, requestSync } from '../../lib/sync';
import { profileRoute } from '../../lib/router';
import { notificationRoute } from '../../lib/targets';

export type NotificationActions = {
    /**
     * Open what a notification is about (the post in the detail pane, a profile's or group's
     * page), else who did it, and mark it read; only one with neither opens on the site. `fromOutside`: from an OS notification, so the
     * notifications are the list next to it. Rejects with a message when a link can't open.
     */
    open: (n: Notification, fromOutside?: boolean) => Promise<void>;
    /** Mark one notification read (and so the older ones), or all of them (null). */
    markRead: (upTo: Notification | null) => Promise<void>;
};

export function useNotificationActions(): NotificationActions {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { history, openDetail } = useNavigation();

    const markRead = useCallback(
        async (upTo: Notification | null) => {
            // read state is one marker per profile: the older ones are read too
            markReadInCache(queryClient, upTo?.id ?? null);
            try {
                ensureOk(await api.POST('/notifications/read', { body: upTo ? { ids: [upTo.id] } : {} }));
            } catch (e) {
                void queryClient.invalidateQueries(NOTIFICATIONS_KEY);
                throw e;
            } finally {
                // the badges, at once
                requestSync();
            }
        },
        [api, queryClient],
    );

    const open = useCallback(
        async (n: Notification, fromOutside = false) => {
            if (!n.read) void markRead(n).catch(() => {});
            // nothing the app shows: the nearest thing it does, the actor's page
            const route = notificationRoute(n) ?? (n.actor ? profileRoute(n.actor.id) : null);
            if (route) {
                if (fromOutside) history.push({ list: { section: 'notifications' }, detail: route });
                else openDetail(route);
                return;
            }
            if (fromOutside) history.push({ list: { section: 'notifications' }, detail: null });
            if (n.url) await openExternal(n.url);
        },
        [history, markRead, openDetail],
    );

    return { open, markRead };
}
