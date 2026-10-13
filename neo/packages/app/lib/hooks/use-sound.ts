import { useCallback } from 'react';
import { LEGACY_SOUNDS, playCue, startInterfaceSounds } from 'app/lib/sound';
import type { Cue } from 'app/lib/sound';

/**
 * Before Cuelume: `playSound('click' | 'tab' | 'success' | 'notif')`. Kept for
 * code that still plays sounds by those names; each now plays the cue for its
 * job. New code calls `playCue` (outcomes) or `cueAttributes` / `playPressCue`
 * (presses) from `app/lib/sound`.
 */
export const playSound = (name: string): void => {
    const legacy = LEGACY_SOUNDS[name];
    if (legacy) {
        const { cue, ...options } = legacy;
        playCue(cue, options);
        return;
    }
    playCue(name as Cue);
};

/** Stable callback per `name`, safe in `useCallback` deps. */
export function useSound(name: string) {
    return useCallback(() => playSound(name), [name]);
}

export const initAudio = async (): Promise<void> => {
    startInterfaceSounds();
};
