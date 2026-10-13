'use client';

import { useEffect } from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import { setInterfaceSoundsState, soundState, startInterfaceSounds, useSoundConfig } from 'app/lib/sound';

/**
 * Starts interface sounds once for the whole app (web: Cuelume's `bind()`;
 * native: the audio session and the players of the sets in use) and keeps them
 * in step with UNA's settings (`data.sounds`, applied in `Layouts`),
 * `layout.sounds` and the user's own level.
 */
export default function InterfaceSounds() {
    const { ownSoundLevel, hydrated } = useLayoutSettings();
    const config = useSoundConfig();
    // Silent until the user's own level is read: it may be off.
    const state = soundState(config, hydrated ? ownSoundLevel : 'off');

    useEffect(() => {
        setInterfaceSoundsState(state);
    }, [state]);

    // Started once sounds can be heard.
    const start = state.on;
    useEffect(() => {
        if (start) startInterfaceSounds();
    }, [start]);

    return null;
}
