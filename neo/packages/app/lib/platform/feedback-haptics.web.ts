import { WebHaptics } from 'web-haptics';

/**
 * Mobile web haptics via [web-haptics](https://github.com/lochie/web-haptics):
 * vibration only. Interface sounds are Cuelume's (`app/lib/sound`), so the
 * library's synthesized "debug" click stays off.
 * Maps the same `type` strings as native `expo-haptics` in `feedback-haptics.ts`.
 */
let singleton: WebHaptics | undefined;

function getHaptics() {
    if (typeof window === 'undefined') return null;
    if (!singleton) {
        singleton = new WebHaptics({ showSwitch: false });
    }
    return singleton;
}

const PRESET_BY_TYPE: Record<string, string> = {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
    Select: 'selection',
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    /** Same pattern as [haptics.lochie.me](https://haptics.lochie.me/) “nudge” — `trigger([{ duration: 80, intensity: 0.8 }, { delay: 80, duration: 50, intensity: 0.3 }])` */
    Nudge: 'nudge',
};

/**
 * Clicks and Enter/Space stamp a recent-gesture flag: tab auto-select and
 * other mount effects must not vibrate, only a real pointer/key activation.
 */
let lastUserGestureAt = 0;
const USER_GESTURE_MS = 1000;

function markUserGesture() {
    lastUserGestureAt = Date.now();
}

export function hasRecentUserGesture(maxAgeMs = USER_GESTURE_MS) {
    if (lastUserGestureAt <= 0) return false;
    if (typeof navigator !== 'undefined' && navigator.userActivation?.isActive) {
        return true;
    }
    return Date.now() - lastUserGestureAt < maxAgeMs;
}

function installUserGestureTracking() {
    if (typeof document === 'undefined') return;
    document.addEventListener('pointerdown', markUserGesture, { capture: true, passive: true });
    document.addEventListener(
        'keydown',
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                markUserGesture();
            }
        },
        { capture: true }
    );
}

installUserGestureTracking();

export function FeedbackHaptics(type?: string) {
    if (typeof type !== 'string') return;
    if (!hasRecentUserGesture()) return;
    const h = getHaptics();
    if (!h) return;
    const preset = PRESET_BY_TYPE[type];
    if (!preset) return;

    void h.trigger(preset).catch(() => {});
}
