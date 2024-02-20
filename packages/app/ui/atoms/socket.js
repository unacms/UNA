import Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

export function subscribe(pusher, channel_name, event_name, cb) {
    if (pusher) {
        var channel = pusher.subscribe(channel_name);
        channel.bind(event_name, function (data) {
            cb(data)
        });
    }
};

export function unbind(pusher, channel_name) {
    if (pusher) {
        const channel = pusher.channel(channel_name);
        if (channel) {
            channel.unbind();
        }
    }
};

export function connect(channel_name, event_name, cb) {
    const conf = appSetting('config', 'sockets');
    return new Pusher(conf.key, {
        wsHost: conf.host,
        wsPort: conf.port,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        cluster: '',
    });
}
