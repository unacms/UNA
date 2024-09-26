import Pusher from 'pusher-js/react-native';
import { appSetting } from 'app/lib/util'

const conf = appSetting('config', 'sockets');
const pusherInstance = new Pusher(conf.key, {
    wsHost: conf.host,
    wsPort: conf.port,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    cluster: '',
});

export function subscribe(channel_name, event_name, cb) {
    if (pusherInstance) {
        let channel = pusherInstance.channel(channel_name);
        if (!channel)
            channel = pusherInstance.subscribe(channel_name);
            channel.bind(event_name, function (data) {
                cb(data)
            });
    }
};
/* optimized
export function subscribe(channel_name, event_name, cb) {
    if (pusherInstance) {
        if (!pusherInstance.boundEvents) {
            pusherInstance.boundEvents = {};
        }

        let channel = pusherInstance.channel(channel_name);
        if (!channel) {
            channel = pusherInstance.subscribe(channel_name);
        }

        if (!pusherInstance.boundEvents[channel_name]) {
            pusherInstance.boundEvents[channel_name] = {};
        }

        if (!pusherInstance.boundEvents[channel_name][event_name]) {
            pusherInstance.boundEvents[channel_name][event_name] = [];

            channel.bind(event_name, function(data) {
                pusherInstance.boundEvents[channel_name][event_name].forEach(callback => callback(data));
            });
        }

        pusherInstance.boundEvents[channel_name][event_name].push(cb);
}
}
*/