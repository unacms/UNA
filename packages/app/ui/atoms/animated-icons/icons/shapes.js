'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { View } from 'app/design/view';

const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);

const RectStripDomInvalid = forwardRef(function RectStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Rect ref={ref} {...rest} />;
});
RectStripDomInvalid.displayName = 'RectStripDomInvalid';

const AnimatedRect = Animated.createAnimatedComponent(RectStripDomInvalid);

const CircleStripDomInvalid = forwardRef(function CircleStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Circle ref={ref} {...rest} />;
});
CircleStripDomInvalid.displayName = 'CircleStripDomInvalid';

const AnimatedCircle = Animated.createAnimatedComponent(CircleStripDomInvalid);

const GStripDomInvalid = forwardRef(function GStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <G ref={ref} {...rest} />;
});
GStripDomInvalid.displayName = 'GStripDomInvalid';

const AnimatedG = Animated.createAnimatedComponent(GStripDomInvalid);

function omitUnsafeViewProps(rest) {
    if (!rest || typeof rest !== 'object') return {};
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest;
    return safe;
}

/** lucide-react-native `shapes.js` v0.563 */
const TRIANGLE_D =
    'M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z';

/** Triangle visual center for rotation (no originX/Y on web). */
const TRI_PIVOT_X = 12;
const TRI_PIVOT_Y = 7;

const SEGMENT_MS = 250;

/**
 * Animated Shapes — triangle rotation wobble on `draw`; active fill on triangle, rect, circle.
 */
export function AnimatedShapes({
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
    const rotateDeg = useRef(new Animated.Value(0)).current;
    const triRotate = rotateDeg.interpolate({
        inputRange: [-12, 0, 12],
        outputRange: ['-12deg', '0deg', '12deg'],
    });

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
            rotateDeg.setValue(0);
            Animated.sequence([
                Animated.timing(rotateDeg, {
                    toValue: 12,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(rotateDeg, {
                    toValue: -10,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(rotateDeg, {
                    toValue: 8,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(rotateDeg, {
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
            rotateDeg.stopAnimation();
            rotateDeg.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, rotateDeg]);

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
                    <G transform={`translate(${TRI_PIVOT_X}, ${TRI_PIVOT_Y})`}>
                        <AnimatedG
                            style={{
                                transform: [{ rotate: triRotate }],
                            }}
                        >
                            <G transform={`translate(${-TRI_PIVOT_X}, ${-TRI_PIVOT_Y})`}>
                                <AnimatedPath
                                    d={TRIANGLE_D}
                                    stroke={c}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill={c}
                                    fillOpacity={fillOpacityAnim}
                                />
                            </G>
                        </AnimatedG>
                    </G>
                    <AnimatedRect
                        x="3"
                        y="14"
                        width="7"
                        height="7"
                        rx="1"
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                    <AnimatedCircle
                        cx="17.5"
                        cy="17.5"
                        r="3.5"
                        stroke={c}
                        strokeWidth={sw}
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
