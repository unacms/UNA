import { useSyncExternalStore } from 'react';

/**
 * Whether the computer has a network (navigator.onLine, and its online and offline events).
 * React Query pauses its requests meanwhile and sends them when it is back.
 */
export function useOnline(): boolean {
    return useSyncExternalStore(
        (listener) => {
            window.addEventListener('online', listener);
            window.addEventListener('offline', listener);
            return () => {
                window.removeEventListener('online', listener);
                window.removeEventListener('offline', listener);
            };
        },
        () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
    );
}
