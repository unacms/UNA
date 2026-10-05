import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util'
import { hasRecentUserGesture } from 'app/lib/platform/feedback-haptics';

const cache = new Map<string, HTMLAudioElement>();
const isSounds = appSetting('layout', 'sounds');

/**
 * Interaction sounds must follow a real pointer/key activation — mount effects
 * and URL sync must not click. Event sounds (`notif` from the daemon poll,
 * `success` after a network round trip) are allowed on sticky activation.
 */
const GESTURE_GATED_SOUNDS = new Set(['click', 'tab']);

export const playSound = (name: string): void => {
    if (!isSounds)
        return;
    if (GESTURE_GATED_SOUNDS.has(name) && !hasRecentUserGesture())
        return;
    try {
        let audio = cache.get(name);
        if (!audio) {
            audio = new Audio((Sounds as Record<string, string>)[name]);
            audio.volume = 0.5;
            cache.set(name, audio);
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {}
};

export const useSound = (name: string) => () => playSound(name);
export const initAudio = async (): Promise<void> => {};