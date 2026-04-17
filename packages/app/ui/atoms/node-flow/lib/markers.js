'use client';

import { Defs, G, Marker, Path, Circle } from 'react-native-svg';

/**
 * SVG `<Marker>` registry for NodeFlow edges (drawn from React Flow's edge
 * marker model: https://reactflow.dev/examples/edges/markers).
 *
 * Each marker uses `currentColor` so it inherits the line tint applied to
 * the surrounding `<Svg>` (`style={{ color: 'inherit' }}` + Tailwind
 * `text-*` on the parent), keeping markers in sync with the design tokens.
 *
 * Add new shapes here; the registry is consumed by `MarkerDefs` below
 * (variants render that into a single shared `<Defs>` and reference the
 * markers by id from each path).
 */

/** @typedef {'arrow'|'arrow-closed'|'circle'|'dot'|'none'} MarkerType */

/** @type {MarkerType[]} */
export const MARKER_TYPES = ['arrow', 'arrow-closed', 'circle', 'dot', 'none'];

/**
 * Each definition declares a 12×12 viewBox glyph plus the reference point
 * `(refX, refY)` that should land on the path (the tip of an arrow, the
 * center of a dot, etc.). This metadata is consumed both by SVG `<Marker>`
 * defs (for `markerStart` / `markerEnd`) and by `InlineMarker` (for static
 * markers placed at arbitrary positions along a path).
 */
const MARKER_DEFS = {
    arrow: {
        viewBox: '0 0 12 12',
        vbSize: 12,
        refX: 9,
        refY: 6,
        width: 10,
        height: 10,
        body: (
            <Path
                d="M2 2 L9 6 L2 10"
                stroke="currentColor"
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),
    },
    'arrow-closed': {
        viewBox: '0 0 12 12',
        vbSize: 12,
        refX: 9,
        refY: 6,
        width: 10,
        height: 10,
        body: (
            <Path
                d="M2 2 L9 6 L2 10 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={0.5}
                strokeLinejoin="round"
            />
        ),
    },
    circle: {
        viewBox: '0 0 12 12',
        vbSize: 12,
        refX: 6,
        refY: 6,
        width: 8,
        height: 8,
        body: (
            <Circle cx={6} cy={6} r={4} fill="none" stroke="currentColor" strokeWidth={1.5} />
        ),
    },
    dot: {
        viewBox: '0 0 12 12',
        vbSize: 12,
        refX: 6,
        refY: 6,
        width: 6,
        height: 6,
        body: <Circle cx={6} cy={6} r={3.5} fill="currentColor" />,
    },
};

/**
 * Stable id for a marker shape inside a NodeFlow instance. The `prefix` is
 * unique per render so multiple NodeFlows on the same page never collide on
 * `<Defs>` ids.
 */
export function buildMarkerId(prefix, type) {
    return `${prefix}-marker-${type}`;
}

/**
 * Render a `<Defs>` containing exactly the markers referenced by `edges`.
 * Returns `null` when no edge uses a marker (so we don't emit an empty
 * `<Defs>` element).
 *
 * @param {{ prefix: string, edges: Array<{ markerEnd?: string, markerStart?: string }> }} input
 */
export function MarkerDefs({ prefix, edges }) {
    const used = new Set();
    for (const edge of edges) {
        const me = edge?.markerEnd;
        const ms = edge?.markerStart;
        if (me && me !== 'none' && MARKER_DEFS[me]) used.add(me);
        if (ms && ms !== 'none' && MARKER_DEFS[ms]) used.add(ms);
    }
    if (used.size === 0) return null;
    return (
        <Defs>
            {[...used].map((type) => {
                const def = MARKER_DEFS[type];
                return (
                    <Marker
                        key={type}
                        id={buildMarkerId(prefix, type)}
                        viewBox={def.viewBox}
                        refX={def.refX}
                        refY={def.refY}
                        markerWidth={def.width}
                        markerHeight={def.height}
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                    >
                        {def.body}
                    </Marker>
                );
            })}
        </Defs>
    );
}

/** Resolve a marker name to a `url(#...)` reference, or `undefined`. */
export function markerRef(prefix, type) {
    if (!type || type === 'none' || !MARKER_DEFS[type]) return undefined;
    return `url(#${buildMarkerId(prefix, type)})`;
}

/**
 * Render a registered marker glyph at an arbitrary position with an arbitrary
 * orientation — independent of SVG `<marker>` placement. Used by
 * `arrowsAtSegmentMidpoints` (and any custom variant that wants to place
 * markers along a path).
 *
 * Transform order (right-to-left in matrix multiplication, but written
 * left-to-right in the string): translate the glyph so its `(refX, refY)` is
 * at the local origin → scale to the requested size → rotate around origin →
 * translate to `(x, y)`. Net effect: the glyph's reference point lands on
 * `(x, y)` and points along `angle`.
 *
 * Color: the glyph body uses `currentColor`, so by default it inherits
 * whatever color the surrounding `<Svg>` resolves (matching the line). Pass
 * an explicit `color` to override — applied as a CSS color on the wrapping
 * `<G>` so the glyph's `currentColor` resolves to it (same trick the
 * animated icons use to retint without mutating the body).
 *
 * @param {Object} props
 * @param {'arrow'|'arrow-closed'|'circle'|'dot'} [props.type='arrow']
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} [props.angle=0]      Rotation in **radians** (matches `getSegmentMidpoints`).
 * @param {number} [props.size=12]      Final glyph size in SVG units.
 * @param {string} [props.color]        Optional explicit color; defaults to inherited `currentColor` (line tint).
 */
export function InlineMarker({ type = 'arrow', x, y, angle = 0, size = 12, color }) {
    const def = MARKER_DEFS[type];
    if (!def) return null;
    const angleDeg = (angle * 180) / Math.PI;
    const scale = size / def.vbSize;
    const colorStyle = color ? { color } : undefined;
    return (
        <G
            transform={`translate(${x}, ${y}) rotate(${angleDeg}) scale(${scale}) translate(${-def.refX}, ${-def.refY})`}
            style={colorStyle}
        >
            {def.body}
        </G>
    );
}
