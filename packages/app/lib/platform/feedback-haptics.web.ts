import { WebHaptics } from 'web-haptics';
import { appSetting } from 'app/config';

/**
 * Mobile web haptics via [web-haptics](https://github.com/lochie/web-haptics).
 * Synth “click” audio (like [haptics.lochie.me](https://haptics.lochie.me/)) uses the library’s `debug` audio path; gated by `layout.sounds` + `layout.web_haptics_sounds`.
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

function shouldPlayWebHapticsSynthAudio() {
    if (!Boolean(appSetting('layout', 'sounds'))) return false;
    const raw = appSetting('layout', 'web_haptics_sounds');
    if (raw === '' || raw === undefined) return true;
    return Boolean(raw);
}

/**
 * web-haptics `trigger()` awaits `ensureAudio()` before `playClick()`. That async gap
 * runs after the browser’s user-gesture window, so the first synth click is often
 * silent until `AudioContext` is already running. Radix tabs fire `onValueChange` from
 * `onMouseDown`, which is *after* `pointerdown`, so we kick off `ensureAudio()` on
 * capture-phase `pointerdown` (still a user gesture) so resume + playback line up.
 * Keyboard tab activation uses keydown (Enter/Space) without a preceding pointerdown.
 *
 * Clicks/keys also stamp a recent-gesture flag. Tab auto-select and other mount
 * effects must not play audio — only a real pointer/key activation should.
 */
let webHapticsAudioPrimed = false;
let lastUserGestureAt = 0;
const USER_GESTURE_AUDIO_MS = 1000;

function markUserGesture() {
    lastUserGestureAt = Date.now();
}

export function hasRecentUserGesture(maxAgeMs = USER_GESTURE_AUDIO_MS) {
    if (lastUserGestureAt <= 0) return false;
    if (typeof navigator !== 'undefined' && navigator.userActivation?.isActive) {
        return true;
    }
    return Date.now() - lastUserGestureAt < maxAgeMs;
}

function primeWebHapticsAudioFromUserGesture() {
    markUserGesture();
    if (webHapticsAudioPrimed) return;
    if (!shouldPlayWebHapticsSynthAudio()) {
        webHapticsAudioPrimed = true;
        return;
    }
    const h = getHaptics();
    if (!h) return;
    h.setDebug(true);
    // ensureAudio is private in web-haptics' typings; called on purpose to warm up audio.
    void (h as any).ensureAudio?.();
    webHapticsAudioPrimed = true;
}

function installWebHapticsAudioPriming() {
    if (typeof document === 'undefined') return;
    document.addEventListener(
        'pointerdown',
        primeWebHapticsAudioFromUserGesture,
        { capture: true, passive: true }
    );
    document.addEventListener(
        'keydown',
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                primeWebHapticsAudioFromUserGesture();
            }
        },
        { capture: true }
    );
}

installWebHapticsAudioPriming();

export function FeedbackHaptics(type?: string) {
    if (typeof type !== 'string') return;
    if (!hasRecentUserGesture()) return;
    const h = getHaptics();
    if (!h) return;
    const preset = PRESET_BY_TYPE[type];
    if (!preset) return;

    h.setDebug(shouldPlayWebHapticsSynthAudio());

    void h.trigger(preset).catch(() => {});
}
