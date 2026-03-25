'use client';

import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { View } from 'app/design/view';

const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);

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

/** lucide-react-native `menu.js` v0.563 — three horizontal strokes. */
const L1 = 'M4 5h16';
const L2 = 'M4 12h16';
const L3 = 'M4 19h16';

/** Morph to X — [lucide-animated menu](https://lucide-animated.com/r/menu.json): top/bottom rotate + translate, middle fades. */
/** Hover wave: vertical nudge per line, staggered start so motion steps down the stack. */
const WIGGLE_Y = 0.55;
const WIGGLE_STEP_MS = 155;
const WIGGLE_STAGGER_MS = 52;

function lineBobAnim(v) {
    return Animated.sequence([
        Animated.timing(v, {
            toValue: -WIGGLE_Y,
            duration: WIGGLE_STEP_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }),
        Animated.timing(v, {
            toValue: WIGGLE_Y,
            duration: WIGGLE_STEP_MS,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
        }),
        Animated.timing(v, {
            toValue: 0,
            duration: WIGGLE_STEP_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }),
    ]);
}

/**
 * Animated Menu — hamburger: `draw` + hover = staggered vertical wave; `active` = morph to X (spring), back when closed.
 */
export function AnimatedMenu({
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

    const isWeb = Platform.OS === 'web';
    const prevHoveredRef = useRef(false);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const morph = useRef(new Animated.Value(0)).current;
    const wiggleY1 = useRef(new Animated.Value(0)).current;
    const wiggleY2 = useRef(new Animated.Value(0)).current;
    const wiggleY3 = useRef(new Animated.Value(0)).current;

    const topTy = morph.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 7],
    });
    const topRot = morph.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });
    const midOp = morph.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });
    const botTy = morph.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -7],
    });
    const botRot = morph.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-45deg'],
    });

    let sceneScale = 1;
    if (pressed) sceneScale = 0.9;
    else if (hovered && !isActive) sceneScale = 1.15;
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
        Animated.spring(morph, {
            toValue: isActive ? 1 : 0,
            useNativeDriver: false,
            friction: 4,
            tension: 100,
        }).start();
    }, [isActive, morph]);

    useEffect(() => {
        if (!isWeb || !scenes.draw) return;
        if (isActive) {
            wiggleY1.stopAnimation();
            wiggleY2.stopAnimation();
            wiggleY3.stopAnimation();
            wiggleY1.setValue(0);
            wiggleY2.setValue(0);
            wiggleY3.setValue(0);
            prevHoveredRef.current = false;
            return;
        }
        if (hovered && !prevHoveredRef.current) {
            prevHoveredRef.current = true;
            wiggleY1.setValue(0);
            wiggleY2.setValue(0);
            wiggleY3.setValue(0);
            Animated.parallel([
                Animated.sequence([
                    Animated.delay(0),
                    lineBobAnim(wiggleY1),
                ]),
                Animated.sequence([
                    Animated.delay(WIGGLE_STAGGER_MS),
                    lineBobAnim(wiggleY2),
                ]),
                Animated.sequence([
                    Animated.delay(WIGGLE_STAGGER_MS * 2),
                    lineBobAnim(wiggleY3),
                ]),
            ]).start();
            return;
        }
        if (!hovered) {
            prevHoveredRef.current = false;
            wiggleY1.stopAnimation();
            wiggleY2.stopAnimation();
            wiggleY3.stopAnimation();
            wiggleY1.setValue(0);
            wiggleY2.setValue(0);
            wiggleY3.setValue(0);
        }
    }, [hovered, isWeb, scenes.draw, isActive, wiggleY1, wiggleY2, wiggleY3]);

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
                    <G transform="translate(12, 5)">
                        <AnimatedG
                            style={{
                                transform: [{ translateY: wiggleY1 }],
                            }}
                        >
                            <AnimatedG
                                style={{
                                    transform: [
                                        { translateY: topTy },
                                        { rotate: topRot },
                                    ],
                                }}
                            >
                                <G transform="translate(-12, -5)">
                                    <Path
                                        d={L1}
                                        stroke={c}
                                        strokeWidth={sw}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </G>
                            </AnimatedG>
                        </AnimatedG>
                    </G>
                    <G transform="translate(12, 12)">
                        <AnimatedG
                            style={{
                                transform: [{ translateY: wiggleY2 }],
                            }}
                        >
                            <G transform="translate(-12, -12)">
                                <AnimatedPath
                                    d={L2}
                                    stroke={c}
                                    strokeWidth={sw}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                    opacity={midOp}
                                />
                            </G>
                        </AnimatedG>
                    </G>
                    <G transform="translate(12, 19)">
                        <AnimatedG
                            style={{
                                transform: [{ translateY: wiggleY3 }],
                            }}
                        >
                            <AnimatedG
                                style={{
                                    transform: [
                                        { translateY: botTy },
                                        { rotate: botRot },
                                    ],
                                }}
                            >
                                <G transform="translate(-12, -19)">
                                    <Path
                                        d={L3}
                                        stroke={c}
                                        strokeWidth={sw}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </G>
                            </AnimatedG>
                        </AnimatedG>
                    </G>
                </Svg>
            </Animated.View>
        </View>
    );
}
