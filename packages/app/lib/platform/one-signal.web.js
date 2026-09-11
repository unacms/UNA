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

function canUseOneSignal(currentUser) {
    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');
    const isLocalhost = window.location.hostname === 'localhost';

    return Boolean(
        currentUser?.id &&
        ONESIGNAL_KEY &&
        !isLocalhost &&
        !appSetting('config', 'onesignal_web_disable')
    );
}

export function scheduleOneSignalSubscription(currentUser, options = {}) {
    if (typeof window === 'undefined' || !currentUser?.id) {
        return () => {};
    }

    const delay = getPromptDelayMs(options.delayMs);
    const timer = window.setTimeout(() => {
        void subscribeOneSignal(currentUser, options.askPermission ?? true).catch((error) => {
            console.error('OneSignal subscription error:', error);
        });
    }, delay);

    return () => window.clearTimeout(timer);
}

export async function subscribeOneSignal(currentUser, askPermission = true) {
    if (typeof window === 'undefined' || !canUseOneSignal(currentUser)) {
        return;
    }

    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');

    if (window.OneSignal && (window.OneSignal.isInitialized || window.OneSignal._isInitialized)) {
        oneSignalInitialized = true;
    }

    if (!oneSignalInitialized) {
        if (!oneSignalInitPromise) {
            oneSignalInitPromise = import('react-onesignal')
                .then(async ({ default: OneSignal }) => {
                    await OneSignal.init({
                        appId: ONESIGNAL_KEY,
                        allowLocalhostAsSecureOrigin: true,
                        promptOptions: {
                            slidedown: {
                                prompts: [{
                                    type: 'push',
                                    autoPrompt: false,
                                }],
                            },
                        },
                    });
                    oneSignalInitialized = true;
                    return OneSignal;
                })
                .catch((error) => {
                    const errorMessage = error?.message || error?.toString() || '';
                    if (errorMessage.includes('already initialized') ||
                        errorMessage.includes('SDK already initialized')) {
                        oneSignalInitialized = true;
                        return import('react-onesignal').then(({ default: OneSignal }) => OneSignal);
                    }

                    console.error('OneSignal initialization error:', error);
                    throw error;
                })
                .finally(() => {
                    oneSignalInitPromise = null;
                });
        }

        await oneSignalInitPromise;
    }

    const { default: OneSignal } = await import('react-onesignal');

    await OneSignal.login(String(currentUser.id));
    if (currentUser.hash) {
        await OneSignal.User.addTag('user_hash', String(currentUser.hash));
    }

    if (askPermission) {
        OneSignal.Slidedown.promptPush();
    }
}

/** Detach external user id on sign-out so the next account is not linked. */
export async function logoutOneSignal() {
    if (typeof window === 'undefined') {
        return;
    }

    if (!appSetting('config', 'api_keys', 'onesignal') || appSetting('config', 'onesignal_web_disable')) {
        return;
    }

    // react-onesignal.logout() throws if init never completed (e.g. localhost / disabled).
    const sdkReady =
        oneSignalInitialized ||
        window.OneSignal?.isInitialized ||
        window.OneSignal?._isInitialized;

    if (!sdkReady) {
        return;
    }

    try {
        const { default: OneSignal } = await import('react-onesignal');
        if (typeof OneSignal?.logout === 'function') {
            await OneSignal.logout();
        }
    } catch (error) {
        // Non-fatal: session cleanup must not fail because of push SDK state.
        console.warn('OneSignal logout skipped:', error?.message || error);
    }
}
