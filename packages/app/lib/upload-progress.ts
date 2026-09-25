import { useCallback, useSyncExternalStore } from 'react';

/** Upload progress per upload id, in whole percent. Module-level so it survives form remounts. */
const progressById = new Map<string, number>();
const listenersById = new Map<string, Set<() => void>>();

function notify(id: string) {
    listenersById.get(id)?.forEach((listener) => listener());
}

/** Record `fraction` (0..1) sent for `id`; subscribers re-render only when the whole percent changes. */
export function setUploadProgress(id: string | null | undefined, fraction: number) {
    if (!id) return;
    const percent = Math.max(0, Math.min(100, Math.floor(fraction * 100)));
    if (progressById.get(id) === percent) return;
    progressById.set(id, percent);
    notify(id);
}

export function clearUploadProgress(id: string | null | undefined) {
    if (!id || !progressById.has(id)) return;
    progressById.delete(id);
    notify(id);
}

/** Percent sent (0..100) for an upload, `undefined` before the first progress event. */
export function useUploadProgress(id: string | null | undefined): number | undefined {
    const subscribe = useCallback((listener: () => void) => {
        if (!id) return () => {};
        let listeners = listenersById.get(id);
        if (!listeners) {
            listeners = new Set();
            listenersById.set(id, listeners);
        }
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
            if (!listeners.size) listenersById.delete(id);
        };
    }, [id]);
    const getSnapshot = () => (id ? progressById.get(id) : undefined);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
