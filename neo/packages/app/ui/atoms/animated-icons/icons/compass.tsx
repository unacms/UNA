'use client';
import { nativeDriver } from 'app/lib/platform/animation';
import { getAnimatedFillProps } from 'app/ui/atoms/animated-icons/fill-props';
import { AnimatedPath, AnimatedG, omitUnsafeViewProps, type AnimatedIconProps } from 'app/ui/atoms/animated-icons/shared';

import { useEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, Platform } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { View } from 'app/design/view';

/** Closed ring path equivalent to `<circle cx="12" cy="12" r="10" />` (Lucide outer ring). */
const CIRCLE_RING_D =
    'M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20';

/**
 * Needle path from lucide-react-native `compass.js` (v0.563) — stroke-only inner “diamond”.
 * Hover `draw` scene rotates this path (same role as the door stroke in `house.js`).
 */
const NEEDLE_D =
    'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z';

/**
 * Animated Compass — same scene model as `AnimatedHouse`:
 * - `fill`: when active, semitransparent fill on the outer ring (`fillOpacity` 0.18) + stroke → duotone.
 * - `draw` (web): hover rising-edge spins the needle path (stroke) 0→360°; leave resets like house door dash.
 */
export function AnimatedCompass({
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
    const rotateDeg = useAnimatedValue(0);
    const needleRotate = rotateDeg.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
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
            rotateDeg.setValue(0);
            Animated.spring(rotateDeg, {
                toValue: 180,
                friction: 1,
                tension: 5,
                useNativeDriver: false,
            }).start();
            prevHoveredRef.current = true;
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
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
                    {/** Outer ring: same pattern as house body — stroke + animated fill for active duotone. */}
                    <AnimatedPath
                        d={CIRCLE_RING_D}
                        stroke={c}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        {...getAnimatedFillProps(fillOn, c, fillOpacityAnim)}
                    />
                    {/**
                     * Needle (stroke): rotate around (12,12) via T · R · T⁻¹.
                     * Do not use `translateX` / `rotation` on `<G>` — web `prepare()` still forwards them to
                     * the DOM `<g>` (React 19 warns). Use `transform` strings + `style.transform` on AnimatedG.
                     */}
                    <G transform="translate(12, 12)">
                        <AnimatedG
                            style={{
                                transform: [{ rotate: needleRotate }],
                            }}
                        >
                            <G transform="translate(-12, -12)">
                                <AnimatedPath
                                    d={NEEDLE_D}
                                    stroke={c}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </G>
                        </AnimatedG>
                    </G>
                </Svg>
            </Animated.View>
        </View>
    );
}
