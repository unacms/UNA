import { appSetting } from 'app/lib/util';
import type { PushMember, PushPermission, PushProvider } from './types';

type OneSignalNative = typeof import('react-native-onesignal').OneSignal;

let sdkPromise: Promise<OneSignalNative> | null = null;
let sdk: OneSignalNative | null = null;

function appId(): string {
    return appSetting('config', 'api_keys', 'onesignal') || '';
}

function load(): Promise<OneSignalNative> {
    if (sdk) return Promise.resolve(sdk);
    if (!sdkPromise) {
        sdkPromise = import('react-native-onesignal')
            .then(({ LogLevel, OneSignal }) => {
                OneSignal.Debug.setLogLevel(LogLevel.None);
                OneSignal.initialize(appId());
                sdk = OneSignal;
                return OneSignal;
            })
            .catch((error) => {
                sdkPromise = null;
                throw error;
            });
    }
    return sdkPromise;
}

async function permission(): Promise<PushPermission> {
    const OneSignal = await load();
    if (await OneSignal.Notifications.getPermissionAsync()) return 'granted';
    // Not granted and the system won't ask again: the member said no (or turned them off in Settings).
    return (await OneSignal.Notifications.canRequestPermission()) ? 'default' : 'denied';
}

async function requestPermission(): Promise<boolean> {
    const OneSignal = await load();
    // fallbackToSettings: false — NEO's dialog only shows while the system can still ask.
    await OneSignal.Notifications.requestPermission(false);
    return OneSignal.Notifications.getPermissionAsync();
}

async function login(member: PushMember) {
    const OneSignal = await load();
    OneSignal.login(String(member.id));
    if (member.hash) {
        OneSignal.User.addTag('user_hash', String(member.hash));
    }
}

async function logout() {
    if (!sdk) return;
    try {
        sdk.logout();
    } catch (error) {
        console.warn('OneSignal logout skipped:', (error as Error)?.message || error);
    }
}

export const oneSignalProvider: PushProvider = {
    name: 'onesignal',
    isConfigured: () => Boolean(appId()),
    permission,
    prepare: async () => {
        await load();
    },
    requestPermission,
    login,
    logout,
};
