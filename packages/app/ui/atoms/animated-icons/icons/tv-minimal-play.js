'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { View } from 'app/design/view';

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

/** Paths from lucide-react-native `tv-minimal-play.js` (v0.563). */
const PLAY_D =
    'M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z';
const STAND_D = 'M7 21h10';

/** ~1000ms total like `AnimatedHouse` door draw; larger nudge for visibility. */
const WIGGLE_SEGMENT_MS = 500;
const PLAY_NUDGE_X = 2;

/**
 * Animated TvMinimalPlay — matches `tv-minimal-play` [Lucide](https://lucide.dev/icons/tv-minimal-play).
 * - `fill`: active duotone on screen (`fillOpacity` 0.18) like House/Compass.
 * - `draw` (web): hover — play triangle nudges forward/back twice (no separate screen scale; whole icon uses `scaleAnim` like House/Compass).
 */
export function AnimatedTvMinimalPlay({
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
    const playTx = useRef(new Animated.Value(0)).current;

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
            playTx.setValue(0);
            const wiggle = Animated.sequence([
                Animated.timing(playTx, {
                    toValue: PLAY_NUDGE_X,
                    duration: WIGGLE_SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(playTx, {
                    toValue: 0,
                    duration: WIGGLE_SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(playTx, {
                    toValue: PLAY_NUDGE_X,
                    duration: WIGGLE_SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
                Animated.timing(playTx, {
                    toValue: 0,
                    duration: WIGGLE_SEGMENT_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: false,
                }),
            ]);
            wiggle.start();
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            playTx.stopAnimation();
            playTx.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, playTx]);

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
                    {/**
                     * Screen first, then play, then stand — so fill + triangle stay visible.
                     */}
                    <AnimatedRect
                        x="2"
                        y="3"
                        width="20"
                        height="14"
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
                            transform: [{ translateX: playTx }],
                        }}
                    >
                        <Path
                            d={PLAY_D}
                            stroke={c}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </AnimatedG>
                    <Path
                        d={STAND_D}
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
