import { Platform } from 'react-native';
import { appSetting } from 'app/lib/util';

const DEFAULT_PROMPT_DELAY_MS = 2 * 60 * 1000;

let oneSignalInitialized = false;
let oneSignalInitPromise = null;

function getPromptDelayMs(delayMs) {
    const configuredDelay = delayMs ?? appSetting('notifications', 'onesignal_prompt_delay_ms');
    const parsedDelay = Number(configuredDelay);

    return Number.isFinite(parsedDelay) && parsedDelay >= 0
        ? parsedDelay
        : DEFAULT_PROMPT_DELAY_MS;
}

export function scheduleOneSignalSubscription(currentUser, options = {}) {
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

export async function subscribeOneSignal(currentUser, askPermission = false) {
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
