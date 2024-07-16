import Pusher from 'pusher-js';
import { appSetting } from 'app/lib/util'

const conf = appSetting('config', 'sockets');
const pusherInstance = new Pusher(conf.key, {
    wsHost: conf.host,
    wsPort: conf.port,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    cluster: '',
});

const boundEvents = [];

export function subscribe(channel_name, event_name, cb) {
    if (pusherInstance) {
        let channel = pusherInstance.channel(channel_name);
        if (!channel)
            channel = pusherInstance.subscribe(channel_name);

        //if (!boundEvents[channel_name]) {
         //   boundEvents[channel_name] = [];
           // boundEvents[channel_name].push(event_name);
            channel.bind(event_name, function (data) {
                cb(data)
            });
      //  }


    }
};
/*
export function unbind(pusher, channel_name) {
    if (pusherInstance) {
        const channel = pusherInstance.channel(channel_name);
        if (channel) {
            channel.unbind();
        }
    }
};*/