import { useEffect, useState } from 'react';

/**
 * `on`, but only once it has stayed on for `delayMs`; off at once. For loading skeletons: a
 * response that comes back sooner shows its rows (or its empty state) without a skeleton first.
 */
export function useDelayedFlag(on: boolean, delayMs: number): boolean {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (!on) return undefined;
        const timer = setTimeout(() => setShown(true), delayMs);
        return () => {
            clearTimeout(timer);
            setShown(false);
        };
    }, [on, delayMs]);
    return on && shown;
}
