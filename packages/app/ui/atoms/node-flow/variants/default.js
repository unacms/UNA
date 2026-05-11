'use client';

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { appSetting, cn } from 'app/lib/util';
import { buildWavePath, getSegmentMidpoints, samplePathPositions } from '../lib/wave-path';
import { defaultHandleFor, handlePoint, resolveNodeRef } from '../lib/handles';
import { InlineMarker, MarkerDefs, markerRef } from '../lib/markers';

/**
 * RN Animated injects `collapsable={false}` into animated components; that
 * must not reach the web `<path>` (React 19 warning + react-native-svg web
 * quirk). Same wrapper pattern as the animated-icons in
 * `app/ui/atoms/animated-icons/icons/*`.
 */
const PathStripDomInvalid = forwardRef(function PathStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <Path ref={ref} {...rest} />;
});
PathStripDomInvalid.displayName = 'PathStripDomInvalid';

const GStripDomInvalid = forwardRef(function GStripDomInvalid(props, ref) {
    const { collapsable: _collapsable, onLayout: _onLayout, ...rest } = props;
    return <G ref={ref} {...rest} />;
});
GStripDomInvalid.displayName = 'GStripDomInvalid';

const AnimatedPath = Animated.createAnimatedComponent(PathStripDomInvalid);
const AnimatedG = Animated.createAnimatedComponent(GStripDomInvalid);

function omitUnsafeViewProps(rest) {
    if (!rest || typeof rest !== 'object') return {};
    const { onLayout: _onLayout, collapsable: _collapsable, ...safe } = rest;
    return safe;
}

const DEFAULT_NODE_SIZE = 56;
const DEFAULT_GAP = 96;
const DEFAULT_AMPLITUDE = 28;

/** Default arrow glyph for traveling markers, centered around (0, 0). */
const TRAVELER_ARROW_D = 'M -5 -4 L 6 0 L -5 4 Z';

/**
 * `NodeFlowDefault` — base "icons connected by a wavy line" graphic with a
 * React-Flow-style edges API.
 *
 * Cross-platform via `react-native-svg` + RN `Animated` (already in both
 * apps; no Skia / Lottie). Same conventions as the animated icons in
 * `app/ui/atoms/animated-icons/icons/*` (web-safe `Path` / `G` wrappers,
 * design tokens, `currentColor`).
 *
 * ### Backward-compatible default (no `edges` prop)
 *
 * Renders a single continuous wave through all node centers — identical to
 * the original behavior:
 *
 * ```jsx
 * <NodeFlow
 *   nodes={[
 *     { icon: 'UsersRound', label: 'Connect' },
 *     { icon: 'Compass',    label: 'Discover' },
 *     { icon: 'MessageCircleMore', label: 'Engage' },
 *   ]}
 *   animation="flow"
 * />
 * ```
 *
 * ### Edges with handles, markers, and animated travelers
 *
 * ```jsx
 * <NodeFlow
 *   nodes={[
 *     { id: 'a', icon: 'UsersRound', label: 'Connect' },
 *     { id: 'b', icon: 'Compass', label: 'Discover' },
 *     { id: 'c', icon: 'MessageCircleMore', label: 'Engage' },
 *   ]}
 *   edges={[
 *     {
 *       source: 'a', sourceHandle: 'right',
 *       target: 'c', targetHandle: 'left',
 *       via: [{ node: 'b', handle: 'center' }],
 *       markerEnd: 'arrow',
 *       animation: 'flow',
 *       animatedMarker: true,
 *     },
 *   ]}
 * />
 * ```
 *
 * ### Web bundle hygiene
 *
 * Prefer `next/dynamic` at call sites to keep route bundles lean:
 *
 * ```js
 * import dynamic from 'next/dynamic';
 * const NodeFlow = dynamic(() => import('app/ui/atoms/node-flow'), { ssr: false });
 * ```
 *
 * ### Props
 *
 * - `nodes`: `Array<NodeSpec>` (see README).
 * - `edges`: `Array<EdgeSpec>` (optional). If omitted, all node centers are
 *   wired into one continuous wave.
 * - `orientation`: `'horizontal' | 'vertical'` (default `'horizontal'`).
 *   Drives node layout and default handles (source = `right`/`bottom`,
 *   target = `left`/`top`).
 * - `nodeSize`, `gap`, `waveAmplitude`, `strokeWidth`,
 *   `animation` (default for edges), `drawDuration`, `flowDuration`,
 *   `className`, `lineClassName`, `iconClassName`, `labelClassName`,
 *   `color` — see README for the full table.
 */
