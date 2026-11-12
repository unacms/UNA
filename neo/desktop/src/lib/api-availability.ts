/**
 * A network whose API is turned off. API v2 is a preview a site turns on (Studio > API >
 * Settings); with it off, or with the whole API off, the site answers every request 503 with a
 * problem whose `code` says which. That is not a sign-out: Rust keeps the session, remembers
 * what the site said, answers the page's requests with that problem without sending them and
 * keeps asking at the sync's interval (src-tauri/src/availability.rs). It tells the windows each
 * change; this is the page's copy of it, per site, for the shell's status banner
 * (shell/status-banner.tsx), which also asks again when the person says so.
 *
 * Rust numbers its changes (`seq`), and says with each answer how many there were when it was
 * read. An event and an answer come to the page by different ways, in no order one can rely
 * on, and two events of two threads may too: what is older than the last thing taken for a site
 * is left, so an answer read while the API was off cannot undo the event that says it is back
 * (after which Rust has nothing more to say).
 *
 * Every window loads again what it shows when Rust says a site's API answers again
 * (useReloadWhenApiBack): the main window and windows of their own, whichever screen is up,
 * the full-screen "could not load" one included. A window of its own only hears the event: it
 * has no command to ask how a site stands or to check it (capabilities/secondary.json).
 *
 * In a plain browser tab nothing says (there is no Rust): a request fails with the site's
 * problem, as any other failure.
 */
import { useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { inApp } from './native';

/** What the site says is off: API v2 (a preview), or its whole API. */
export type OffCode = 'api_v2_disabled' | 'api_disabled';

/** A site and how its API stands: the code while it is off, null once it answers again. */
export type AvailabilityChange = { site: string; code: OffCode | null };

/** A change as it is heard: `seq` is Rust's number of it. */
type Heard = { site?: unknown; code?: unknown; seq?: unknown };

export const API_AVAILABILITY_EVENT = 'api-availability';

/** A value from Rust or from a problem as a code, or null for anything else. */
export function offCode(value: unknown): OffCode | null {
    return value === 'api_v2_disabled' || value === 'api_disabled' ? value : null;
}

/** Rust's side, or nothing (a browser tab, tests). */
export interface AvailabilityBackend {
    /** How a site stands now, as far as is known: `{ code, seq }`. */
    get(site: string): Promise<unknown>;
    /** Ask the site now: `{ code, seq }` after that; rejects when it could not be reached. */
    check(site: string): Promise<unknown>;
    /** Each change: `{ site, code, seq }`. */
    onChange(cb: (change: Heard) => void): Promise<() => void>;
}

const hearRust: AvailabilityBackend['onChange'] = (cb) => listen<Heard>(API_AVAILABILITY_EVENT, (e) => cb(e.payload ?? {}));

/** The number of Rust's change, or null when none is said (a bare code). */
function seqOf(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Rust's answer: how the site stands and after how many changes that was read. */
function answerOf(value: unknown): { code: OffCode | null; seq: number | null } {
    if (typeof value !== 'object' || value === null) return { code: offCode(value), seq: null };
    const answer = value as { code?: unknown; seq?: unknown };
    return { code: offCode(answer.code), seq: seqOf(answer.seq) };
}

export function tauriAvailabilityBackend(): AvailabilityBackend {
    return {
        get: (site) => invoke('api_availability', { siteUrl: site }),
        check: (site) => invoke('api_check', { siteUrl: site }),
        onChange: hearRust,
    };
}

const NO_BACKEND: AvailabilityBackend = {
    get: () => Promise.resolve(null),
    check: () => Promise.resolve(null),
    onChange: () => Promise.resolve(() => {}),
};

function siteKey(site: string): string {
    return site.replace(/\/+$/, '');
}

/** The sites that said their API is off, as this window knows them. */
export class ApiAvailability {
    private off = new Map<string, OffCode>();
    private listeners = new Set<() => void>();
    private asked = new Set<string>();
    /** Per site, the number of Rust's change last taken: anything older is left. */
    private at = new Map<string, number>();
    /** Per site, how many changes were heard (for an answer that says no number). */
    private heard = new Map<string, number>();
    private hearing: Promise<unknown> | null = null;

    constructor(private readonly backend: AvailabilityBackend) {}

    /** The code while `site`'s API is off, null otherwise. */
    codeOf(site: string): OffCode | null {
        return this.off.get(siteKey(site)) ?? null;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** Whether what is numbered `seq` is no older than what was taken for the site (and note it). */
    private current(key: string, seq: number): boolean {
        if (seq < (this.at.get(key) ?? 0)) return false;
        this.at.set(key, seq);
        return true;
    }

    private hear(change: Heard): void {
        if (typeof change.site !== 'string') return;
        const key = siteKey(change.site);
        this.heard.set(key, (this.heard.get(key) ?? 0) + 1);
        const seq = seqOf(change.seq);
        if (seq !== null && !this.current(key, seq)) return;
        this.set(key, offCode(change.code));
    }

    /**
     * Take Rust's answer to a question asked when `heardBefore` changes of the site had been
     * heard, unless it is older than what is known: read before a change that came first.
     */
    private answered(key: string, value: unknown, heardBefore: number): void {
        const { code, seq } = answerOf(value);
        if (seq !== null ? !this.current(key, seq) : (this.heard.get(key) ?? 0) !== heardBefore) return;
        this.set(key, code);
    }

    /** Hear Rust's changes, and ask once how `site` stands (a page that loads while it is off). */
    watch(site: string): void {
        this.hearing ??= this.backend.onChange((change) => this.hear(change)).catch((e: unknown) => console.error('api availability', e));
        const key = siteKey(site);
        if (this.asked.has(key)) return;
        this.asked.add(key);
        const heardBefore = this.heard.get(key) ?? 0;
        // asked once the changes are heard: one made in between would be told to nobody
        void this.hearing
            .then(() => this.backend.get(key))
            .then(
                (answer) => {
                    // an answer without a number cannot say it is the newer: only "off" is taken of it
                    const { code, seq } = answerOf(answer);
                    if (seq !== null || code) this.answered(key, answer, heardBefore);
                },
                (e: unknown) => console.error('api availability', e),
            );
    }

    /** How a site stands, as Rust says (tests set their own). */
    set(site: string, code: OffCode | null): void {
        const key = siteKey(site);
        if (this.codeOf(key) === code) return;
        if (code) this.off.set(key, code);
        else this.off.delete(key);
        for (const l of [...this.listeners]) l();
    }

    /**
     * Ask the site now (Try again): how it stands after that, as Rust holds it. A site held as
     * off whose answer says nothing either way (a maintenance page) is off still. A change heard
     * while it was asked that is newer than the answer stands. Rejects when it could not be
     * reached.
     */
    async check(site: string): Promise<OffCode | null> {
        const key = siteKey(site);
        const heardBefore = this.heard.get(key) ?? 0;
        this.answered(key, await this.backend.check(key), heardBefore);
        return this.codeOf(key);
    }
}

export const appAvailability = new ApiAvailability(inApp ? tauriAvailabilityBackend() : NO_BACKEND);

/** The code while the API of `siteUrl` is turned off, null while it answers. */
export function useApiOff(siteUrl: string, availability: ApiAvailability = appAvailability): OffCode | null {
    useEffect(() => availability.watch(siteUrl), [availability, siteUrl]);
    return useSyncExternalStore(
        (l) => availability.subscribe(l),
        () => availability.codeOf(siteUrl),
    );
}

const appChanges: AvailabilityBackend['onChange'] = inApp ? hearRust : NO_BACKEND.onChange;

/**
 * Load again what this window shows once the API of `siteUrl` answers again: Rust says so to
 * every window (`{ site, code: null }`, only when it was off before). Wherever the window's
 * session is mounted, so a screen without the status banner (the "could not load" one of the
 * main window, a window of its own) comes back by itself too.
 */
export function useReloadWhenApiBack(siteUrl: string, changes: AvailabilityBackend['onChange'] = appChanges): void {
    const queryClient = useQueryClient();
    useEffect(() => {
        const key = siteKey(siteUrl);
        let gone = false;
        let stop: (() => void) | null = null;
        changes((change) => {
            if (typeof change.site !== 'string' || siteKey(change.site) !== key || change.code !== null) return;
            void queryClient.invalidateQueries();
        }).then(
            (unlisten) => {
                if (gone) unlisten();
                else stop = unlisten;
            },
            (e: unknown) => console.error('api availability', e),
        );
        return () => {
            gone = true;
            stop?.();
        };
    }, [siteUrl, changes, queryClient]);
}

/**
 * Try again of a screen that shows a request of `siteUrl` that failed: while the site is held
 * as off, Rust answers the page's requests itself, so the site is asked first (`check`) and
 * then the request is made again. `checking` while the site is being asked.
 */
export function useRetryWithCheck(siteUrl: string, again: () => void, availability: ApiAvailability = appAvailability): { retry: () => void; checking: boolean } {
    const off = useApiOff(siteUrl, availability);
    const [checking, setChecking] = useState(false);
    const retry = useCallback(() => {
        if (checking) return;
        if (!off) {
            again();
            return;
        }
        setChecking(true);
        const done = () => {
            setChecking(false);
            again();
        };
        // a site that cannot be reached: the request says so itself
        availability.check(siteUrl).then(done, done);
    }, [checking, off, again, availability, siteUrl]);
    return { retry, checking };
}
