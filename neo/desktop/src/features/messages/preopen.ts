import { useEffect, useState, useSyncExternalStore } from 'react';

import { isWindowActive, subscribeWindowActive } from '../../lib/chrome';
import type { DetailRoute, Route } from '../../lib/router';

/**
 * The conversation the inbox opened by itself (entering Messages in a window wide enough for
 * three panes shows the newest one beside the list), until the person chooses it (its row, or
 * focus going into it) or it closes. While it is preopened, focus stays where it was, and it is
 * read only once it has been in view for a while in a focused window (useShownFor).
 */
let preopened: string | null = null;
const listeners = new Set<() => void>();
/**
 * The history entries it was opened in, while they are in history: Back or Forward to one shows
 * the conversation as preopened again (not read at once, focus left alone), since nobody chose
 * it. The entry shown now is `entry`. An entry leaves when it is chosen or closed.
 */
const entries = new WeakSet<Route>();
let entry: Route | null = null;

export function setPreopened(id: string | null): void {
    if (id === null) entry = null;
    if (preopened === id) return;
    preopened = id;
    for (const l of listeners) l();
}

/** The inbox opened it by itself in this history entry (the one it replaced). */
export function markPreopenedEntry(route: Route): void {
    entries.add(route);
    entry = route;
}

/** Back or Forward landed on `route`: preopened again when the inbox opened it there by itself. */
export function resumePreopened(route: Route): void {
    if (!entries.has(route) || route.detail?.kind !== 'conversation') return;
    setPreopened(route.detail.id);
    entry = route;
}

/** The person chose it (its row, or focus going into it): an open conversation like any other from now on. */
export function choosePreopened(): void {
    if (entry) entries.delete(entry);
    setPreopened(null);
}

/** It was closed in this entry: Back to it opens it as any other. */
export function forgetPreopenedEntry(route: Route): void {
    entries.delete(route);
}

export function preopenedId(): string | null {
    return preopened;
}

/** Whether this detail is the conversation the inbox opened by itself. */
export function isPreopened(detail: DetailRoute | null | undefined): boolean {
    return !!detail && detail.kind === 'conversation' && preopened !== null && detail.id === preopened;
}

export function usePreopened(id: string): boolean {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => preopened === id,
    );
}

/** How long a preopened conversation is in view, in a focused window, before it counts as read. */
export const PREOPEN_READ_MS = 2000;

/**
 * True at once when `waiting` is false; else once the window has been active (lib/chrome.ts:
 * the window's own focus state, and not hidden) for `ms` in one go: going inactive starts the
 * count over. Once true it stays true.
 */
export function useShownFor(ms: number, waiting: boolean): boolean {
    const [shown, setShown] = useState(!waiting);
    // chosen meanwhile: shown from now on
    if (!waiting && !shown) setShown(true);
    const done = shown || !waiting;
    useEffect(() => {
        if (done) return;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const update = () => {
            if (isWindowActive()) {
                timer ??= setTimeout(() => setShown(true), ms);
            } else if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        };
        update();
        const unsubscribe = subscribeWindowActive(update);
        return () => {
            if (timer !== null) clearTimeout(timer);
            unsubscribe();
        };
    }, [done, ms]);
    return done;
}
