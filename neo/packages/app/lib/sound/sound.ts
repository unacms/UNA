import {
    createAudioPlayer,
    preload,
    setAudioModeAsync,
    setIsAudioActiveAsync,
} from 'expo-audio';
import type { AudioPlayer, AudioSource } from 'expo-audio';
import { Sounds } from 'app/customization/sounds';
import { appSetting } from 'app/lib/util';
import type { Cue, CueOptions, PressCue } from './cues';
import { cueKeys, pressCueParts } from './cues';

/**
 * Native: React Native has no Web Audio, so each cue plays a file rendered
 * from Cuelume (`scripts/render-sounds.mjs`), looked up in `Sounds` by
 * `cueKeys`. Press cues play from the control's handler (`playPressCue`);
 * there is no `bind()` here.
 */

const sounds = Sounds as Record<string, AudioSource | undefined>;

/** `layout.sounds` off silences the app; `InterfaceSounds` adds the user's own setting. */
let enabled = !!appSetting('layout', 'sounds');
let primed = false;
let priming: Promise<void> | null = null;

/** Two players per sound, so a quick repeat never waits on `seekTo` of one still playing. */
const POOL_SIZE = 2;
const pools = new Map<string, { players: AudioPlayer[]; next: number }>();

/** The tab bar's cue: warmed at start so the first tab tap is not late. */
const WARM_KEYS = cueKeys('navigate', { emphasis: 'subtle' });

const playerOptions = {
    /** Default `false` deactivates AVAudioSession when a sound ends: the next play waits ~300–500ms. */
    keepAudioSessionActive: true,
    updateInterval: 250,
};

function resolveKey(cue: Cue, options?: CueOptions): string | null {
    return cueKeys(cue, options).find((key) => !!sounds[key]) ?? null;
}

function createPlayer(source: AudioSource): AudioPlayer {
    const player = createAudioPlayer(source, playerOptions);
    player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
            void player.seekTo(0, 0, 0);
        }
    });
    return player;
}

function poolFor(key: string) {
    let pool = pools.get(key);
    if (pool) return pool;
    const source = sounds[key];
    if (!source) return null;
    pool = { players: [], next: 0 };
    while (pool.players.length < POOL_SIZE) pool.players.push(createPlayer(source));
    pools.set(key, pool);
    return pool;
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

function playKey(key: string) {
    try {
        const pool = poolFor(key);
        if (!pool) return;
        const player = pool.players[pool.next]!;
        pool.next = (pool.next + 1) % pool.players.length;
        playReady(player);
    } catch {
        // A sound must never crash the app.
    }
}

/**
 * `preload` buffers the AVPlayerItem, but iOS only spins up the audio render
 * pipeline on the first `play()` (~100–300ms). A muted play per pooled player
 * at start pays that cost before the first tab tap.
 */
async function warmPlayer(player: AudioPlayer) {
    try {
        player.volume = 0;
        player.play();
        await new Promise((resolve) => setTimeout(resolve, 60));
        player.pause();
        await player.seekTo(0, 0, 0);
    } catch {
        // Warm-up is best-effort.
    } finally {
        player.volume = 1;
    }
}

export function startInterfaceSounds(): () => void {
    if (primed || priming) return () => {};
    priming = (async () => {
        try {
            // Interface sounds follow the silent switch (ambient) and mix with other audio.
            await setAudioModeAsync({
                playsInSilentMode: false,
                shouldPlayInBackground: false,
                interruptionMode: 'mixWithOthers',
            });
            try {
                await setIsAudioActiveAsync(true);
            } catch {
                // Session activation is best-effort; play() activates it if needed.
            }
            const warmKey = WARM_KEYS.find((key) => !!sounds[key]);
            const pool = warmKey ? poolFor(warmKey) : null;
            if (warmKey && pool) {
                try {
                    await preload(sounds[warmKey]!);
                } catch {
                    // Preload is optional; the players work without it.
                }
                await Promise.all(pool.players.map(warmPlayer));
            }
        } finally {
            primed = true;
            priming = null;
        }
    })();
    return () => {};
}

export function setInterfaceSoundsEnabled(value: boolean): void {
    enabled = value;
    if (value) return;
    // Off is heard at once: stop whatever is still ringing.
    for (const pool of pools.values()) {
        for (const player of pool.players) {
            if (player.playing) player.pause();
        }
    }
}

export function playCue(cue: Cue, options?: CueOptions): void {
    if (!enabled) return;
    const key = resolveKey(cue, options);
    if (!key) return;
    if (!primed) {
        startInterfaceSounds();
        const waiting = priming as Promise<void> | null;
        if (waiting) {
            void waiting.then(() => enabled && playKey(key));
            return;
        }
    }
    playKey(key);
}

/** Web only: native plays press cues with `playPressCue` from the control's handler. */
export function cueAttributes(_press: PressCue | null | undefined): Record<string, string> {
    return {};
}

export function playPressCue(press: PressCue | null | undefined): void {
    const parts = pressCueParts(press);
    if (!parts) return;
    const { cue, ...options } = parts;
    playCue(cue, options);
}
