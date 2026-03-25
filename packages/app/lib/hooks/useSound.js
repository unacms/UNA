import { useCallback } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util'

const cache = new Map();
const isSounds = appSetting('layout', 'sounds');

export const playSound = (name) => {
    if (!isSounds)
        return;
    try {
        const source = Sounds[name];
        if (!source) return;

        let player = cache.get(name);
        if (!player) {
            player = createAudioPlayer(source);
            cache.set(name, player);
        }

        player.seekTo(0); // важно: expo-audio не сбрасывает позицию само :contentReference[oaicite:2]{index=2}
        player.play();
    } catch (e) {
        // не валим апп
    }
};

/** Stable callback per `name` — callers use it in `useCallback` deps without churning parent `onChange` handlers. */
export function useSound(name) {
    return useCallback(() => playSound(name), [name]);
}

export const initAudio = async () => {
    // если нужно: await setAudioModeAsync({ playsInSilentMode: true });
};