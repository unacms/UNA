/**
 * New versions of the app. Rust asks the update address (brand.json `updatesUrl`) and installs
 * (src-tauri/src/updater.rs); the page decides when to ask and shows what it found:
 *
 * - at start (after a pause, so the first screens load first) and once a day while the app runs,
 *   unless Settings > About turns automatic checks off (`checkForUpdates`). What such a check
 *   finds is offered, never installed: the sidebar shows an Update button, and the window says
 *   so once.
 * - when the person asks (Check for Updates… in the app menu, the profile menu, the command
 *   palette, Settings > About): the update dialog opens and says what it finds.
 *
 * Installing takes the person's Install and Restart in the dialog: Rust downloads, checks the
 * signature, installs, and starts the app again.
 */
import { Channel, invoke } from '@tauri-apps/api/core';
import { useSyncExternalStore } from 'react';

import { errorMessage } from './errors';
import { inApp } from './native';

/** A new version (updater.rs UpdateInfo). */
export type UpdateInfo = { version: string; currentVersion: string; notes?: string | null; date?: string | null };

/** What an install says while it goes (updater.rs InstallEvent). */
export type InstallEvent = { event: 'started'; total?: number | null } | { event: 'progress'; downloaded: number } | { event: 'installing' };

export type UpdatePhase =
    | { phase: 'idle' }
    | { phase: 'checking' }
    | { phase: 'current'; checkedAt: number }
    | { phase: 'available'; update: UpdateInfo }
    | { phase: 'downloading'; update: UpdateInfo; downloaded: number; total: number | null }
    | { phase: 'installing'; update: UpdateInfo }
    /** `update`: the install of it failed (it can be tried again); without it, the check did. */
    | { phase: 'failed'; reason: string; update?: UpdateInfo };

export type UpdatesState = UpdatePhase & {
    /** The update dialog is open: the person asked, or chose the sidebar's Update button. */
    dialogOpen: boolean;
};

/** How Rust is reached: replaced in tests. */
export interface UpdatesBackend {
    check(automatic: boolean): Promise<UpdateInfo | null>;
    install(version: string, onEvent: (e: InstallEvent) => void): Promise<void>;
}

export function tauriUpdatesBackend(call: typeof invoke = invoke): UpdatesBackend {
    return {
        check: (automatic) => call<UpdateInfo | null>('check_update', { automatic }),
        install: (version, onEvent) => {
            const channel = new Channel<InstallEvent>();
            channel.onmessage = onEvent;
            return call<void>('install_update', { version, onEvent: channel });
        },
    };
}

/** The first automatic check, after start: the first screens load before it. */
export const FIRST_CHECK_DELAY = 10_000;
/** Then once a day while the app runs (it may run for weeks in the tray). */
export const CHECK_EVERY = 24 * 60 * 60 * 1000;

type Listener = () => void;

export class UpdatesStore {
    private value: UpdatesState = { phase: 'idle', dialogOpen: false };
    private listeners = new Set<Listener>();
    private checking: Promise<void> | null = null;

    constructor(
        private readonly backend: UpdatesBackend,
        private readonly now: () => number = Date.now,
    ) {}

    get current(): UpdatesState {
        return this.value;
    }

    /** The update found and not installed yet, for the sidebar's Update button. */
    get pending(): UpdateInfo | null {
        const v = this.value;
        return v.phase === 'available' || (v.phase === 'failed' && v.update) ? (v.update ?? null) : null;
    }

    private get busy(): boolean {
        return this.value.phase === 'downloading' || this.value.phase === 'installing';
    }

    /**
     * Ask for a new version. `manual`: the person asked, so the dialog opens and says what came
     * back; an automatic check says nothing unless it finds one, and then only offers it.
     */
    check({ manual }: { manual: boolean }): Promise<void> {
        if (manual) this.patch({ dialogOpen: true });
        if (this.busy) return Promise.resolve();
        if (this.checking) return this.checking;
        const before = this.value;
        if (manual) this.replace({ phase: 'checking', dialogOpen: true });
        const run = this.backend.check(!manual).then(
            (update) => {
                if (update) this.replace({ phase: 'available', update, dialogOpen: this.value.dialogOpen });
                else this.replace({ phase: 'current', checkedAt: this.now(), dialogOpen: this.value.dialogOpen });
            },
            (e: unknown) => {
                // a failed automatic check keeps what was known (an offer stays an offer)
                if (manual) this.replace({ phase: 'failed', reason: errorMessage(e), dialogOpen: this.value.dialogOpen });
                else this.replace({ ...before, dialogOpen: this.value.dialogOpen });
                if (!manual) console.warn('update check', e);
            },
        );
        this.checking = run.finally(() => {
            this.checking = null;
        });
        return this.checking;
    }

    /** Download and install the update found, then the app starts again (only from the dialog). */
    async install(): Promise<void> {
        const update = this.pending;
        if (!update || this.busy) return;
        this.replace({ phase: 'downloading', update, downloaded: 0, total: null, dialogOpen: true });
        try {
            await this.backend.install(update.version, (e) => {
                if (e.event === 'started') this.replace({ phase: 'downloading', update, downloaded: 0, total: e.total ?? null, dialogOpen: true });
                else if (e.event === 'progress' && this.value.phase === 'downloading') this.replace({ ...this.value, downloaded: e.downloaded });
                else if (e.event === 'installing') this.replace({ phase: 'installing', update, dialogOpen: true });
            });
        } catch (e) {
            this.replace({ phase: 'failed', reason: errorMessage(e), update, dialogOpen: true });
        }
    }

    openDialog(): void {
        this.patch({ dialogOpen: true });
    }

    /** Close the dialog. Not while installing: the app is about to start again. */
    closeDialog(): void {
        if (this.busy) return;
        // an answer the person has read goes; an offer stays for the sidebar
        const v = this.value;
        if (v.phase === 'current' || v.phase === 'checking' || (v.phase === 'failed' && !v.update)) this.replace({ phase: 'idle', dialogOpen: false });
        else this.patch({ dialogOpen: false });
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private patch(part: Partial<UpdatesState>) {
        this.replace({ ...this.value, ...part } as UpdatesState);
    }

    private replace(next: UpdatesState) {
        this.value = next;
        for (const l of this.listeners) l();
    }
}

/**
 * Check at start and once a day while `enabled()` says automatic checks are on (read at each
 * check, so turning them off in Settings stops the next one). Returns the stop function.
 */
export function scheduleChecks(store: UpdatesStore, enabled: () => boolean, timers: Pick<typeof globalThis, 'setTimeout' | 'clearTimeout'> = globalThis): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const next = (delay: number) => {
        timer = timers.setTimeout(() => {
            if (enabled()) void store.check({ manual: false });
            next(CHECK_EVERY);
        }, delay);
    };
    next(FIRST_CHECK_DELAY);
    return () => {
        if (timer !== null) timers.clearTimeout(timer);
    };
}

/** Whether this app gets updates: in the desktop app, not in a plain browser tab. */
export const updatesAvailable = inApp;

/** The app's updates. */
export const appUpdates = new UpdatesStore(
    inApp
        ? tauriUpdatesBackend()
        : {
              check: () => Promise.resolve(null),
              install: () => Promise.resolve(),
          },
);

export function useUpdates(store: UpdatesStore = appUpdates): UpdatesState {
    return useSyncExternalStore(
        (listener) => store.subscribe(listener),
        () => store.current,
    );
}
