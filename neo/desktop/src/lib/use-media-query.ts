import { useSyncExternalStore } from 'react';

/** Whether a media query matches; `fallback` where matchMedia is missing (tests). */
export function useMediaQuery(query: string, fallback = true): boolean {
    return useSyncExternalStore(
        (listener) => {
            if (typeof window.matchMedia !== 'function') return () => {};
            const list = window.matchMedia(query);
            list.addEventListener('change', listener);
            return () => list.removeEventListener('change', listener);
        },
        () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback),
    );
}
