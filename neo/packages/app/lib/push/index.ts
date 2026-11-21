import { appSetting, persistedGet, persistedSet } from 'app/lib/util';
import { oneSignalProvider } from './onesignal';
import type { PushProvider } from './types';

export type { PushMember, PushPermission, PushProvider } from './types';

/**
 * Push providers by name. `notifications.push_provider` picks one. A fork adds its own by
 * adding a key here (from a customization file loaded at start, such as `settings.js`) and
 * naming it in that setting.
 */
export const pushProviders: Record<string, PushProvider> = {
    onesignal: oneSignalProvider,
};

/** The provider this build uses, or `null` when push is off or not configured. */
export function getPushProvider(): PushProvider | null {
    const name = appSetting('notifications', 'push_provider') ?? 'onesignal';
    const provider = name ? pushProviders[name] : undefined;
    return provider && provider.isConfigured() ? provider : null;
}

/** Whether NEO may ask members to turn notifications on (`PushPrompt`). */
export function pushPromptEnabled(): boolean {
    if (appSetting('notifications', 'push_prompt') === false) return false;
    // Before push providers, these turned the request off; a fork that set them still means it.
    return appSetting('notifications', 'onesignal_request_on_load') !== false
        && appSetting('native', 'onesignal_request_on_load') !== false;
}

export function pushPromptDelayMs(): number {
    const delay = Number(
        appSetting('notifications', 'push_prompt_delay_ms')
        ?? appSetting('notifications', 'onesignal_prompt_delay_ms')
    );
    return Number.isFinite(delay) && delay >= 0 ? delay : 2 * 60 * 1000;
}

const SNOOZE_KEY = 'push_prompt_dismissed_at';

/** "Not now" was pressed less than `push_prompt_snooze_days` ago on this device. */
export async function isPushPromptSnoozed(): Promise<boolean> {
    const dismissedAt = Number(await persistedGet(SNOOZE_KEY));
    if (!dismissedAt) return false;
    const days = Number(appSetting('notifications', 'push_prompt_snooze_days') ?? 14);
    return Date.now() - dismissedAt < days * 24 * 60 * 60 * 1000;
}

export function snoozePushPrompt(): Promise<void> {
    return persistedSet(SNOOZE_KEY, Date.now());
}

/** Unlink this device from the member on sign-out. */
export async function logoutPush() {
    await getPushProvider()?.logout();
}