export function NodeFlowDefault({
    nodes = [],
    edges,
    orientation = 'horizontal',
    nodeSize = DEFAULT_NODE_SIZE,
    gap = DEFAULT_GAP,
    waveAmplitude = DEFAULT_AMPLITUDE,
    strokeWidth: strokeWidthProp,
    animation = 'draw',
    drawDuration = 1200,
    flowDuration = 6000,
    className,
    lineClassName,
    iconClassName,
    labelClassName,
    color,
    ...rest
}) {
    const isHorizontal = orientation !== 'vertical';
    const sw = strokeWidthProp ?? appSetting('layout', 'default_icon_stroke_width') ?? 2;
    const viewProps = omitUnsafeViewProps(rest);
    const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');

    const count = nodes.length;
    const mainLength = count > 1 ? gap * (count - 1) + nodeSize : nodeSize;
    const crossSize = Math.max(nodeSize, waveAmplitude * 2 + nodeSize * 0.6);
    const padStart = nodeSize / 2;

    const geometries = useMemo(() => {
        if (count <= 0) return [];
        if (count === 1) {
            return [{ cx: mainLength / 2, cy: crossSize / 2, halfWidth: nodeSize / 2 }];
        }
        const usable = Math.max(0, mainLength - padStart - padStart);
        const step = usable / (count - 1);
        return nodes.map((_, i) => {
            const main = padStart + step * i;
            return {
                cx: isHorizontal ? main : crossSize / 2,
                cy: isHorizontal ? crossSize / 2 : main,
                halfWidth: nodeSize / 2,
            };
        });
    }, [count, mainLength, crossSize, nodeSize, padStart, isHorizontal, nodes]);

    /**
     * Resolve the `edges` prop into concrete render specs (anchor points per
     * edge). When `edges` is omitted we synthesize one continuous edge
     * routed through every node center, preserving the original visual.
     */
    const resolvedEdges = useMemo(
        () =>
            resolveEdges({
                edges,
                nodes,
                geometries,
                orientation,
                fallbackAmplitude: waveAmplitude,
                fallbackAnimation: animation,
            }),
        [edges, nodes, geometries, orientation, waveAmplitude, animation],
    );

    const width = isHorizontal ? mainLength : crossSize;
    const height = isHorizontal ? crossSize : mainLength;
    const svgColorStyle = color != null && color !== '' ? { color } : { color: 'inherit' };

    return (
        <View
            className={cn('relative', className)}
            style={{ width, height }}
            {...viewProps}
        >
            <Svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                fill="none"
                style={svgColorStyle}
            >
                <MarkerDefs prefix={prefix} edges={resolvedEdges} />
                {resolvedEdges.map((edge, i) => (
                    <EdgePath
                        key={edge.key ?? i}
                        edge={edge}
                        prefix={prefix}
                        strokeWidth={sw}
                        color={color}
                        nodeSize={nodeSize}
                        drawDuration={drawDuration}
                        flowDuration={flowDuration}
                        lineClassName={lineClassName}
                    />
                ))}
            </Svg>

            {geometries.map((geo, i) => {
                const node = nodes[i] ?? {};
                const left = geo.cx - nodeSize / 2;
                const top = geo.cy - nodeSize / 2;
                const iconSize = Math.round(nodeSize * 0.5);
                return (
                    <View
                        key={node.key ?? node.id ?? i}
                        className={cn(
                            'absolute items-center justify-center rounded-full bg-card border border-border  shadow-card-outline dark:shadow-card-outline-deep',
                            node.className,
                        )}
                        style={{ left, top, width: nodeSize, height: nodeSize }}
                        pointerEvents="none"
                    >
                        <Icon
                            icon={node.icon}
                            size={iconSize}
                            active={!!node.active}
                            selected={!!node.selected}
                            className={cn('text-secondary-foreground', iconClassName, node.iconClassName)}
                        />
                        {node.label ? (
                            /**
                             * Horizontal flows: label sits centered below the bubble (the
                             * traditional "step 1/2/3" caption). Vertical flows: label sits
                             * to the right of the bubble, vertically centered with it,
                             * left-aligned so multiple labels form a clean column.
                             */
                            <Text
                                style={
                                    isHorizontal
                                        ? undefined
                                        : { position: 'absolute', left: nodeSize + 12, top: nodeSize / 2 - 8 }
                                }
                                className={cn(
                                    'text-xs text-muted-foreground',
                                    isHorizontal
                                        ? 'absolute -bottom-6 text-center'
                                        : 'text-left whitespace-nowrap',
                                    labelClassName,
                                    node.labelClassName,
                                )}
                                numberOfLines={1}
                            >
                                {node.label}
                            </Text>
                        ) : null}
                    </View>
                );
            })}
        </View>
    );
}

export default NodeFlowDefault;

