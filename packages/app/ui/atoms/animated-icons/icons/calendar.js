'use client';
import { nativeDriver } from 'app/lib/animation';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { View } from 'app/design/view';

const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const RectStripDomInvalid = forwardRef(function RectStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Rect ref={ref} {...rest} />;
});
RectStripDomInvalid.displayName = 'RectStripDomInvalid';

const AnimatedRect = Animated.createAnimatedComponent(RectStripDomInvalid);

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

/** lucide-react-native `calendar.js` v0.563 */
const BIND_L_D = 'M8 2v4';
const BIND_R_D = 'M16 2v4';
const DIVIDER_D = 'M3 10h18';

const SEGMENT_MS = 250;

/**
 * Animated Calendar — binder strokes bounce on `draw`; active fill on main rect.
 */
export function AnimatedCalendar({
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
    const binderY = useRef(new Animated.Value(0)).current;

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
            binderY.setValue(0);
            Animated.sequence([
                Animated.timing(binderY, {
                    toValue: -1.4,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(binderY, {
                    toValue: 0,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(binderY, {
                    toValue: -1.4,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(binderY, {
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
            binderY.stopAnimation();
            binderY.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, binderY]);

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
                    <AnimatedG
                        style={{
                            transform: [{ translateY: binderY }],
                        }}
                    >
                        <Path
                            d={BIND_L_D}
                            stroke={c}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                        <Path
                            d={BIND_R_D}
                            stroke={c}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </AnimatedG>
                    <AnimatedRect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                    <Path
                        d={DIVIDER_D}
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
