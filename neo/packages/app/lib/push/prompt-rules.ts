/**
 * When NEO's push dialog (`PushPrompt`) may show. Pure, so the rules have tests:
 * `node --test packages/app/lib/push/prompt-rules.test.ts`.
 */

export const DEFAULT_PROMPT_DELAY_MS = 2 * 60 * 1000;
export const DEFAULT_SNOOZE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A setting as a number of zero or more, or `null` when it is unset or not one. `appSetting`
 * answers `''` for a missing key, which `Number()` would read as 0.
 */
export function settingNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
    if (typeof value !== 'string' || value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * How long after a member's first page the dialog shows: `push_prompt_delay_ms`, else the older
 * `onesignal_prompt_delay_ms` a fork may still set, else two minutes.
 */
export function promptDelayMs(own: unknown, legacy?: unknown): number {
    return settingNumber(own) ?? settingNumber(legacy) ?? DEFAULT_PROMPT_DELAY_MS;
}

/**
 * What is left of the delay. It counts from the member's first page of this run (`startedAt`),
 * so opening another page does not start it again.
 */
export function remainingDelayMs(delayMs: number, startedAt: number, now: number): number {
    return Math.max(0, delayMs - Math.max(0, now - startedAt));
}

/** "Not now" (`dismissedAt`, ms) was less than `days` ago (`push_prompt_snooze_days`, 14 when unset). */
export function isSnoozed(dismissedAt: unknown, now: number, days?: unknown): boolean {
    const at = settingNumber(dismissedAt);
    if (!at) return false;
    const age = now - at;
    // A time in the future is a clock that was set back: it must not keep the dialog away for good.
    return age >= 0 && age < (settingNumber(days) ?? DEFAULT_SNOOZE_DAYS) * DAY_MS;
}

/** Each of the settings that can turn the dialog off; only an explicit `false` does. */
export function promptEnabled(...switches: unknown[]): boolean {
    return switches.every((value) => value !== false);
}
