import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The system "reduce motion" setting (iOS Reduce Motion, Android "Remove animations"), kept current.
 * Starts as false and switches once the lookup answers; a failed lookup counts as off.
 * Web code reads `prefers-reduced-motion` in CSS instead.
 */
export function useReduceMotion(): boolean {
    return useReduceMotionSetting() ?? false;
}

/**
 * The same setting, but null until the lookup answers: for motion that must not start before
 * it is known (one that plays once on mount). No lookup on this platform counts as off.
 */
export function useReduceMotionSetting(): boolean | null {
    // No lookup on this platform: known (off) from the start.
    const [reduce, setReduce] = useState<boolean | null>(() => (typeof AccessibilityInfo.isReduceMotionEnabled === 'function' ? null : false));
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isReduceMotionEnabled?.()
            .then((value) => { if (alive) setReduce(!!value); })
            .catch(() => { if (alive) setReduce(false); });
        const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value: boolean) => setReduce(!!value));
        return () => {
            alive = false;
            subscription?.remove();
        };
    }, []);
    return reduce;
}
