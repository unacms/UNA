import Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

export function subscribe() {

    const pusher = new Pusher(appSetting('sockets', 'key'), {
        wsHost: appSetting('sockets', 'host'),
        wsPort: appSetting('sockets', 'port'),
        forceTLS: false, 
        enabledTransports: ['ws', 'wss'],
        cluster: '',
    });

    var channel = pusher.subscribe('bx_posts_53');
        
    channel.bind('comment_added', function(data) {
        console.log(data)
    });
};
