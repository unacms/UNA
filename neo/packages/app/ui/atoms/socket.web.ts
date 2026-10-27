import type Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

// pusher-js loads with the first subscription instead of with every page, and not at all
// on a site without sockets.
let pusherPromise: Promise<Pusher | null> | null = null;
const bindingCounts = new Map<string, number>();

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
        .catch(() => {
            pusherPromise = null; // the chunk didn't load: the next subscription tries again
            return null;
        });

    return pusherPromise;
}

/** Bind `cb` to `event_name` on `channel_name`; returns the unsubscribe function. */
export function subscribe(channel_name: string, event_name: string, cb: (data: any) => void): () => void {
    let cancelled = false;
    let unbind: (() => void) | null = null;

    getPusher().then((pusher) => {
        if (cancelled || !pusher) return;

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
    });

    // Unsubscribing before pusher-js loaded cancels the binding.
    return () => {
        cancelled = true;
        unbind?.();
        unbind = null;
    };
}
