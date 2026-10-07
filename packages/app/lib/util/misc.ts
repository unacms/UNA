import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import md5Hex from 'blueimp-md5';
import Clipboard from '@react-native-clipboard/clipboard';
import { isWeb } from './layout';
import { appSetting } from './settings';
import type { TFunction } from 'i18next';

export async function subscribeOneSignal(currentUser: { id: number | string; hash?: string }, askPermission = false): Promise<void> {
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

export async function getClipboard(): Promise<string> {
    if (isWeb) {
        return await navigator.clipboard.readText();

    }
    else {
        return await Clipboard.getString();
    }
}

export async function setClipboard(str: string): Promise<void> {
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

/**
 * Sync MD5 hex of a string (UTF-8). Used as a stable key for resumable
 * uploads — not for anything security-related.
 */
export function md5(str: unknown): string {
    return md5Hex(String(str ?? ''));
}

/**
 * Stable palette color name (`theme.profile_colors`) for an id or title — same input,
 * same color on every platform. Used as `bg-${color}-500` for avatar placeholders.
 * Keep the palette in sync with the `@source inline("bg-{…}-500")` list in
 * design/styles/utilities.css, or web won't generate the classes.
 */
export function getRandomColor(str?: string | number | null): string {
    const s = str ? String(str) : 'a';
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    const palette: string[] = appSetting('theme', 'profile_colors') || [];
    // Fallback must be in the utilities.css safelist too (callers append `-500`).
    if (!palette.length) return 'orange';
    return palette[Math.abs(hash % palette.length)]!;
}

export function visibilityById(visibility: string | number, t: TFunction): { icon: string; text: string } | null {

    const visibilityOptions: Record<string | number, { icon: string; text: string }> = {
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

export function genRnd(length: number): string {
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

export function isNumeric(str: any): boolean {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

export function getIconByNameFromIconset<T>(iconset: Record<string, T>, name: string): T | undefined {
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
