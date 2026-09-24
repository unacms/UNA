import { useCallback } from 'react';
import {
    createAudioPlayer,
    preload,
    setAudioModeAsync,
    setIsAudioActiveAsync,
} from 'expo-audio';
import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util'
import type { AudioPlayer, AudioSource } from 'expo-audio';

const sounds = Sounds as Record<string, AudioSource | undefined>;

const cache = new Map<string, AudioPlayer>();
const isSounds = appSetting('layout', 'sounds');
let primed = false;
let priming: Promise<void> | null = null;
const soundProfiles: Record<string, { playbackRate?: number; volume?: number }> = {
    tab: {
        playbackRate: 0.78,
        volume: 0.02,
    },
};

/** Two tab players so a re-tap never waits on `seekTo` of a still-playing click. */
const TAB_POOL_SIZE = 2;
const tabPool: AudioPlayer[] = [];
let tabPoolIndex = 0;

const sfxPlayerOptions = {
    /** Default `false` deactivates AVAudioSession when a click ends — next play waits ~300–500ms. */
    keepAudioSessionActive: true,
    updateInterval: 250,
};

function applyProfile(player: AudioPlayer, name: string) {
    const profile = soundProfiles[name];
    if (!profile) return;
    if (profile.volume != null) player.volume = profile.volume;
    if (profile.playbackRate != null) player.setPlaybackRate(profile.playbackRate);
}

function attachRewind(player: AudioPlayer) {
    player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
            void player.seekTo(0, 0, 0);
        }
    });
}

function createSfxPlayer(source: AudioSource, name: string): AudioPlayer {
    const player = createAudioPlayer(source, sfxPlayerOptions);
    applyProfile(player, name);
    attachRewind(player);
    return player;
}

function ensureTabPool() {
    const source = sounds.tab;
    if (!source) return tabPool;
    while (tabPool.length < TAB_POOL_SIZE) {
        tabPool.push(createSfxPlayer(source, 'tab'));
    }
    return tabPool;
}

/**
 * `preload` buffers the AVPlayerItem, but iOS only spins up the audio render
 * pipeline on the first `play()` (~100–300ms). A muted play per pooled player
 * at init pays that cost before the user's first tab tap.
 */
async function warmPlayer(player: AudioPlayer, name: string) {
    try {
        player.volume = 0;
        player.play();
        await new Promise((resolve) => setTimeout(resolve, 60));
        player.pause();
        await player.seekTo(0, 0, 0);
    } catch {
        // Warm-up is best-effort.
    } finally {
        player.volume = soundProfiles[name]?.volume ?? 1;
    }
}

function getCachedPlayer(name: string): AudioPlayer | null {
    let player = cache.get(name);
    if (player) return player;
    const source = sounds[name];
    if (!source) return null;
    player = createSfxPlayer(source, name);
    cache.set(name, player);
    return player;
}

function playReady(player: AudioPlayer) {
    if (!player.playing && player.currentTime < 0.02) {
        player.play();
        return;
    }
    void player.seekTo(0, 0, 0).then(() => {
        player.play();
    });
}

function playTabSound() {
    const pool = ensureTabPool();
    if (!pool.length) return;
    const player = pool[tabPoolIndex]!;
    tabPoolIndex = (tabPoolIndex + 1) % pool.length;
    playReady(player);
}

function playSoundNow(name: string) {
    try {
        if (!sounds[name]) return;
        if (name === 'tab') {
            playTabSound();
            return;
        }
        const player = getCachedPlayer(name);
        if (player) playReady(player);
    } catch (e) {
        // don't crash the app
    }
}

export const playSound = (name: string): void => {
    if (!isSounds)
        return;
    if (!primed) {
        void initAudio().then(() => playSoundNow(name)).catch(() => playSoundNow(name));
        return;
    }
    playSoundNow(name);
};

/** Stable callback per `name` — callers use it in `useCallback` deps without churning parent `onChange` handlers. */
export function useSound(name: string) {
    return useCallback(() => playSound(name), [name]);
}

export const initAudio = async (): Promise<void> => {
    if (primed) return;
    if (priming) return priming;
    priming = (async () => {
        try {
            await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: false,
                interruptionMode: 'mixWithOthers',
            });
            try {
                await setIsAudioActiveAsync(true);
            } catch {
                // Session activation is best-effort — play() will activate if needed.
            }
            const tabSource = sounds.tab;
            if (tabSource) {
                try {
                    await preload(tabSource);
                } catch {
                    // Preload is optional; createAudioPlayer still works without it.
                }
                await Promise.all(ensureTabPool().map((player) => warmPlayer(player, 'tab')));
            }
        } finally {
            primed = true;
            priming = null;
        }
    })();
    return priming;
};

if (isSounds) {
    initAudio().catch(() => {});
}
