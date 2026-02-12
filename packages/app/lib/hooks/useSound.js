import { createAudioPlayer } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';

const cache = new Map();

export const playSound = (name) => {
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

export const useSound = (name) => () => playSound(name);

export const initAudio = async () => {
    // если нужно: await setAudioModeAsync({ playsInSilentMode: true });
};