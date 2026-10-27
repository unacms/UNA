import type Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

// pusher-js loads with the first subscription instead of with every page, and not at all
// on a site without sockets.
let pusherPromise: Promise<Pusher | null> | null = null;
const bindingCounts = new Map<string, number>();

// A subscription whose chunk didn't load tries again after this long, doubling up to the max.
const RETRY_MS = 5000;
const RETRY_MAX_MS = 60000;

/** The shared client; null without a sockets config. Rejects when the pusher-js chunk didn't load. */
function getPusher(): Promise<Pusher | null> {
    if (pusherPromise) return pusherPromise;

    const conf = appSetting('config', 'sockets');
    if (!conf?.key || !conf?.host) return Promise.resolve(null);

    pusherPromise = import('pusher-js')
        .then(({ default: PusherClient }) => new PusherClient(conf.key, {
            wsHost: conf.host,
            wsPort: conf.port || 80,
            wssPort: conf.port || 443,
            forceTLS: true,
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
            cluster: 'mt1',
        }))
        .catch((error: unknown) => {
            pusherPromise = null; // the next call loads it again
            throw error;
        });

    return pusherPromise;
}

/** Bind `cb` to `event_name` on `channel_name`; returns the unsubscribe function. */
export function subscribe(channel_name: string, event_name: string, cb: (data: any) => void): () => void {
    let cancelled = false;
    let unbind: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const bind = (pusher: Pusher) => {
        let channel = pusher.channel(channel_name);
        if (!channel) channel = pusher.subscribe(channel_name);

        channel.bind(event_name, cb);
        bindingCounts.set(channel_name, (bindingCounts.get(channel_name) || 0) + 1);

        unbind = () => {
            channel.unbind(event_name, cb);
            const count = (bindingCounts.get(channel_name) || 1) - 1;
            if (count <= 0) {
                bindingCounts.delete(channel_name);
                pusher.unsubscribe(channel_name);
            } else {
                bindingCounts.set(channel_name, count);
            }
        };
    };

    // Callers subscribe once per mount, so a subscription that waited for a chunk that didn't
    // load (offline, or a deploy replaced it) keeps trying until it binds or is cancelled.
    const attempt = (delay: number) => {
        getPusher()
            .then((pusher) => {
                if (!cancelled && pusher) bind(pusher);
            })
            .catch(() => {
                if (!cancelled)
                    retryTimer = setTimeout(() => attempt(Math.min(delay * 2, RETRY_MAX_MS)), delay);
            });
    };
    attempt(RETRY_MS);

    // Unsubscribing before pusher-js loaded cancels the binding and any retry.
    return () => {
        cancelled = true;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = null;
        unbind?.();
        unbind = null;
    };
}
