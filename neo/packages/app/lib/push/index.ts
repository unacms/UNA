import { appSetting, persistedGet, persistedSet } from 'app/lib/util';
import { pushProviders } from 'app/customization/push';
import { isSnoozed, promptDelayMs, promptEnabled, remainingDelayMs } from './prompt-rules';
import type { PushMember, PushProvider } from './types';

export type { PushMember, PushPermission, PushProvider } from './types';

/**
 * Push providers by name: core's (`providers.ts`) and a fork's own, added in
 * `customization/push.js`. `notifications.push_provider` picks one.
 */
export { pushProviders };

/** The provider this build uses, or `null` when push is off or not configured. */
export function getPushProvider(): PushProvider | null {
    const name = appSetting('notifications', 'push_provider');
    const provider = name ? (pushProviders as Record<string, PushProvider | undefined>)[name] : undefined;
    return provider && provider.isConfigured() ? provider : null;
}

/** Whether NEO may ask members to turn notifications on (`PushPrompt`). */
export function pushPromptEnabled(): boolean {
    return promptEnabled(
        appSetting('notifications', 'push_prompt'),
        // Before push providers, these turned the request off; a fork that set them still means it.
        appSetting('notifications', 'onesignal_request_on_load'),
        appSetting('native', 'onesignal_request_on_load'),
    );
}

export function pushPromptDelayMs(): number {
    return promptDelayMs(
        appSetting('notifications', 'push_prompt_delay_ms'),
        appSetting('notifications', 'onesignal_prompt_delay_ms'),
    );
}

// This run (a web tab, a native launch): when the member was first on a page, and whether this
// device has been linked with them.
let runMember: { id: string; since: number; linked: boolean } | null = null;

function runOf(memberId: number | string) {
    const id = String(memberId);
    if (runMember?.id !== id) runMember = { id, since: Date.now(), linked: false };
    return runMember;
}

/**
 * What is left of the delay for this member. It counts from their first page of the run: the
 * layout that mounts `PushPrompt` is mounted again by every page on the web.
 */
export function pushPromptWaitMs(memberId: number | string): number {
    return remainingDelayMs(pushPromptDelayMs(), runOf(memberId).since, Date.now());
}

/** Links this device with the member for the provider, once per run however many pages ask. */
export async function linkPushMember(provider: PushProvider, member: PushMember): Promise<void> {
    const run = runOf(member.id);
    if (run.linked) return;
    run.linked = true;
    try {
        await provider.login(member);
    } catch (error) {
        run.linked = false;
        throw error;
    }
}

const SNOOZE_KEY = 'push_prompt_dismissed_at';

/** The member put the dialog off less than `push_prompt_snooze_days` ago on this device. */
export async function isPushPromptSnoozed(): Promise<boolean> {
    return isSnoozed(await persistedGet(SNOOZE_KEY), Date.now(), appSetting('notifications', 'push_prompt_snooze_days'));
}

export function snoozePushPrompt(): Promise<void> {
    return persistedSet(SNOOZE_KEY, Date.now());
}

/** Unlink this device from the member on sign-out. */
export async function logoutPush() {
    runMember = null;
    await getPushProvider()?.logout();
}
