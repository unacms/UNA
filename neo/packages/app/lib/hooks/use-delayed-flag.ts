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

/**
 * Whether `shown` was on during the current or the last loading cycle (`loading` on, then
 * off). A new cycle starts with nothing seen, so a later quick load does not inherit an earlier
 * slow one's skeletons.
 */
export function useShownWhileLoading(loading: boolean, shown: boolean): boolean {
    const [cycle, setCycle] = useState({ loading, shown });
    const startsNow = loading && !cycle.loading;
    const next = { loading, shown: startsNow ? shown : cycle.shown || shown };
    if (next.loading !== cycle.loading || next.shown !== cycle.shown) setCycle(next);
    return next.shown;
}
