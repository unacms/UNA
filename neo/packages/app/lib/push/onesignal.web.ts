import { appSetting } from 'app/lib/util';
import type { PushMember, PushPermission, PushProvider } from './types';

type OneSignalWeb = typeof import('react-onesignal').default;

let sdkPromise: Promise<OneSignalWeb> | null = null;
let sdk: OneSignalWeb | null = null;

function appId(): string {
    return appSetting('config', 'api_keys', 'onesignal') || '';
}

function isConfigured() {
    return Boolean(
        typeof window !== 'undefined' &&
        appId() &&
        window.location.hostname !== 'localhost' &&
        !appSetting('config', 'onesignal_web_disable')
    );
}

function load(): Promise<OneSignalWeb> {
    if (sdk) return Promise.resolve(sdk);
    if (!sdkPromise) {
        sdkPromise = import('react-onesignal')
            .then(async ({ default: OneSignal }) => {
                try {
                    await OneSignal.init({
                        appId: appId(),
                        allowLocalhostAsSecureOrigin: true,
                        // NEO asks with its own dialog (PushPrompt). OneSignal's slidedown and welcome
                        // notification would show the OneSignal dashboard's icon and wording instead.
                        promptOptions: {
                            slidedown: { prompts: [{ type: 'push', autoPrompt: false, delay: {} }] },
                        },
                        // `message` is required by the typings and unused while disabled.
                        welcomeNotification: { disable: true, message: '' },
                    });
                } catch (error) {
                    const message = (error as Error)?.message || String(error);
                    if (!message.includes('already initialized')) throw error;
                }
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
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        return 'unsupported';
    }
    const native = window.Notification.permission;
    return native === 'granted' || native === 'denied' ? native : 'default';
}

async function requestPermission(): Promise<boolean> {
    // Straight from the press: the SDK is loaded by prepare(), so nothing awaits before the request.
    if (sdk) {
        return sdk.Notifications.requestPermission().then(() => window.Notification.permission === 'granted');
    }
    const OneSignal = await load();
    await OneSignal.Notifications.requestPermission();
    return window.Notification.permission === 'granted';
}

async function login(member: PushMember) {
    const OneSignal = await load();
    await OneSignal.login(String(member.id));
    if (member.hash) {
        await OneSignal.User.addTag('user_hash', String(member.hash));
    }
}

async function logout() {
    // logout() throws if init never completed (localhost, disabled, never prompted).
    if (!sdk || !isConfigured()) return;
    try {
        await sdk.logout();
    } catch (error) {
        // Non-fatal: session cleanup must not fail because of push SDK state.
        console.warn('OneSignal logout skipped:', (error as Error)?.message || error);
    }
}

export const oneSignalProvider: PushProvider = {
    name: 'onesignal',
    isConfigured,
    permission,
    prepare: async () => {
        await load();
    },
    requestPermission,
    login,
    logout,
};
