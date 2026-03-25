'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { View } from 'app/design/view';

const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);

const CircleStripDomInvalid = forwardRef(function CircleStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Circle ref={ref} {...rest} />;
});
CircleStripDomInvalid.displayName = 'CircleStripDomInvalid';

const AnimatedCircle = Animated.createAnimatedComponent(CircleStripDomInvalid);

function omitUnsafeViewProps(rest) {
    if (!rest || typeof rest !== 'object') return {};
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest;
    return safe;
}

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
    const stemDashAnim = useRef(new Animated.Value(0)).current;

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
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={c}
                        strokeWidth={sw}
                        fill={c}
                        fillOpacity={fillOpacityAnim}
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
