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
    if (!pusherInstance) return () => { };

    let channel = pusherInstance.channel(channel_name);
    if (!channel) channel = pusherInstance.subscribe(channel_name);

    channel.bind(event_name, cb);

    return () => channel.unbind(event_name, cb);  // ✅ Добавить возврат функции отписки
}