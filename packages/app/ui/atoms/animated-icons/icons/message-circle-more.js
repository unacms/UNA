'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from 'app/design/view';

const BUBBLE_D = 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z';
const DOT_1_D = 'M8 12h.01';
const DOT_2_D = 'M12 12h.01';
const DOT_3_D = 'M16 12h.01';
const DOT_IDLE_OPACITY = 1;
const DOT_HIDDEN_OPACITY = 0.2;

const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);

function omitUnsafeViewProps(rest) {
    if (!rest || typeof rest !== 'object') return {};
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest;
    return safe;
}

/**
 * Animated MessageCircleMore
 * - `fill`: active state fills the chat bubble for a light duotone treatment.
 * - `draw` (web): on hover, the three dots fade back in one-by-one.
 */
export function AnimatedMessageCircleMore({
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
}) {
    const dim = width ?? height ?? size ?? 24;
    const c = color ?? 'currentColor';
    const svgColorStyle = color != null && color !== '' ? { color } : { color: 'inherit' };
    const sw = strokeWidthProp ?? 2;
    const viewProps = omitUnsafeViewProps(rest);

    const isActive = active ?? !!selected;
    const fillOn = !!scenes.fill && isActive;

    const isWeb = Platform.OS === 'web';
    const prevHoveredRef = useRef(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fillOpacityAnim = useRef(new Animated.Value(0)).current;
    const dot1Opacity = useRef(new Animated.Value(DOT_IDLE_OPACITY)).current;
    const dot2Opacity = useRef(new Animated.Value(DOT_IDLE_OPACITY)).current;
    const dot3Opacity = useRef(new Animated.Value(DOT_IDLE_OPACITY)).current;

    let sceneScale = 1;
    if (pressed) sceneScale = 0.9;
    else if (hovered) sceneScale = 1.15;
    else if (isActive) sceneScale = 1.1;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: sceneScale,
            useNativeDriver: true,
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
        const dotAnimations = [dot1Opacity, dot2Opacity, dot3Opacity];

        if (hovered && !prevHoveredRef.current) {
            prevHoveredRef.current = true;
            dotAnimations.forEach((dot) => {
                dot.stopAnimation();
                dot.setValue(DOT_HIDDEN_OPACITY);
            });

            Animated.stagger(
                110,
                dotAnimations.map((dot) =>
                    Animated.timing(dot, {
                        toValue: DOT_IDLE_OPACITY,
                        duration: 220,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: false,
                    })
                )
            ).start();
            return;
        }

        if (!hovered) {
            prevHoveredRef.current = false;
            dotAnimations.forEach((dot) => {
                dot.stopAnimation();
                dot.setValue(DOT_IDLE_OPACITY);
            });
        }
    }, [hovered, isWeb, scenes.draw, dot1Opacity, dot2Opacity, dot3Opacity]);

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
                    <AnimatedPath
                        d={BUBBLE_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                    <AnimatedPath
                        d={DOT_1_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={dot1Opacity}
                    />
                    <AnimatedPath
                        d={DOT_2_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={dot2Opacity}
                    />
                    <AnimatedPath
                        d={DOT_3_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={dot3Opacity}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
