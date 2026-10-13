import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { appSetting } from 'app/lib/util';
import { persistedGet, persistedSet } from 'app/lib/util/storage';
import type { Cue, CueOptions, SoundGroup, SoundSet } from './cues';
import { cueGroup, SOUND_SETS } from './cues';

/**
 * UNA's interface sounds settings (Studio > Settings > Global > Sounds,
 * `BxDolSounds`) arrive with every page as `data.sounds`. NEO keeps the last
 * copy in memory and in storage, so a sound never waits for them: the stored
 * copy applies from start, a new one from the page that brings it.
 */

/** Each person's own level; UNA's settings say where everyone starts. */
export type SoundLevel = 'full' | 'quiet' | 'off';

export const SOUND_LEVELS: SoundLevel[] = ['off', 'quiet', 'full'];

export type SoundConfig = {
    /** Where sounds play: `site`, `studio`, `neo_web`, `ios`, `android`. */
    platforms: string[];
    /** Where people start until they pick their own level. */
    level: SoundLevel;
    set: SoundSet;
    /** 0–1. */
    volume: number;
    /** Kinds of action with a set of their own, or no sound. */
    groups: Partial<Record<SoundGroup, SoundSet | 'off'>>;
};

/** What the player needs: everything decided, nothing left to look up when a sound plays. */
export type SoundState = {
    on: boolean;
    volume: number;
    set: SoundSet;
    groups: Partial<Record<SoundGroup, SoundSet | 'off'>>;
};

/** This app in UNA's list of platforms. */
export const SOUND_PLATFORM = Platform.OS === 'web' ? 'neo_web' : Platform.OS;

/** Quiet plays at this share of the volume. */
export const QUIET_VOLUME = 0.4;

const STORAGE_KEY = 'sounds-config';

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
    platforms: ['site', 'studio', 'neo_web', 'ios', 'android'],
    level: 'full',
    set: 'default',
    volume: 1,
    groups: {},
};

const isSet = (value: unknown): value is SoundSet => SOUND_SETS.includes(value as SoundSet);
const isLevel = (value: unknown): value is SoundLevel => SOUND_LEVELS.includes(value as SoundLevel);

/** The settings from a page, or null when it has none (an older UNA): the app keeps what it has. */
export function parseSoundConfig(raw: unknown): SoundConfig | null {
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Record<string, unknown>;
    if (!Array.isArray(value.platforms)) return null;
    const groups: SoundConfig['groups'] = {};
    if (value.groups && typeof value.groups === 'object') {
        for (const [group, set] of Object.entries(value.groups as Record<string, unknown>)) {
            if (set === 'off' || isSet(set)) groups[group as SoundGroup] = set;
        }
    }
    const volume = Number(value.volume);
    return {
        platforms: value.platforms.filter((platform): platform is string => typeof platform === 'string'),
        level: isLevel(value.level) ? value.level : DEFAULT_SOUND_CONFIG.level,
        set: isSet(value.set) ? value.set : DEFAULT_SOUND_CONFIG.set,
        volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_SOUND_CONFIG.volume,
        groups,
    };
}

let current = DEFAULT_SOUND_CONFIG;
let currentJson = JSON.stringify(current);
const listeners = new Set<() => void>();

/** Settings a page brought this run: they win over the stored copy, even when it is read later. */
let fromPage = false;
/** What storage holds, once written or read this run. */
let storedJson: string | null = null;

function setConfig(next: SoundConfig) {
    const json = JSON.stringify(next);
    if (json === currentJson) return;
    current = next;
    currentJson = json;
    listeners.forEach((listener) => listener());
}

/** Apply the settings a page brought (`data.sounds`); unchanged settings cost a string compare. */
export function applySoundConfig(raw: unknown): void {
    const next = parseSoundConfig(raw);
    if (!next) return;
    fromPage = true;
    const json = JSON.stringify(next);
    if (json !== storedJson) {
        storedJson = json;
        void persistedSet(STORAGE_KEY, next);
    }
    setConfig(next);
}

export function getSoundConfig(): SoundConfig {
    return current;
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useSoundConfig(): SoundConfig {
    return useSyncExternalStore(subscribe, getSoundConfig, () => DEFAULT_SOUND_CONFIG);
}

/** Whether UNA plays sounds in this app at all, and the build hasn't turned them off (`layout.sounds`). */
export function soundsAvailable(config: SoundConfig): boolean {
    return !!appSetting('layout', 'sounds') && config.platforms.includes(SOUND_PLATFORM);
}

/** The person's level: their own pick, or where UNA starts everyone. */
export function soundLevel(config: SoundConfig, own: SoundLevel | undefined): SoundLevel {
    if (!soundsAvailable(config)) return 'off';
    return own ?? config.level;
}

export function soundState(config: SoundConfig, own: SoundLevel | undefined): SoundState {
    const level = soundLevel(config, own);
    return {
        on: level !== 'off',
        volume: config.volume * (level === 'quiet' ? QUIET_VOLUME : 1),
        set: config.set,
        groups: config.groups,
    };
}

/** The set a cue plays in: its kind of action's own, the main one, or 'off'. */
export function cueSet(state: SoundState, cue: Cue, options?: CueOptions): SoundSet | 'off' {
    const group = cueGroup(cue, options);
    return (group && state.groups[group]) || state.set;
}

// The stored copy, read once at start; settings a page brought first win.
void persistedGet(STORAGE_KEY).then((stored) => {
    const parsed = parseSoundConfig(stored);
    if (!parsed || fromPage) return;
    storedJson = JSON.stringify(parsed);
    setConfig(parsed);
});
