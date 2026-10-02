'use client';
import { nativeDriver } from 'app/lib/platform/animation';
import { getAnimatedFillProps } from 'app/ui/atoms/animated-icons/fill-props';
import { AnimatedPath, AnimatedCircle, omitUnsafeViewProps, type AnimatedIconProps } from 'app/ui/atoms/animated-icons/shared';

import { useEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from 'app/design/view';


/** lucide-react-native `info.js` v0.563 */
const STEM_D = 'M12 16v-4';
const DOT_D = 'M12 8h.01';

/** Vertical stem length for stroke-dash draw. */
const STEM_LEN = 4;

const SEGMENT_MS = 250;

/**
 * Animated Info — stem stroke-dash draw on `draw`; active duotone on circle.
 */
export function AnimatedInfo({
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
    const stemDashAnim = useAnimatedValue(0);

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
            stemDashAnim.setValue(STEM_LEN);
            Animated.timing(stemDashAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            stemDashAnim.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, stemDashAnim]);

    const stemDashArray =
        isWeb && scenes.draw ? `${STEM_LEN} ${STEM_LEN}` : undefined;

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
                    <AnimatedCircle
                        cx={12}
                        cy={12}
                        r={10}
                        stroke={c}
                        strokeWidth={sw}
                        {...getAnimatedFillProps(fillOn, c, fillOpacityAnim)}
                    />
                    <AnimatedPath
                        d={STEM_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={stemDashArray}
                        strokeDashoffset={isWeb && scenes.draw ? stemDashAnim : 0}
                    />
                    <Path
                        d={DOT_D}
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
