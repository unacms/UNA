'use client';
import { nativeDriver } from 'app/lib/platform/animation';
import { getAnimatedFillProps } from 'app/ui/atoms/animated-icons/fill-props';
import { AnimatedPath, AnimatedG, omitUnsafeViewProps, type AnimatedIconProps } from 'app/ui/atoms/animated-icons/shared';

import { useEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from 'app/design/view';


/** lucide-react-native `store.js` v0.563 */
const DOOR_D = 'M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5';
const AWNING_D =
    'M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244';
const BASE_D = 'M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05';

const SEGMENT_MS = 250;

/**
 * Animated Store — awning `translateY` wiggle on web `draw`; active fill on awning + base.
 */
export function AnimatedStore({
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
    const awningTy = useAnimatedValue(0);

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
            awningTy.setValue(0);
            Animated.sequence([
                Animated.timing(awningTy, {
                    toValue: -1.1,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(awningTy, {
                    toValue: 0,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(awningTy, {
                    toValue: -1.1,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(awningTy, {
                    toValue: 0,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
            ]).start();
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            awningTy.stopAnimation();
            awningTy.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, awningTy]);

    return (
        <View className={className} style={{ width: dim, height: dim }} {...viewProps}>
            <Animated.View
                style={{
                    width: dim,
                    height: dim,
                    transform: [{ scale: scaleAnim }],
                }}
            >
                <Svg
                    width={dim}
                    height={dim}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={svgColorStyle}
                >
                    <Path
                        d={DOOR_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                    <AnimatedG
                        style={{
                            transform: [{ translateY: awningTy }],
                        }}
                    >
                        <AnimatedPath
                            d={AWNING_D}
                            stroke={c}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            {...getAnimatedFillProps(fillOn, c, fillOpacityAnim)}
                        />
                    </AnimatedG>
                    <AnimatedPath
                        d={BASE_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        {...getAnimatedFillProps(fillOn, c, fillOpacityAnim)}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