/**
 * Renders a single edge: the wavy path itself, optional dash animation
 * (draw / flow), optional static SVG markers at the ends, and optionally an
 * arrowhead icon that travels along the path.
 */
function EdgePath({ edge, prefix, strokeWidth, color, nodeSize, drawDuration, flowDuration, lineClassName }) {
    const isWeb = Platform.OS === 'web';
    const lineStroke = color ?? 'currentColor';
    const dashAnim = useRef(new Animated.Value(0)).current;
    const pathRef = useRef(null);
    const [pathLen, setPathLen] = useState(edge.approxLength);

    /**
     * Web: real `getTotalLength()` is far more accurate than the polyline
     * estimate. Native: stick with the estimate from `wave-path.js`.
     */
    useEffect(() => {
        if (!isWeb) {
            setPathLen(edge.approxLength);
            return;
        }
        const node = pathRef.current;
        const measured = typeof node?.getTotalLength === 'function'
            ? node.getTotalLength()
            : 0;
        setPathLen(measured || edge.approxLength);
    }, [edge.d, edge.approxLength, isWeb]);

    useEffect(() => {
        const animation = edge.animation;
        if (animation === 'none' || !pathLen) {
            dashAnim.stopAnimation && dashAnim.stopAnimation();
            dashAnim.setValue(0);
            return undefined;
        }
        if (animation === 'draw') {
            dashAnim.setValue(pathLen);
            Animated.timing(dashAnim, {
                toValue: 0,
                duration: edge.drawDuration ?? drawDuration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
            return undefined;
        }
        if (animation === 'flow') {
            dashAnim.setValue(0);
            const loop = Animated.loop(
                Animated.timing(dashAnim, {
                    toValue: -pathLen,
                    duration: edge.flowDuration ?? flowDuration,
                    easing: Easing.linear,
                    useNativeDriver: false,
                }),
            );
            loop.start();
            return () => loop.stop();
        }
        return undefined;
    }, [edge.animation, edge.drawDuration, edge.flowDuration, pathLen, drawDuration, flowDuration, dashAnim]);

    let dashArray;
    if (edge.animation === 'draw' && pathLen) {
        dashArray = `${pathLen} ${pathLen}`;
    } else if (edge.animation === 'flow') {
        dashArray = `${Math.max(8, nodeSize / 4)} ${Math.max(6, nodeSize / 6)}`;
    }

    const me = markerRef(prefix, edge.markerEnd);
    const ms = markerRef(prefix, edge.markerStart);

    return (
        <G>
            <AnimatedPath
                ref={pathRef}
                d={edge.d}
                stroke={lineStroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={dashArray}
                strokeDashoffset={edge.animation === 'none' ? 0 : dashAnim}
                markerEnd={me}
                markerStart={ms}
                className={cn(lineClassName, edge.className)}
            />
            {edge.animatedMarker ? (
                <TravelingMarker
                    samples={edge.samples}
                    spec={edge.animatedMarker}
                    color={color}
                />
            ) : null}
            {edge.segmentMarkers
                ? edge.segmentMarkers.map((m, i) => (
                      <InlineMarker
                          key={`segmark-${i}`}
                          type={m.type}
                          x={m.x}
                          y={m.y}
                          angle={m.angle}
                          size={m.size}
                          color={m.color ?? color}
                      />
                  ))
                : null}
        </G>
    );
}

/**
 * Slides an SVG glyph along the resolved arc-length-uniform sample points.
 * Cross-platform: drives `style.transform` on an `Animated.G` via a single
 * progress `Animated.Value` mapped through multi-stop interpolations to
 * `translateX` / `translateY`. Avoids `<animateMotion>`, which isn't
 * reliably supported by react-native-svg.
 */
function TravelingMarker({ samples, spec, color }) {
    const duration = spec?.duration ?? 3000;
    const size = spec?.size ?? 12;
    const fill = spec?.color ?? color ?? 'currentColor';
    const progress = useRef(new Animated.Value(0)).current;

    const { inputRange, xRange, yRange } = useMemo(() => {
        if (!samples || samples.length < 2) {
            return { inputRange: [0, 1], xRange: [0, 0], yRange: [0, 0] };
        }
        const n = samples.length;
        const input = samples.map((_, i) => i / (n - 1));
        return {
            inputRange: input,
            xRange: samples.map((p) => p.x),
            yRange: samples.map((p) => p.y),
        };
    }, [samples]);

    useEffect(() => {
        progress.setValue(0);
        const loop = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration,
                easing: Easing.linear,
                useNativeDriver: false,
            }),
        );
        loop.start();
        return () => loop.stop();
    }, [duration, progress, inputRange.length]);

    if (!samples || samples.length < 2) return null;

    const xAnim = progress.interpolate({ inputRange, outputRange: xRange });
    const yAnim = progress.interpolate({ inputRange, outputRange: yRange });
    const scale = size / 12;

    return (
        <AnimatedG style={{ transform: [{ translateX: xAnim }, { translateY: yAnim }] }}>
            <G transform={`scale(${scale})`}>
                <Path d={TRAVELER_ARROW_D} fill={fill} stroke={fill} strokeWidth={0.5} strokeLinejoin="round" />
            </G>
        </AnimatedG>
    );
}

