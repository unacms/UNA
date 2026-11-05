import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { useReduceMotion } from 'app/lib/hooks/use-reduce-motion';
import { nativeDriver } from 'app/lib/platform/animation';
import type { AnimatedIconPart, IconMotion, IconNode } from './types';
import { fillsNode, iconStrokeWidth, motionDelays, type AnimatedLucideIconProps } from './animated-lucide-icon.types';

// Typed loosely: GProps has no `style`, though react-native-svg applies its transform.
const AnimatedG: ComponentType<any> = Animated.createAnimatedComponent(G);

const SHAPES: Record<IconNode[0], ComponentType<any>> = {
    path: Path,
    circle: Circle,
    rect: Rect,
    line: Line,
    ellipse: Ellipse,
    polyline: Polyline,
    polygon: Polygon,
};

/** Native has no hover: a part's motion plays once when the icon becomes active (a tab is chosen). */
const MOTION_MS: Record<IconMotion['kind'], number> = {
    rotate: 350,
    shift: 350,
    swing: 450,
    wiggle: 500,
    lift: 400,
    pulse: 350,
    draw: 0,
    appear: 200,
};

const ACTIVE_FILL_OPACITY = 0.2;


/** Keyframes of a motion as [time 0..1, value]; one-shot on native, so holds come back too. */
function keyframes(motion: IconMotion): { prop: 'rotate' | 'translate' | 'scale' | 'opacity'; frames: [number, number][] } | null {
    switch (motion.kind) {
        case 'rotate':
        case 'swing':
            return { prop: 'rotate', frames: [[0, 0], [0.45, motion.deg], [1, 0]] };
        case 'wiggle': {
            const d = motion.deg;
            return { prop: 'rotate', frames: [[0, 0], [0.2, -d], [0.45, d * 0.7], [0.7, -d * 0.35], [0.88, d * 0.1], [1, 0]] };
        }
        case 'lift':
        case 'shift':
            return { prop: 'translate', frames: [[0, 0], [0.4, 1], [1, 0]] };
        case 'pulse':
            return { prop: 'scale', frames: [[0, 1], [0.45, motion.scale], [1, 1]] };
        case 'appear':
            return { prop: 'opacity', frames: [[0, 0.15], [1, 1]] };
        default:
            // Drawing a stroke would animate path geometry per frame; native skips it.
            return null;
    }
}

/** One progress value drives every part: map a part's local keyframes into its slot of the whole run. */
function partRange(frames: [number, number][], delay: number, ms: number, total: number) {
    const inputRange: number[] = [0];
    const outputRange: number[] = [frames[0]?.[1] ?? 0];
    for (const [t, v] of frames) {
        inputRange.push((delay + t * ms) / total);
        outputRange.push(v);
    }
    inputRange.push(1);
    outputRange.push(frames.at(-1)?.[1] ?? 0);
    return { inputRange, outputRange, extrapolate: 'clamp' as const };
}

function renderNodes(part: AnimatedIconPart, fillOn: boolean, color: string): ReactNode[] {
    return part.nodes.map(([tag, attrs], index) => {
        const Shape = SHAPES[tag];
        // react-native-svg ignores an animated fillOpacity, so the fill switches.
        const filled = fillOn && fillsNode(part.fill, index);
        return <Shape key={index} {...attrs} fill={filled ? color : 'none'} fillOpacity={filled ? ACTIVE_FILL_OPACITY : undefined} />;
    });
}

