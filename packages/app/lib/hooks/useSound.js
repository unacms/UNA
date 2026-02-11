import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';
import { Asset } from 'expo-asset';

const playerCache = new Map();

const uriCache = new Map();

const getSoundUri = async (soundModule) => {
    if (typeof soundModule === 'string') {
        return soundModule;
    }
    if (typeof soundModule === 'number') {
        if (uriCache.has(soundModule)) {
            return uriCache.get(soundModule);
        }
        try {
            const asset = Asset.fromModule(soundModule);
            await asset.downloadAsync();
            const uri = asset.localUri || asset.uri;
            uriCache.set(soundModule, uri);
            return uri;
        } catch (error) {
            console.error("Error loading asset:", error);
            return null;
        }
    }
    return null;
};

export const playSound = async (soundName) => {
    try {
        const soundSource = Sounds[soundName];
        if (!soundSource) {
            console.warn(`Звук ${soundName} не найден`);
            return;
        }

        const soundUri = await getSoundUri(soundSource);
        if (!soundUri) {
            console.warn(`Не удалось получить URI для звука ${soundName}`);
            return;
        }

        let player = playerCache.get(soundName);
        
        if (!player) {
            player = useAudioPlayer(soundUri);
            playerCache.set(soundName, player);
        }

        player.seekTo(0);
        player.play();
    } catch (error) {
        console.warn(`Ошибка воспроизведения ${soundName}:`, error);
    }
};


export function useSound(soundName) {
    const soundSource = Sounds[soundName];
    const [soundUri, setSoundUri] = useState(null);
    
    useEffect(() => {
        let mounted = true;
        
        const loadUri = async () => {
            const uri = await getSoundUri(soundSource);
            if (mounted && uri) {
                setSoundUri(uri);
            } else if (mounted) {
                console.warn("URI is null or undefined for", soundName);
            }
        };
        
        loadUri();
        
        return () => {
            mounted = false;
        };
    }, [soundName, soundSource]);
    
    const player = useAudioPlayer(soundUri);
    return () => {
        try {
            if (!soundUri) {
                console.warn(`URI для звука ${soundName} еще не загружен`);
                return;
            }
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