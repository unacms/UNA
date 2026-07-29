import Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

let pusherInstance = null;
const bindingCounts = new Map();

function getPusher() {
    if (pusherInstance) return pusherInstance;

    const conf = appSetting('config', 'sockets');
    if (!conf?.key || !conf?.host) return null;

    pusherInstance = new Pusher(conf.key, {
        wsHost: conf.host,
        wsPort: conf.port || 80,
        wssPort: conf.port || 443,
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        cluster: 'mt1',
    });

    return pusherInstance;
}

export function subscribe(channel_name, event_name, cb) {
    const pusher = getPusher();
    if (!pusher) return () => { };

    let channel = pusher.channel(channel_name);
    if (!channel) channel = pusher.subscribe(channel_name);

    channel.bind(event_name, cb);
    bindingCounts.set(channel_name, (bindingCounts.get(channel_name) || 0) + 1);

    return () => {
        channel.unbind(event_name, cb);
        const count = (bindingCounts.get(channel_name) || 1) - 1;
        if (count <= 0) {
            bindingCounts.delete(channel_name);
            pusher.unsubscribe(channel_name);
        } else {
            bindingCounts.set(channel_name, count);
        }
    };
}
