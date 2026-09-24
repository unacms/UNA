import { Platform } from 'react-native';
import { appSetting } from 'app/lib/util';

const DEFAULT_PROMPT_DELAY_MS = 2 * 60 * 1000;

let oneSignalInitialized = false;
/** Signed-in user fields OneSignal needs (`false`/`null` = guest). */
type OneSignalUser = { id?: number | string; hash?: string } | null | undefined;

let oneSignalInitPromise: Promise<unknown> | null = null;

function getPromptDelayMs(delayMs: number | undefined) {
    const configuredDelay = delayMs ?? appSetting('notifications', 'onesignal_prompt_delay_ms');
    const parsedDelay = Number(configuredDelay);

    return Number.isFinite(parsedDelay) && parsedDelay >= 0
        ? parsedDelay
        : DEFAULT_PROMPT_DELAY_MS;
}

export function scheduleOneSignalSubscription(currentUser: OneSignalUser, options: { delayMs?: number; askPermission?: boolean } = {}) {
    if (!currentUser?.id) {
        return () => {};
    }

    const delay = getPromptDelayMs(options.delayMs);
    const timer = setTimeout(() => {
        void subscribeOneSignal(currentUser, options.askPermission ?? false).catch((error) => {
            console.error('OneSignal subscription error:', error);
        });
    }, delay);

    return () => clearTimeout(timer);
}

export async function subscribeOneSignal(currentUser: OneSignalUser, askPermission = false) {
    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');
    if (!currentUser?.id || !ONESIGNAL_KEY) {
        return;
    }

    const { LogLevel, OneSignal } = await import('react-native-onesignal');

    if (!oneSignalInitialized) {
        if (!oneSignalInitPromise) {
            oneSignalInitPromise = (async () => {
                OneSignal.Debug.setLogLevel(LogLevel.None);
                OneSignal.initialize(ONESIGNAL_KEY);
                oneSignalInitialized = true;
            })().finally(() => {
                oneSignalInitPromise = null;
            });
        }

        await oneSignalInitPromise;
    }

    if (Platform.OS === 'android') {
        // Keep the existing Android grace period so permission UI does not compete with app startup.
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    let permissionStatus = await OneSignal.Notifications.getPermissionAsync();

    if (!permissionStatus && askPermission) {
        await OneSignal.Notifications.requestPermission(true);
        permissionStatus = await OneSignal.Notifications.getPermissionAsync();
    }

    if (permissionStatus) {
        await OneSignal.login(String(currentUser.id));
        if (currentUser.hash) {
            await OneSignal.User.addTag('user_hash', String(currentUser.hash));
        }
    }
}

/** Detach external user id on sign-out so the next account is not linked. */
export async function logoutOneSignal() {
    if (!oneSignalInitialized || !appSetting('config', 'api_keys', 'onesignal')) {
        return;
    }

    try {
        const { OneSignal } = await import('react-native-onesignal');
        if (typeof OneSignal?.logout === 'function') {
            await OneSignal.logout();
        }
    } catch (error) {
        console.error('OneSignal logout error:', error);
    }
}