/**
 * Build the concrete edge specs the renderer iterates over. Each entry has
 * resolved anchor points, the SVG `d`, the arc-length, sampled positions
 * for traveling markers, and the resolved animation / marker config.
 */
function resolveEdges({ edges, nodes, geometries, orientation, fallbackAmplitude, fallbackAnimation }) {
    if (!nodes?.length || !geometries?.length) return [];

    const specs = Array.isArray(edges) && edges.length > 0
        ? edges
        : [synthesizeContinuousEdge(nodes)];

    const resolved = [];
    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i] || {};
        const sourceRef = resolveNodeRef(spec.source, nodes);
        const targetRef = resolveNodeRef(spec.target, nodes);
        if (!sourceRef || !targetRef) continue;

        const sourceHandle = spec.sourceHandle ?? defaultHandleFor(orientation, 'source');
        const targetHandle = spec.targetHandle ?? defaultHandleFor(orientation, 'target');

        const anchors = [
            buildAnchor(geometries[sourceRef.index], sourceHandle),
        ];
        for (const via of spec.via ?? []) {
            const viaRef = resolveNodeRef(via?.node, nodes);
            if (!viaRef) continue;
            anchors.push(buildAnchor(geometries[viaRef.index], via.handle ?? 'center'));
        }
        anchors.push(buildAnchor(geometries[targetRef.index], targetHandle));

        const isStraight = spec.type === 'straight';
        const amplitude = isStraight ? 0 : (spec.amplitude ?? fallbackAmplitude);
        const { d, approxLength } = buildWavePath({ anchors, amplitude });

        const animatedMarker = spec.animatedMarker
            ? (typeof spec.animatedMarker === 'object' ? spec.animatedMarker : {})
            : null;

        const samples = animatedMarker
            ? samplePathPositions({
                  anchors,
                  amplitude,
                  sampleCount: animatedMarker.sampleCount ?? 64,
              })
            : null;

        const arrowsAtMid = spec.arrowsAtSegmentMidpoints
            ? (typeof spec.arrowsAtSegmentMidpoints === 'object' ? spec.arrowsAtSegmentMidpoints : {})
            : null;
        const segmentMarkers = arrowsAtMid
            ? getSegmentMidpoints({ anchors, amplitude }).map((m) => ({
                  ...m,
                  type: arrowsAtMid.type ?? 'arrow',
                  size: arrowsAtMid.size ?? 12,
                  color: arrowsAtMid.color,
              }))
            : null;

        resolved.push({
            key: spec.key ?? `${sourceRef.index}-${targetRef.index}-${i}`,
            d,
            approxLength,
            samples,
            animation: spec.animation ?? fallbackAnimation,
            drawDuration: spec.drawDuration,
            flowDuration: spec.flowDuration,
            markerEnd: spec.markerEnd,
            markerStart: spec.markerStart,
            animatedMarker,
            segmentMarkers,
            className: spec.className,
        });
    }
    return resolved;
}

/**
 * Wrap `handlePoint` with `hideRadius` metadata so `getSegmentMidpoints`
 * can trim the visible portion of each segment when an anchor sits inside
 * a node bubble (i.e. handle === 'center'). Edge handles (`left`, `right`,
 * `top`, `bottom`) are already on the bubble boundary, so they contribute
 * no trimming.
 */
function buildAnchor(geo, position) {
    const point = handlePoint(geo, position);
    const halfH = geo.halfHeight ?? geo.halfWidth;
    const radius = position === 'center'
        ? Math.min(geo.halfWidth, halfH)
        : 0;
    return { ...point, hideRadius: radius };
}

/**
 * Backward-compat: when no `edges` are provided, route a single edge from
 * the first node through every middle node to the last node, with all
 * handles at `center`. Reproduces the original "continuous wave through all
 * nodes" look.
 */
function synthesizeContinuousEdge(nodes) {
    if (nodes.length < 2) return { source: 0, target: 0 };
    const via = [];
    for (let i = 1; i < nodes.length - 1; i++) {
        via.push({ node: i, handle: 'center' });
    }
    return {
        source: 0,
        sourceHandle: 'center',
        target: nodes.length - 1,
        targetHandle: 'center',
        via,
    };
}
