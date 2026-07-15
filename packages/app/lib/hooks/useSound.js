import { useCallback } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util'

const cache = new Map();
const isSounds = appSetting('layout', 'sounds');
let audioModeReady = false;
const soundProfiles = {
    tab: {
        playbackRate: 0.9,
        volume: 0.22,
    },
};

export const playSound = (name) => {
    if (!isSounds)
        return;
    if (!audioModeReady) {
        audioModeReady = true;
        initAudio().catch(() => {});
    }
    try {
        const source = Sounds[name];
        if (!source) return;

        let player = cache.get(name);
        if (!player) {
            player = createAudioPlayer(source);
            const profile = soundProfiles[name];
            if (profile) {
                player.volume = profile.volume;
                player.setPlaybackRate(profile.playbackRate);
            }
            cache.set(name, player);
        }

        player.seekTo(0); // important: expo-audio does not reset position on its own
        player.play();
    } catch (e) {
        // don't crash the app
    }
};

/** Stable callback per `name` — callers use it in `useCallback` deps without churning parent `onChange` handlers. */
export function useSound(name) {
    return useCallback(() => playSound(name), [name]);
}

export const initAudio = async () => {
    await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
    });
};