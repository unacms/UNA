'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Platform } from 'react-native'
import { appSetting, FeedbackHaptics } from 'app/lib/util'
import { Pressable, View } from 'app/design/view'
import { nativeDriver } from 'app/lib/platform/animation'
import { useSound } from 'app/lib/hooks/use-sound'

const switcherTheme = appSetting('theme', 'switcher');

export type ControlSize = 'small' | 'regular' | 'large';
type LegacyControlSize = 'sm' | 'base' | 'lg' | 'default';

/** Legacy aliases → small | regular | large */
const SWITCH_SIZE_ALIASES: Record<LegacyControlSize, ControlSize> = {
    sm: 'small',
    base: 'regular',
    lg: 'large',
    default: 'regular',
};

/** Thumb travel (px) — matches track/thumb sizes + padding at rem=16 */
const DEFAULT_THUMB_TRAVEL: Record<ControlSize, number> = {
    small: 12,
    regular: 20,
    large: 24,
};

export function resolveControlSize(size?: ControlSize | LegacyControlSize | string | null): string {
    if (!size) return 'regular';
    return SWITCH_SIZE_ALIASES[size as LegacyControlSize] ?? size;
}

function resolveThumbTravel(resolvedSize: string): number {
    const fromTheme = switcherTheme?.thumb_travel?.[resolvedSize];
    if (typeof fromTheme === 'number') return fromTheme;
    return DEFAULT_THUMB_TRAVEL[resolvedSize as ControlSize] ?? DEFAULT_THUMB_TRAVEL.regular;
}

type SwitchProps = {
    value?: boolean;
    disabled?: boolean;
    onValueChange?: (value: boolean) => void;
    size?: ControlSize | LegacyControlSize;
    /** When false, skips haptics + native click sound. */
    feedback?: boolean;
};

export default function Switch({
    value,
    disabled,
    onValueChange,
    size = 'regular',
    feedback = true,
}: SwitchProps) {
    const resolvedSize = resolveControlSize(size);
    const trackSize =
        switcherTheme[`u-controls-switcher-track-${resolvedSize}`]
        ?? switcherTheme['u-controls-switcher-track-regular'];
    const thumbSize =
        switcherTheme[`u-controls-switcher-thumb-${resolvedSize}`]
        ?? switcherTheme['u-controls-switcher-thumb-regular'];
    const travel = resolveThumbTravel(resolvedSize);
    const nextValue = !value;

    const isWeb = Platform.OS === 'web';
    const playClick = useSound('click');

    const translateX = useAnimatedValue(value ? travel : 0);
    const scale = useAnimatedValue(1);
    const mountedRef = useRef(false);
    const travelRef = useRef(travel);

    // Keep travel in sync without animating when only size changes.
    useEffect(() => {
        if (travelRef.current === travel) return;
        travelRef.current = travel;
        translateX.setValue(value ? travel : 0);
    }, [travel, value, translateX]);

    // iOS-like slide + scale bump + light bounce when `value` changes.
    useEffect(() => {
        const toX = value ? travel : 0;

        if (!mountedRef.current) {
            mountedRef.current = true;
            translateX.setValue(toX);
            scale.setValue(1);
            return;
        }

        Animated.parallel([
            Animated.spring(translateX, {
                toValue: toX,
                useNativeDriver: nativeDriver,
                bounciness: 12,
                speed: 14,
            }),
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.18,
                    duration: 90,
                    useNativeDriver: nativeDriver,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: nativeDriver,
                    bounciness: 10,
                    speed: 16,
                }),
            ]),
        ]).start();
    }, [value, travel, translateX, scale]);

    const handlePress = useCallback(() => {
        if (disabled) return;
        if (feedback) {
            // Native: click asset + expo haptic. Web: web-haptics preset (+ synth when sounds on).
            if (!isWeb) {
                playClick();
            }
            FeedbackHaptics('Select');
        }
        onValueChange?.(nextValue);
    }, [disabled, feedback, isWeb, playClick, onValueChange, nextValue]);

    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: !!value, disabled: !!disabled }}
            aria-checked={!!value}
            aria-disabled={!!disabled}
            disabled={disabled}
            onPress={handlePress}
            className={`${switcherTheme['u-controls-switcher-track']} ${trackSize} ${value ? switcherTheme['u-controls-switcher-track-active-col'] : switcherTheme['u-controls-switcher-track-col']} ${disabled ? switcherTheme['u-controls-switcher-track-disabled'] : ''}`}
        >
            {/* Thumb styles on design View — RN Animated.View drops className on web. */}
            <Animated.View style={{ transform: [{ translateX }, { scale }] }}>
                <View
                    className={`${switcherTheme['u-controls-switcher-thumb']} ${thumbSize}`}
                />
            </Animated.View>
        </Pressable>
    );
}
