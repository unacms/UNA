'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Web-specific implementation using CSS animations instead of React Native Animated.
 * 
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
    const [opacity, setOpacity] = useState(1);
    const animationRef = useRef(null);
    const timeoutsRef = useRef([]);

    const clearTimeouts = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    }, []);

    const start = useCallback(async () => {
        // If 0 pulses, simply finish immediately
        if (!pulses || pulses < 1) {
            setOpacity(1);
            onEnd && onEnd();
            return;
        }

        // Check for reduced motion preference
        if (respectReducedMotion && typeof window !== 'undefined') {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                setOpacity(1);
                onEnd && onEnd();
                return;
            }
        }

        clearTimeouts();

        const down = Math.max(1, Math.floor(pulseDurationMs / 2));
        const up = Math.max(1, pulseDurationMs - down);
        
        let currentPulse = 0;

        const runPulse = () => {
            // Go down
            setOpacity(minOpacity);
            
            // Go up after down duration
            const upTimeout = setTimeout(() => {
                setOpacity(1);
                
                currentPulse++;
                
                // Check if we should pulse again
                if (currentPulse < pulses) {
                    const nextTimeout = setTimeout(runPulse, up);
                    timeoutsRef.current.push(nextTimeout);
                } else {
                    // Animation complete
                    const endTimeout = setTimeout(() => {
                        onEnd && onEnd();
                    }, up);
                    timeoutsRef.current.push(endTimeout);
                }
            }, down);
            
            timeoutsRef.current.push(upTimeout);
        };

        runPulse();
    }, [pulses, pulseDurationMs, minOpacity, respectReducedMotion, onEnd, clearTimeouts]);

    useEffect(() => {
        if (autoStart) start();
        return () => {
            clearTimeouts();
        };
    }, [autoStart, start, clearTimeouts]);

    const reset = useCallback(() => {
        clearTimeouts();
        setOpacity(1);
    }, [clearTimeouts]);

    // CSS transition-based style
    const animatedStyle = useMemo(() => ({
        opacity,
        transition: `opacity ${Math.max(1, Math.floor(pulseDurationMs / 2))}ms ease-in-out`,
    }), [opacity, pulseDurationMs]);

    return { animatedStyle, start, reset };
}

