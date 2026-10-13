import { useCallback } from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import type { SoundLevel } from 'app/lib/sound';
import { playCue, setInterfaceSoundsState, SOUND_LEVELS, soundLevel, soundsAvailable, soundState, useSoundConfig } from 'app/lib/sound';

/** Levels as menus list them, with their icons and translation keys. */
export const SOUND_LEVEL_ITEMS: { id: SoundLevel; icon: string; titleKey: string; labelKey: string }[] = [
    { id: 'full', icon: 'Volume2', titleKey: 'sounds_full', labelKey: 'sounds_level_full' },
    { id: 'quiet', icon: 'Volume1', titleKey: 'sounds_quiet', labelKey: 'sounds_level_quiet' },
    { id: 'off', icon: 'VolumeX', titleKey: 'sounds_off', labelKey: 'sounds_level_off' },
];

/**
 * The user's level of interface sounds: full, quiet or off. UNA's settings say
 * where everyone starts and whether this app plays sounds at all; `available`
 * is false when they don't, or when `layout.sounds` turns sounds off for the
 * build, and then there is nothing to pick.
 */
export function useSoundsLevel() {
    const { ownSoundLevel, setSoundLevel } = useLayoutSettings();
    const config = useSoundConfig();
    const available = soundsAvailable(config);
    const level = soundLevel(config, ownSoundLevel);

    const setLevel = useCallback(
        (next: SoundLevel) => {
            const louder = SOUND_LEVELS.indexOf(next) > SOUND_LEVELS.indexOf(level);
            // Applied now rather than when the setting is stored, so the answer plays at the new level.
            setInterfaceSoundsState(soundState(config, next));
            void setSoundLevel(next);
            // Off is heard at once as silence. A level that can be heard answers from the same press, which also
            // lets the browser start audio.
            if (next !== 'off') playCue('toggle', { direction: louder ? 'forward' : 'back' });
        },
        [config, level, setSoundLevel]
    );

    return { available, level, setLevel };
}
