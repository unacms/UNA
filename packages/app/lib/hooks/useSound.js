import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';

const playerCache = new Map();



export const playSound = (soundName) => {
    try {
        const soundSource = Sounds[soundName];
        if (!soundSource) {
            console.warn(`Звук ${soundName} не найден`);
            return;
        }

        // Получаем или создаем плеер для этого звука
        let player = playerCache.get(soundName);
        
        if (!player) {
            player = useAudioPlayer(soundSource);
            playerCache.set(soundName, player);
        }

        // Воспроизводим с начала
        player.seekTo(0);
        player.play();
    } catch (error) {
        console.warn(`Ошибка воспроизведения ${soundName}:`, error);
    }
};


export function useSound(soundName) {
    const soundSource = Sounds[soundName];
    const player = useAudioPlayer(soundSource);
    
    return () => {
        try {
            player.seekTo(0);
            player.play();
        } catch (error) {
            console.warn(`Ошибка воспроизведения ${soundName}:`, error);
        }
    };
}


export const initAudio = async () => {
    // expo-audio работает out-of-the-box на всех платформах
    console.log('Audio готов к работе');
};