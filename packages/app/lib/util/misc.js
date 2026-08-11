import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import * as Crypto from 'expo-crypto';
import { md5Sync } from 'app/lib/md5-string';
import Clipboard from '@react-native-clipboard/clipboard';
import { isWeb } from './layout';
import { appSetting } from './settings';

export async function subscribeOneSignal(currentUser, askPermission = false) {
    if (isWeb) return;
    const { LogLevel, OneSignal } = await import('react-native-onesignal');
    OneSignal.Debug.setLogLevel(LogLevel.None);
    OneSignal.initialize(appSetting('config', 'api_keys', 'onesignal'));

    if (Platform.OS === "android") {
        // TODO: better solution would be to ask user if they want to receive notifications
        // and only then request permissions, instead of delay.
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    let permissionStatus = await OneSignal.Notifications.getPermissionAsync();
    //console.log("OneSignal permission status before request:", permissionStatus);

    if (!permissionStatus && askPermission) {
        await OneSignal.Notifications.requestPermission(true);
        permissionStatus = await OneSignal.Notifications.getPermissionAsync();
        //console.log("OneSignal permission status after request:", permissionStatus);
    }

    if (permissionStatus) {
        /*console.log("OneSignal data:", {
            id: await OneSignal.User.getOnesignalId(),
            token: await OneSignal.User.pushSubscription.getTokenAsync(),
            optedIn: await OneSignal.User.pushSubscription.getOptedInAsync(),
            permission: permissionStatus
        });*/

        await OneSignal.login(String(currentUser.id));
        await OneSignal.User.addTag("user_hash", String(currentUser.hash));
    }

    // Method for listening for notification clicks
    /*OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('OneSignal: notification clicked:', event);
    });*/
}

export async function getClipboard() {
    if (isWeb) {
        return await navigator.clipboard.readText();

    }
    else {
        return await Clipboard.getString();
    }
}

export async function setClipboard(str) {
    if (!isWeb) {
        Clipboard.setString(str);
    }
    else {
        await navigator.clipboard.writeText(str);
    }
}

export function clearNotif() {

    const clearNotifications = async () => {
        fetcher('/api.php?r=bx_notifications/mark_as_read/')
    }

    clearNotifications();

}

export function md5(str) {
    return md5Sync(String(str ?? ''));
}
export async function md52(str) {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        str
    );
}

export function getAlert(type, data) {
    /*
    connections:action
    */
    return { type: type, data: data };
}

export function getRandomColor(str) {
    if (!str)
        str = 'a';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    var arr = appSetting('theme', 'profile_colors')
    return arr[Math.abs(hash % 10)];
}

export function visibilityById(visibility, t) {

    const visibilityOptions = {
        2: { icon: 'Lock', text: t('Me only') },
        3: { icon: 'Globe', text: t('Public') },
        5: { icon: 'UsersRound', text: t('Friends') },
        'c': { icon: 'EyeClosed', text: t('Closed') },
        's': { icon: 'Shield', text: t('Secret') },
        6: { icon: 'UserCheck', text: t('Specific Friends...') },
        7: { icon: 'Workflow', text: t('Relationships') },
        8: { icon: 'Workflow', text: t('Specific Relationships...') },
        9: { icon: 'Award', text: t('Specific Memberships...') },
    };

    return visibilityOptions[visibility] || null;
}

export function genRnd(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

export function getIconByNameFromIconset(iconset, name) {
    let icon = iconset[name];
    if (!icon) {
        Object.keys(iconset).find((item) => {
            if (name.includes(item)) {
                icon = iconset[item];
                return true;
            }
        });
    }
    return icon;
}
