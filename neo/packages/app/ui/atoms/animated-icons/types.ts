/**
 * Data model of an animated Lucide icon (see animated-icons.md).
 *
 * An icon is its Lucide node data for the 24px grid, split into parts. Each part can take part in the active
 * duotone (`fill`), move on hover (`motion`) and change shape while active (`active`). The engine draws the
 * same geometry as the static icon, so swapping one for the other never moves a pixel.
 */

/** One Lucide node: `['path', { d }]`, `['circle', { cx, cy, r }]`, ... as in lucide-static `icon-nodes.json`. */
export type IconNode = readonly [
    tag: 'path' | 'circle' | 'rect' | 'line' | 'ellipse' | 'polyline' | 'polygon',
    attrs: Readonly<Record<string, string | number>>,
];

/** A point on the 24px grid, the pivot of a rotation or scale. */
export type IconPoint = readonly [x: number, y: number];

/**
 * What a part does while its row is hovered or keyboard-focused (web), or once when the icon becomes active (native).
 * - `rotate`: turns by `deg` around `origin` and holds while hovered.
 * - `shift`: moves by `x` / `y` and holds while hovered.
 * - `swing`: turns by `deg` and comes back, once.
 * - `wiggle`: swings both ways and settles (a bell), once.
 * - `lift`: moves by `x` / `y` (default up by 1.5) and comes back, once.
 * - `pulse`: scales to `scale` around `origin` and comes back, once.
 * - `draw`: draws the part's strokes from their start, once (web only).
 * - `appear`: fades the part in from faint, once.
 */
export type IconMotion =
    | { kind: 'rotate' | 'swing' | 'wiggle'; deg: number; origin?: IconPoint; ms?: number }
    | { kind: 'shift' | 'lift'; x?: number; y?: number; ms?: number }
    | { kind: 'pulse'; scale: number; origin?: IconPoint; ms?: number }
    | { kind: 'draw' | 'appear'; ms?: number };

/** A part's shape while the icon is active (the Menu lines folding into an X). */
export type IconActiveShape = {
    x?: number;
    y?: number;
    deg?: number;
    origin?: IconPoint;
    /** Fades the part out while active. */
    hide?: boolean;
};

export type AnimatedIconPart = {
    nodes: readonly IconNode[];
    /** Filled at 20% while active: true for every node, or the indexes of the nodes to fill. */
    fill?: boolean | readonly number[];
    motion?: IconMotion;
    /** Start delay of the motion in ms; `stagger` on the spec sets it for every moving part in turn. */
    delay?: number;
    active?: IconActiveShape;
};

export type AnimatedIconSpec = {
    parts: readonly AnimatedIconPart[];
    /** Delay in ms between the motions of consecutive moving parts. */
    stagger?: number;
    /** No hover motion while active (the Menu X stays still). */
    stillWhenActive?: boolean;
};

/** A registry entry the engine loads on demand (web): see `lazyAnimatedIcon`. */
export type LazyAnimatedIconEntry = {
    readonly lazyAnimatedIcon: true;
    /** Resolves to the spec (or a module whose default export is the spec); nothing means no animated icon. */
    load: () => Promise<AnimatedIconSpec | { default: AnimatedIconSpec } | null | undefined>;
};

/** Which scenes an `Icon` asked for through `icon-scene-*` classes (all on by default). */
export type AnimatedIconScenes = {
    /** Active duotone. */
    fill?: boolean;
    /** Hover / activation motion. */
    draw?: boolean;
};
