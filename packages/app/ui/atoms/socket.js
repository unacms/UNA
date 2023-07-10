import Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

export function subscribe(pusher, channel_name, event_name, cb) {

    if (pusher){
        var channel = pusher.subscribe(channel_name);
        channel.bind(event_name, function(data) {
            cb(data)
        });
    }
};

export function connect(channel_name, event_name, cb) {
    return new Pusher(appSetting('sockets', 'key'), {
        wsHost: appSetting('sockets', 'host'),
        wsPort: appSetting('sockets', 'port'),
        forceTLS: false, 
        enabledTransports: ['ws', 'wss'],
        cluster: '',
    });
}