/** Wraps a part in the groups its motion animates; draw (and no motion) leaves it as it is. */
function withMotion(content: ReactNode, motion: IconMotion | undefined, progress: Animated.Value, delay: number, total: number): ReactNode {
    const kf = motion ? keyframes(motion) : null;
    if (!motion || !kf) return content;
    const value = progress.interpolate(partRange(kf.frames, delay, motion.ms ?? MOTION_MS[motion.kind], total));
    if (kf.prop === 'opacity')
        return <AnimatedG opacity={value}>{content}</AnimatedG>;
    if (kf.prop === 'translate') {
        const m = motion as Extract<IconMotion, { kind: 'lift' | 'shift' }>;
        const tx = value.interpolate({ inputRange: [0, 1], outputRange: [0, m.x ?? 0] });
        const ty = value.interpolate({ inputRange: [0, 1], outputRange: [0, m.y ?? (m.kind === 'lift' ? -1.5 : 0)] });
        return <AnimatedG style={{ transform: [{ translateX: tx }, { translateY: ty }] }}>{content}</AnimatedG>;
    }
    // Rotate and scale turn around the motion's origin: translate there, transform, translate back.
    const [ox, oy] = 'origin' in motion && motion.origin ? motion.origin : [12, 12];
    const transform = kf.prop === 'rotate'
        ? [{ rotate: value.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) }]
        : [{ scale: value }];
    return (
        <G transform={`translate(${ox} ${oy})`}>
            <AnimatedG style={{ transform }}>
                <G transform={`translate(${-ox} ${-oy})`}>{content}</G>
            </AnimatedG>
        </G>
    );
}

/** A part's shape while active (Menu → X), switched at once. */
function withActiveShape(part: AnimatedIconPart, active: boolean, content: ReactNode): ReactNode {
    const shape = active ? part.active : undefined;
    if (!shape) return content;
    const [ox, oy] = shape.origin ?? [12, 12];
    return (
        <G
            opacity={shape.hide ? 0 : 1}
            transform={`translate(${ox + (shape.x ?? 0)} ${oy + (shape.y ?? 0)}) rotate(${shape.deg ?? 0}) translate(${-ox} ${-oy})`}
        >
            {content}
        </G>
    );
}

/**
 * Native engine: react-native-svg with the static icon's geometry. Active fill and active shapes (Menu → X)
 * switch at once; a part's motion plays once, from one Animated value, when the icon becomes active (never on mount),
 * and the press scale runs on the native driver. Reduce Motion turns both off.
 */
export default function AnimatedLucideIcon({
    spec,
    size,
    width,
    height,
    color,
    strokeWidth,
    className: _className,
    active = false,
    pressed,
    scenes,
    style,
    ...rest
}: Readonly<AnimatedLucideIconProps>) {
    const dim = Number(width ?? height ?? size ?? 24) || 24;
    const c = color || 'currentColor';
    const fillActive = active && scenes?.fill !== false;
    const motionOn = scenes?.draw !== false;
    const reduceMotion = useReduceMotion();
    const delays = motionDelays(spec);
    const total = Math.max(1, ...spec.parts.map((part, i) => (part.motion ? (delays[i] ?? 0) + (part.motion.ms ?? MOTION_MS[part.motion.kind]) : 0)));

    // At 1 every part is at rest (appear parts fully drawn); a run resets it to 0 when it starts.
    const progress = useAnimatedValue(1);
    const scale = useAnimatedValue(1);
    const wasActive = useRef(active);
    const wasPressed = useRef(pressed);

    useEffect(() => {
        const rising = active && !wasActive.current;
        wasActive.current = active;
        if (!rising || reduceMotion || !motionOn) return;
        progress.setValue(0);
        // SVG group transforms can't use the native driver; the run is short and plays once per activation.
        Animated.timing(progress, { toValue: 1, duration: total, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    }, [active, reduceMotion, motionOn, progress, total]);

    useEffect(() => {
        if (pressed === wasPressed.current) return;
        wasPressed.current = pressed;
        if (reduceMotion) return;
        Animated.timing(scale, { toValue: pressed ? 0.96 : 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }).start();
    }, [pressed, reduceMotion, scale]);

    return (
        <Animated.View style={[{ width: dim, height: dim, transform: [{ scale }] }, style as object]} {...rest}>
            <Svg
                width={dim}
                height={dim}
                viewBox="0 0 24 24"
                fill="none"
                color={c}
                stroke={c}
                strokeWidth={iconStrokeWidth(strokeWidth)}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {spec.parts.map((part, index) => (
                    <G key={index}>
                        {withActiveShape(
                            part,
                            active,
                            withMotion(renderNodes(part, fillActive, c), motionOn ? part.motion : undefined, progress, delays[index] ?? 0, total)
                        )}
                    </G>
                ))}
            </Svg>
        </Animated.View>
    );
}
