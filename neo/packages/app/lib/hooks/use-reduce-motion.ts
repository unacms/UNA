import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The system "reduce motion" setting (iOS Reduce Motion, Android "Remove animations"), kept current.
 * Starts as false and switches once the lookup answers; a failed lookup counts as off.
 * Web code reads `prefers-reduced-motion` in CSS instead.
 */
export function useReduceMotion(): boolean {
    const [reduce, setReduce] = useState(false);
    useEffect(() => {
        let alive = true;
        AccessibilityInfo.isReduceMotionEnabled?.()
            .then((value) => { if (alive) setReduce(!!value); })
            .catch(() => {});
        const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value: boolean) => setReduce(!!value));
        return () => {
            alive = false;
            subscription?.remove();
        };
    }, []);
    return reduce;
}
