import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util'

const cache = new Map();
const isSounds = appSetting('layout', 'sounds');

export const playSound = (name) => {
    if (!isSounds)
        return;
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