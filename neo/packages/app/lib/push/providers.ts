import { oneSignalProvider } from './onesignal';
import type { PushProvider } from './types';

/**
 * Core's push providers by name. `notifications.push_provider` picks one. A fork adds its own in
 * `customization/push.js`, which re-exports this map.
 */
export const pushProvidersDefault: Record<string, PushProvider> = {
    onesignal: oneSignalProvider,
};
