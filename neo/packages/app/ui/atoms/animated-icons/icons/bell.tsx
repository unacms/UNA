'use client';
import { nativeDriver } from 'app/lib/platform/animation';
import { getAnimatedFillProps } from 'app/ui/atoms/animated-icons/fill-props';
import { AnimatedPath, omitUnsafeViewProps, type AnimatedIconProps } from 'app/ui/atoms/animated-icons/shared';

import { useEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from 'app/design/view';

const BELL_BODY_D = 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9';
const BELL_CLAPPER_D = 'M10.3 21a1.94 1.94 0 0 0 3.4 0';
const SHAKE_SEGMENT_MS = 110;


/**
 * Animated Bell
 * - `fill`: active state fills the bell body for a light duotone treatment.
 * - `draw` (web): on hover, the bell swings left-right-left and settles.
 */
export function AnimatedBell({
    size = 24,
    width,
    height,
    color,
    strokeWidth: strokeWidthProp,
    className,
    active = false,
    pressed = false,
    hovered = false,
    scenes = {},
    selected,
    ...rest
}: AnimatedIconProps) {
    const dim = Number(width ?? height ?? size ?? 24) || 24;
    const c = color ?? 'currentColor';
    const svgColorStyle = (color != null && color !== '' ? { color } : { color: 'inherit' }) as any;
    const sw = strokeWidthProp ?? 2;
    const viewProps = omitUnsafeViewProps(rest);

    const isActive = active ?? !!selected;
    const fillOn = !!scenes.fill && isActive;

    const isWeb = Platform.OS === 'web';
    const prevHoveredRef = useRef(false);

    const scaleAnim = useAnimatedValue(1);
    const fillOpacityAnim = useAnimatedValue(0);
    const shakeAnim = useAnimatedValue(0);
    const shakeRotate = shakeAnim.interpolate({
        inputRange: [-10, 0, 10],
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    let sceneScale = 1;
    if (pressed) sceneScale = 0.9;
    else if (hovered) sceneScale = 1.15;
    else if (isActive) sceneScale = 1.1;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: sceneScale,
            useNativeDriver: nativeDriver,
            friction: 4,
            tension: 100,
        }).start();
    }, [sceneScale, scaleAnim]);

    useEffect(() => {
        Animated.timing(fillOpacityAnim, {
            toValue: fillOn ? 0.2 : 0,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [fillOn, fillOpacityAnim]);

    useEffect(() => {
        if (!isWeb || !scenes.draw) return;
        if (hovered && !prevHoveredRef.current) {
            prevHoveredRef.current = true;
            shakeAnim.stopAnimation();
            shakeAnim.setValue(0);
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: SHAKE_SEGMENT_MS,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: nativeDriver,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: SHAKE_SEGMENT_MS,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: nativeDriver,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: SHAKE_SEGMENT_MS,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: nativeDriver,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: SHAKE_SEGMENT_MS,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: nativeDriver,
                }),
            ]).start();
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            shakeAnim.stopAnimation();
            shakeAnim.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, shakeAnim]);

    return (
        <View className={className} style={{ width: dim, height: dim }} {...viewProps}>
            <Animated.View
                style={{
                    width: dim,
                    height: dim,
                    transform: [{ scale: scaleAnim }, { rotate: shakeRotate }],
                }}
            >
                <Svg
                    width={dim}
                    height={dim}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={svgColorStyle}
                >
                    <AnimatedPath
                        d={BELL_BODY_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        {...getAnimatedFillProps(fillOn, c, fillOpacityAnim)}
                    />
                    <Path
                        d={BELL_CLAPPER_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
