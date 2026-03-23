import { WebHaptics } from 'web-haptics';
import { appSetting } from 'app/config';

/**
 * Mobile web haptics via [web-haptics](https://github.com/lochie/web-haptics).
 * Synth “click” audio (like [haptics.lochie.me](https://haptics.lochie.me/)) uses the library’s `debug` audio path; gated by `layout.sounds` + `layout.web_haptics_sounds`.
 * Maps the same `type` strings as native `expo-haptics` in `feedback-haptics.js`.
 */
let singleton;

function getHaptics() {
    if (typeof window === 'undefined') return null;
    if (!singleton) {
        singleton = new WebHaptics({ showSwitch: false });
    }
    return singleton;
}

const PRESET_BY_TYPE = {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
    Select: 'selection',
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
};

function shouldPlayWebHapticsSynthAudio() {
    if (!Boolean(appSetting('layout', 'sounds'))) return false;
    const raw = appSetting('layout', 'web_haptics_sounds');
    if (raw === '' || raw === undefined) return true;
    return Boolean(raw);
}

export function FeedbackHaptics(type) {
    if (typeof type !== 'string') return;
    const h = getHaptics();
    if (!h) return;
    const preset = PRESET_BY_TYPE[type];
    if (!preset) return;

    h.setDebug(shouldPlayWebHapticsSynthAudio());

    void h.trigger(preset).catch(() => {});
}
