/**
 * A network whose API is turned off. API v2 is a preview a site turns on (Studio > API >
 * Settings); with it off, or with the whole API off, the site answers every request 503 with a
 * problem whose `code` says which. That is not a sign-out: Rust keeps the session, remembers
 * what the site said, answers the page's requests with that problem without sending them and
 * keeps asking at the sync's interval (src-tauri/src/availability.rs). It tells the windows each
 * change; this is the page's copy of it, per site, for the shell's status banner
 * (shell/status-banner.tsx), which also asks again when the person says so.
 *
 * In a plain browser tab nothing says (there is no Rust): a request fails with the site's
 * problem, as any other failure.
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useSyncExternalStore } from 'react';

import { inApp } from './native';

/** What the site says is off: API v2 (a preview), or its whole API. */
export type OffCode = 'api_v2_disabled' | 'api_disabled';

/** A site and how its API stands: the code while it is off, null once it answers again. */
export type AvailabilityChange = { site: string; code: OffCode | null };

export const API_AVAILABILITY_EVENT = 'api-availability';

/** A value from Rust or from a problem as a code, or null for anything else. */
export function offCode(value: unknown): OffCode | null {
    return value === 'api_v2_disabled' || value === 'api_disabled' ? value : null;
}

/** Rust's side, or nothing (a browser tab, tests). */
export interface AvailabilityBackend {
    /** How a site stands now, as far as is known. */
    get(site: string): Promise<unknown>;
    /** Ask the site now; rejects when it could not be reached. */
    check(site: string): Promise<unknown>;
    onChange(cb: (change: { site?: unknown; code?: unknown }) => void): Promise<() => void>;
}

export function tauriAvailabilityBackend(): AvailabilityBackend {
    return {
        get: (site) => invoke('api_availability', { siteUrl: site }),
        check: (site) => invoke('api_check', { siteUrl: site }),
        onChange: (cb) => listen<{ site?: unknown; code?: unknown }>(API_AVAILABILITY_EVENT, (e) => cb(e.payload ?? {})),
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
    private started = false;

    constructor(private readonly backend: AvailabilityBackend) {}

    /** The code while `site`'s API is off, null otherwise. */
    codeOf(site: string): OffCode | null {
        return this.off.get(siteKey(site)) ?? null;
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** Hear Rust's changes, and ask once how `site` stands (a page that loads while it is off). */
    watch(site: string): void {
        if (!this.started) {
            this.started = true;
            void this.backend
                .onChange((change) => {
                    if (typeof change.site === 'string') this.set(change.site, offCode(change.code));
                })
                .catch((e: unknown) => console.error('api availability', e));
        }
        const key = siteKey(site);
        if (this.asked.has(key)) return;
        this.asked.add(key);
        this.backend.get(key).then(
            (code) => {
                // only what is off is taken: a change heard meanwhile is newer than this answer
                const off = offCode(code);
                if (off) this.set(key, off);
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

    /** Ask the site now (Try again): how it stands. Rejects when it could not be reached. */
    async check(site: string): Promise<OffCode | null> {
        const code = offCode(await this.backend.check(siteKey(site)));
        this.set(site, code);
        return code;
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
