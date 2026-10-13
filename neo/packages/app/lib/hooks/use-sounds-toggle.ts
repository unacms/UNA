import { useCallback } from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting } from 'app/lib/util';
import { playCue, setInterfaceSoundsEnabled } from 'app/lib/sound';

/**
 * The user's Sounds setting. `available` is false when `layout.sounds` turns
 * sounds off for the app, so there is nothing to switch.
 */
export function useSoundsToggle() {
    const { sounds, setSounds } = useLayoutSettings();
    const available = !!appSetting('layout', 'sounds');

    const toggleSounds = useCallback(() => {
        const next = !sounds;
        setInterfaceSoundsEnabled(next);
        void setSounds(next);
        // Turning off is heard at once as silence. Turning on answers from the
        // same click, which also lets the browser start audio.
        if (next) playCue('toggle');
    }, [sounds, setSounds]);

    return { available, sounds, toggleSounds };
}
