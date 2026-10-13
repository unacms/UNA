'use client';

import { useEffect } from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import { setInterfaceSoundsEnabled, startInterfaceSounds } from 'app/lib/sound';

/**
 * Starts interface sounds once for the whole app (web: Cuelume's `bind()`;
 * native: the audio session and the tab bar's players) and keeps them in step
 * with `layout.sounds` and the user's Sounds setting.
 */
export default function InterfaceSounds() {
    const { sounds, hydrated } = useLayoutSettings();

    useEffect(() => {
        setInterfaceSoundsEnabled(sounds);
    }, [sounds]);

    // Started once the user's setting is known, and only when it is on.
    const start = hydrated && sounds;
    useEffect(() => {
        if (start) startInterfaceSounds();
    }, [start]);

    return null;
}
