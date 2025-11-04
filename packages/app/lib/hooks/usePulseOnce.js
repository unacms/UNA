import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

/**
 * Parameters:
 * - pulseDurationMs: duration of ONE pulse (down-up), default 3000ms
 * - pulses: how many times to pulse (integer >= 1), default 1
 * - minOpacity: the "depth" of the pulse (0..1), default 0.5
 * - autoStart: automatically start animation on mount, default true
 * - respectReducedMotion: respect system "reduce motion" accessibility setting, default true
 * - onEnd: callback after all pulses are finished
 */
export function usePulseOne({
    pulseDurationMs = 3000,
    pulses = 1,
    minOpacity = 0.5,
    autoStart = true,
    respectReducedMotion = true,
    onEnd,
} = {}) {
    const opacity = useRef(new Animated.Value(1)).current;
    const runningRef = useRef(null); // currently running animation, for cleanup on unmount

    // One pulse: 1 -> minOpacity -> 1
    const onePulse = useMemo(() => {
        const down = Math.max(1, Math.floor(pulseDurationMs / 2));
        const up = Math.max(1, pulseDurationMs - down);
        return Animated.sequence([
            Animated.timing(opacity, { toValue: minOpacity, duration: down, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: up, useNativeDriver: true }),
        ]);
    }, [opacity, pulseDurationMs, minOpacity]);

    const buildAnimation = useCallback(() => {
        if (pulses <= 1) return onePulse;
        // Run onePulse N times
        return Animated.loop(onePulse, { iterations: pulses });
    }, [onePulse, pulses]);

    const start = useCallback(async () => {
        // If 0 pulses, simply finish immediately
        if (!pulses || pulses < 1) {
            opacity.setValue(1);
            onEnd && onEnd();
            return;
        }

        try {
            if (respectReducedMotion && AccessibilityInfo.isReduceMotionEnabled) {
                const reduced = await AccessibilityInfo.isReduceMotionEnabled();
                if (reduced) {
                    opacity.setValue(1);
                    onEnd && onEnd();
                    return;
                }
            }
        } catch {
            // Silently ignore AccessibilityInfo errors
        }

        const anim = buildAnimation();
        runningRef.current = anim;
        anim.start(({ finished }) => {
            if (finished && onEnd) onEnd();
        });
    }, [pulses, opacity, respectReducedMotion, buildAnimation, onEnd]);

    useEffect(() => {
        if (autoStart) start();
        return () => {
            // Stop animation when unmounting
            if (runningRef.current?.stop) runningRef.current.stop();
            opacity.stopAnimation();
        };
    }, [autoStart, start, opacity]);

    const reset = useCallback(() => {
        if (runningRef.current?.stop) runningRef.current.stop();
        opacity.setValue(1);
    }, [opacity]);

    return { animatedStyle: { opacity }, start, reset };
}
