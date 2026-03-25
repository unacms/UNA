'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from 'app/design/view';

const DOOR_PATH_LENGTH = 22;

/**
 * RN Animated injects `collapsable={false}` into animated components; that must not reach web `<path>`
 * (React 19 warns). Strip it in the leaf so it runs after Animated merges props.
 */
const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);

/** Props that must not reach DOM nodes (RN / Animated may inject these; web rejects some on `<path>`). */
function omitUnsafeViewProps(rest) {
    if (!rest || typeof rest !== 'object') return {};
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest;
    return safe;
}

/**
 * Animated House — scenes: fill, draw (lucide-style door path), morph/smoke/custom* reserved for future.
 * Paths use RN Animated (not Legend MotionSvg) so web `<path>` never receives `onLayout`.
 *
 * Stroke/fill default to `currentColor` so Tailwind `text-*` on `className` matches static Lucide icons.
 * Pass an explicit `color` prop only when a caller needs a fixed tint (e.g. tab bar `color` from navigation).
 * Scene-specific tints can still be set inside this file when needed.
 */
export function AnimatedHouse({
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
    /** Explicit `color` (e.g. tab bar) wins; otherwise inherit `text-*` from the outer `className` View. */
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
    const doorDashAnim = useRef(new Animated.Value(0)).current;

    let sceneScale = 1;
    if (pressed) sceneScale = 0.92;
    else if (hovered) sceneScale = 1.06;
    else if (isActive) sceneScale = 1.02;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: sceneScale,
            useNativeDriver: true,
            friction: 6,
            tension: 380,
        }).start();
    }, [sceneScale, scaleAnim]);

    useEffect(() => {
        Animated.timing(fillOpacityAnim, {
            toValue: fillOn ? 0.18 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    }, [fillOn, fillOpacityAnim]);

    useEffect(() => {
        if (!isWeb || !scenes.draw) return;
        if (hovered && !prevHoveredRef.current) {
            doorDashAnim.setValue(DOOR_PATH_LENGTH);
            Animated.timing(doorDashAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
            prevHoveredRef.current = true;
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            doorDashAnim.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, doorDashAnim]);

    const doorDashArray =
        isWeb && scenes.draw ? `${DOOR_PATH_LENGTH} ${DOOR_PATH_LENGTH}` : undefined;

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
                        d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                    <AnimatedPath
                        d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={doorDashArray}
                        strokeDashoffset={isWeb && scenes.draw ? doorDashAnim : 0}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
