/**
 * A part of the app that is not in the startup script: loaded once, when something first needs
 * it or when the window has drawn (boot.tsx), whichever is first. Components read it with
 * `use()`, which suspends them until it is there and returns it at once after; code that runs
 * only where it is there already (a callback of the editor) reads `loaded()`.
 */
import { use } from 'react';

/** A promise as React's `use` reads it without suspending once it has settled. */
type Tracked<T> = Promise<T> & { status?: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown };

export type LazyModule<T> = {
    /** Starts loading it (once) and says when it is there. */
    load: () => Promise<T>;
    /** In a component: the module, suspending the component until it is loaded. */
    use: () => T;
    /** The module where it must be loaded already; throws otherwise. */
    loaded: () => T;
};

export function lazyModule<T>(load: () => Promise<T>): LazyModule<T> {
    let current: Tracked<T> | null = null;
    const start = (): Tracked<T> => {
        if (current) return current;
        const promise = load() as Tracked<T>;
        // the outcome is written where React's `use` reads it, so a component drawn after the load
        // gets the module at once; `pending` is left to React, which instruments a promise whose
        // status is unset and would never wake a component on one it takes for someone else's
        promise.then(
            (value) => {
                promise.status = 'fulfilled';
                promise.value = value;
            },
            (reason: unknown) => {
                promise.status = 'rejected';
                promise.reason = reason;
                // a load that failed (the file could not be read) is tried again next time
                if (current === promise) current = null;
            },
        );
        current = promise;
        return promise;
    };
    return {
        load: start,
        use: () => use(start() as Promise<T>),
        loaded: () => {
            if (current?.status !== 'fulfilled') throw new Error('A part of the app is used before it has loaded');
            return current.value as T;
        },
    };
}
