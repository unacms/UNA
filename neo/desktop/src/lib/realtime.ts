/**
 * Live events from the network's sockets server (Soketi, Pusher's protocol). Rust holds the one
 * WebSocket (src-tauri/src/realtime.rs); a window names the public channels it wants and hears
 * their events. The events carry ids, never content, so a handler reloads what changed through
 * the API (as the viewer may see it): the feed checks for new posts, an open post its comments.
 *
 * Without a sockets server, signed out, or in a plain browser tab, nothing comes, and the polls
 * (the feed's first page, GET /sync) are all there is: every use here only makes them sooner.
 *
 *     const status = useRealtimeStatus();
 *     useRealtime(status.channels.activities, (e) => ...);   // the feed: added, edited, deleted
 *     useRealtime(item.live?.comments, (e) => ...);          // a post's comments
 */
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { inApp } from './native';

/** One event: its channel, its name (`added`, `comment_added` ...) and what it says (ids). */
export type RealtimeEvent = { channel: string; event: string; data: unknown };

/** Whether a connection is open, and the site's channels by what they carry (GET /realtime). */
export type RealtimeStatus = { connected: boolean; channels: { activities?: string; connections?: string; [name: string]: string | undefined } };

const OFF: RealtimeStatus = { connected: false, channels: {} };

/** Rust's side, or nothing (a browser tab, tests). */
export interface RealtimeBackend {
    /** Listen to these channels; how things stand, or null when nothing says. */
    watch(channels: string[], viewer: string | null): Promise<RealtimeStatus | null>;
    onEvent(cb: (e: RealtimeEvent) => void): Promise<() => void>;
    onStatus(cb: (s: RealtimeStatus) => void): Promise<() => void>;
}

export const REALTIME_EVENT = 'realtime';
export const STATUS_EVENT = 'realtime-status';

export function tauriRealtimeBackend(): RealtimeBackend {
    return {
        watch: (channels, viewer) => invoke<RealtimeStatus>('realtime_watch', { channels, viewer }),
        onEvent: (cb) => listen<RealtimeEvent>(REALTIME_EVENT, (e) => cb(e.payload)),
        onStatus: (cb) => listen<RealtimeStatus>(STATUS_EVENT, (e) => cb(e.payload)),
    };
}

const NO_BACKEND: RealtimeBackend = {
    watch: () => Promise.resolve(null),
    onEvent: () => Promise.resolve(() => {}),
    onStatus: () => Promise.resolve(() => {}),
};

type Handler = (e: RealtimeEvent) => void;

/** This window's channels and their handlers. */
export class Realtime {
    private handlers = new Map<string, Set<Handler>>();
    private listeners = new Set<() => void>();
    private value: RealtimeStatus = OFF;
    private viewer: string | null = null;
    private started = false;
    private pending = false;

    constructor(private readonly backend: RealtimeBackend) {}

    get status(): RealtimeStatus {
        return this.value;
    }

    /** Hear `channel`'s events; the returned function stops. */
    subscribe(channel: string, handler: Handler): () => void {
        this.start();
        let set = this.handlers.get(channel);
        if (!set) {
            set = new Set();
            this.handlers.set(channel, set);
            this.schedule();
        }
        set.add(handler);
        return () => {
            const now = this.handlers.get(channel);
            if (!now) return;
            now.delete(handler);
            if (!now.size) {
                this.handlers.delete(channel);
                this.schedule();
            }
        };
    }

    /** The acting profile this window shows: another one's channels differ (connections). */
    setViewer(viewer: string | null): void {
        if (viewer === this.viewer) return;
        this.viewer = viewer;
        this.start();
        this.schedule();
    }

    onStatus(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** What Rust is told: once per turn, however many hooks came and went in it. */
    private schedule() {
        if (this.pending) return;
        this.pending = true;
        queueMicrotask(() => {
            this.pending = false;
            // by code unit, as a bare sort() orders: the same set of channels is always the same list
            this.backend.watch(
                [...this.handlers.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
                this.viewer,
            ).then(
                (s) => {
                    if (s) this.setStatus(s);
                },
                (e: unknown) => console.error('realtime', e),
            );
        });
    }

    private start() {
        if (this.started) return;
        this.started = true;
        void this.backend.onEvent((e) => this.receive(e));
        void this.backend.onStatus((s) => this.setStatus(s));
    }

    /** An event from Rust (tests send their own): to each handler of its channel. */
    receive(e: RealtimeEvent): void {
        for (const h of [...(this.handlers.get(e.channel) ?? [])]) {
            try {
                h(e);
            } catch (err) {
                console.error('realtime handler', err);
            }
        }
    }

    /** How things stand, as Rust says (tests set their own). */
    setStatus(s: RealtimeStatus): void {
        const a = this.value;
        if (a.connected === s.connected && JSON.stringify(a.channels) === JSON.stringify(s.channels)) return;
        this.value = s;
        for (const l of this.listeners) l();
    }
}

export const appRealtime = new Realtime(inApp ? tauriRealtimeBackend() : NO_BACKEND);

/** Hear a channel while mounted; none for null. The handler may change between renders. */
export function useRealtime(channel: string | null | undefined, handler: Handler, realtime: Realtime = appRealtime): void {
    const latest = useRef(handler);
    useEffect(() => {
        latest.current = handler;
    });
    useEffect(() => {
        if (!channel) return;
        return realtime.subscribe(channel, (e) => latest.current(e));
    }, [channel, realtime]);
}

export function useRealtimeStatus(realtime: Realtime = appRealtime): RealtimeStatus {
    return useSyncExternalStore(
        (l) => realtime.onStatus(l),
        () => realtime.status,
    );
}

/**
 * `fn` at most once per `ms`: at once, then once more at the end of the wait if it was asked for
 * meanwhile. A busy site's feed sends many events; each one need not be a request.
 */
export function coalesce(fn: () => void, ms: number, timers: Pick<typeof globalThis, 'setTimeout'> = globalThis): () => void {
    let waiting = false;
    let again = false;
    const run = () => {
        fn();
        waiting = true;
        timers.setTimeout(() => {
            waiting = false;
            if (again) {
                again = false;
                run();
            }
        }, ms);
    };
    return () => {
        if (waiting) again = true;
        else run();
    };
}

/** The id an event names (`{ id }`), as a string; null when it names none. */
export function eventId(e: RealtimeEvent): string | null {
    const id = (e.data as { id?: unknown } | null)?.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}
