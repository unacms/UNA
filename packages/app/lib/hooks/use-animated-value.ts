import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * A stable `Animated.Value`, created once per component — same API as React
 * Native's own `useAnimatedValue` (0.71+), which react-native-web doesn't ship.
 *
 *   const opacity = useAnimatedValue(0);
 *
 * Don't use `useRef(new Animated.Value(x)).current`: it builds a throwaway
 * value on every render and reads a ref during render, so React Compiler
 * skips the whole component.
 */
export function useAnimatedValue(initialValue: number, config?: Animated.AnimatedConfig): Animated.Value {
    // Lazy useState = created once, never set. (RN's version uses a lazily filled
    // ref, which React Compiler rejects as a ref read during render.)
    const [value] = useState(() => new Animated.Value(initialValue, config));
    return value;
}
