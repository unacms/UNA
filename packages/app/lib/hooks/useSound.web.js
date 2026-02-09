import { Sounds } from 'app/customization/sounds';

const cache = new Map();

export const playSound = (name) => {
    try {
        let audio = cache.get(name);
        if (!audio) {
            audio = new Audio(Sounds[name]);
            audio.volume = 0.5;
            cache.set(name, audio);
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {}
};

export const useSound = (name) => () => playSound(name);
export const initAudio = () => {};