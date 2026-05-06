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

/** lucide-react-native `mail.js` v0.563 */
const FLAP_D =
    'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7';

const SEGMENT_MS = 250;

/**
 * Animated Mail — flap `translateY` on `draw`; active fill on envelope rect.
 */
export function AnimatedMail({
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
    const flapTy = useRef(new Animated.Value(0)).current;

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
            flapTy.setValue(0);
            Animated.sequence([
                Animated.timing(flapTy, {
                    toValue: -2.2,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(flapTy, {
                    toValue: 0,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(flapTy, {
                    toValue: -1.4,
                    duration: SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(flapTy, {
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
            flapTy.stopAnimation();
            flapTy.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, flapTy]);

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
                    <AnimatedRect
                        x="2"
                        y="4"
                        width="20"
                        height="16"
                        rx="2"
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={c}
                        fillOpacity={fillOpacityAnim}
                    />
                    <AnimatedG
                        style={{
                            transform: [{ translateY: flapTy }],
                        }}
                    >
                        <Path
                            d={FLAP_D}
                            stroke={c}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </AnimatedG>
                </Svg>
            </Animated.View>
        </View>
    );
}
