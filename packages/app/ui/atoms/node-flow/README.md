# NodeFlow

Cross-platform "icons connected by a wavy line" graphic with a React-Flow-style edges API. Built on the same `react-native-svg` + RN `Animated` stack as the [animated icons](../animated-icons/), so it adds **no new dependencies** and renders identically on web (`apps/next`) and native (`apps/expo`).

Use it for onboarding flows, status pipelines, "step 1/2/3" explainers, integration diagrams, and similar visuals where a small set of icons should be visually linked — with control over which side of each node a connection enters/leaves, optional arrowheads, and optional animated markers traveling along the line.

## Quick start

Native (Expo) — direct import:

```javascript
import NodeFlow from 'app/ui/atoms/node-flow';

<NodeFlow
    nodes={[
        { icon: 'UsersRound', label: 'Connect' },
        { icon: 'Compass',    label: 'Discover' },
        { icon: 'MessageCircleMore', label: 'Engage' },
    ]}
/>
```

Web (Next.js) — defer to keep the route bundle small:

```javascript
import dynamic from 'next/dynamic';
const NodeFlow = dynamic(() => import('app/ui/atoms/node-flow'), { ssr: false });
```

With no `edges` prop, NodeFlow routes one continuous wave through every node center (the original behavior).

## Edges, handles, and markers

Inspired by [React Flow's edge model](https://reactflow.dev/examples/edges/markers): each node exposes named handle positions (`left`, `right`, `top`, `bottom`, `center`) and each edge picks the source and target handle by name. Markers (arrowheads, dots, circles) attach at either end via SVG `<marker>`. Optionally a glyph can travel along the path (see React Flow's [animating-edges](https://reactflow.dev/examples/edges/animating-edges)).

```jsx
<NodeFlow
    nodes={[
        { id: 'a', icon: 'UsersRound', label: 'Connect' },
        { id: 'b', icon: 'Compass', label: 'Discover' },
        { id: 'c', icon: 'MessageCircleMore', label: 'Engage' },
    ]}
    edges={[
        {
            source: 'a', sourceHandle: 'right',
            target: 'c', targetHandle: 'left',
            via: [{ node: 'b', handle: 'center' }],
            markerEnd: 'arrow',
            animation: 'flow',
            animatedMarker: { size: 14, duration: 3500 },
        },
    ]}
    nodeSize={64}
    gap={120}
    waveAmplitude={32}
/>
```

Node refs (`source`, `target`, `via[].node`) accept either an `id` string from the `nodes` array or a numeric index. Multiple edges can share nodes; each renders as its own SVG path with independent animation.

### Edge spec

```ts
type HandlePosition = 'left' | 'right' | 'top' | 'bottom' | 'center';
type MarkerType = 'arrow' | 'arrow-closed' | 'circle' | 'dot' | 'none';

type EdgeSpec = {
    source: string | number;
    target: string | number;
    sourceHandle?: HandlePosition;   // default: 'right' (horiz) / 'bottom' (vert)
    targetHandle?: HandlePosition;   // default: 'left'  (horiz) / 'top'    (vert)
    via?: Array<{ node: string | number; handle?: HandlePosition }>;
    type?: 'wave' | 'straight';      // 'straight' = polyline, no curvature
    amplitude?: number;              // overrides NodeFlow's waveAmplitude for this edge
    animation?: 'draw' | 'flow' | 'none';
    drawDuration?: number;           // ms
    flowDuration?: number;           // ms
    markerEnd?: MarkerType;
    markerStart?: MarkerType;
    arrowsAtSegmentMidpoints?: true | {  // one oriented arrow per segment between consecutive anchors
        type?: MarkerType;               // default 'arrow'
        size?: number;                   // default 12 (SVG units)
        color?: string;                  // explicit color override; defaults to the line's currentColor
    };
    animatedMarker?: true | {        // arrowhead glyph that loops along the path
        size?: number;               // default 12 (px in SVG units)
        duration?: number;           // default 3000 (ms per loop)
        color?: string;              // overrides currentColor
        sampleCount?: number;        // default 64; bump for very long paths
    };
    className?: string;              // tailwind classes applied to the <path>
    key?: string | number;
};
```

### Static markers

Each `MarkerType` value renders as an inline SVG `<marker>` and is referenced via `markerEnd` / `markerStart`. They inherit `currentColor` so they tint with the line. To register a new shape, add an entry to `MARKER_DEFS` in `[lib/markers.js](./lib/markers.js)`.

### Arrows at segment midpoints

`arrowsAtSegmentMidpoints` drops one oriented arrow at the **visible midpoint of every segment between consecutive anchors** (so 3 anchors → 2 arrows, one in each gap between bubbles). When an anchor sits inside a node bubble (handle = `center`, e.g. a `via` point), the bubble paints over the path within its radius — so the arrow is positioned at the arc-length midpoint of the **unobstructed** portion of the segment, not the geometric midpoint of the full chord. Arrow tangent comes from sampling the curve so it always points along the path direction.

```jsx
{
    source: 'a', sourceHandle: 'right',
    target: 'c', targetHandle: 'left',
    via: [{ node: 'b', handle: 'center' }],
    arrowsAtSegmentMidpoints: { size: 14, color: 'currentColor' },  // or just `true`
    animation: 'none',
}
```

Color defaults to the line's `currentColor` (so the arrows match whatever tints the line — `color` prop on `<NodeFlow>`, `text-*` className on the parent View, etc.). Override per edge via `arrowsAtSegmentMidpoints.color`.

### Animated traveling markers

Set `animatedMarker: true` (or pass an object) on any edge to render an arrowhead glyph that slides along the path on a loop. Implementation drives `style.transform` on an `Animated.G` via a single progress `Animated.Value` mapped through arc-length-uniform sample points — no SVG `<animateMotion>` (which `react-native-svg` doesn't support reliably).

## Node spec

```ts
type NodeSpec = {
    id?: string | number;     // referenced by edges; defaults to the array index
    icon: string;             // Lucide name resolved via app/ui/atoms/icon (e.g. 'UsersRound')
    label?: string;
    active?: boolean;         // forwarded to Icon
    selected?: boolean;       // alias understood by Icon
    key?: string | number;
    className?: string;       // bubble override
    iconClassName?: string;   // per-node icon class override
    labelClassName?: string;  // per-node label class override
};
```

Use **PascalCase Lucide names** (e.g. `UsersRound`, `Compass`, `MessageCircleMore`) so they resolve through the regular app icon path.

## Container props


| Prop             | Type                        | Default                                            | Notes                                                                                         |
| ---------------- | --------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `nodes`          | `Array<NodeSpec>`           | `[]`                                               |                                                                                               |
| `edges`          | `Array<EdgeSpec>`           | `undefined`                                        | Omit for the default continuous wave through all node centers.                                |
| `orientation`    | `'horizontal' | 'vertical'` | `'horizontal'`                                     | Drives node layout and the default `sourceHandle` / `targetHandle`.                           |
| `nodeSize`       | `number`                    | `56`                                               | Px diameter of each node bubble.                                                              |
| `gap`            | `number`                    | `96`                                               | Px between consecutive node centers along the main axis.                                      |
| `waveAmplitude`  | `number`                    | `28`                                               | Default amplitude for edges that don't set their own.                                         |
| `strokeWidth`    | `number`                    | `appSetting('layout','default_icon_stroke_width')` | Falls back to `2`.                                                                            |
| `animation`      | `'draw' | 'flow' | 'none'`  | `'draw'`                                           | Default for edges that don't set their own.                                                   |
| `drawDuration`   | `number` (ms)               | `1200`                                             |                                                                                               |
| `flowDuration`   | `number` (ms)               | `6000`                                             |                                                                                               |
| `color`          | `string`                    | inherits via `currentColor`                        | Explicit override; otherwise the parent's `text-`* token tints the lines, markers, and icons. |
| `className`      | `string`                    | —                                                  | Outer container.                                                                              |
| `lineClassName`  | `string`                    | —                                                  | Applied to every edge `<path>` (e.g. `text-primary`).                                         |
| `iconClassName`  | `string`                    | `text-foreground`                                  | Default tint for icons inside the bubbles.                                                    |
| `labelClassName` | `string`                    | `text-xs text-muted-foreground`                    | Applied to optional per-node labels.                                                          |


## Variants and customization

Mirrors the [animated icons](../../../../../animated-icons.md) registry pattern.

- Upstream defaults live in `[packages/app/default/node-flow-variants.js](../../../default/node-flow-variants.js)`.
- Branch / fork projects extend the registry in `[packages/app/customization/node-flow-variants.js](../../../customization/node-flow-variants.js)`:
  ```javascript
  'use client';
  import { nodeFlowVariants as nodeFlowVariantsDefault } from 'app/default/node-flow-variants';
  import { NodeFlowOnboarding } from 'app/ui/atoms/node-flow/variants/onboarding';

  export const nodeFlowVariants = {
      ...nodeFlowVariantsDefault,
      onboarding: NodeFlowOnboarding,
      // Or shadow the default look entirely:
      // default: NodeFlowOnboarding,
  };
  ```
- Consumers stay variant-agnostic:
  ```javascript
  <NodeFlow variant="onboarding" nodes={...} />
  ```
  Unknown `variant` falls back to `default` with a dev-only warn.

### Authoring a custom variant

Drop a file under `packages/app/ui/atoms/node-flow/variants/<name>.js` and register it from `customization/node-flow-variants.js`. Custom variants typically reuse the shared helpers:

```javascript
import { buildWavePath, samplePathPositions } from 'app/ui/atoms/node-flow/lib/wave-path';
import { handlePoint, defaultHandleFor, resolveNodeRef } from 'app/ui/atoms/node-flow/lib/handles';
import { MarkerDefs, markerRef } from 'app/ui/atoms/node-flow/lib/markers';
```

Or roll their own line entirely (straight, dashed, double-helix, gradient stroke, …) — only the prop contract needs to match what the consumer is passing.

### Implementation guidelines (match repo conventions)

1. Start with `'use client'` — variants use React state and RN `Animated`.
2. When animating SVG paths on web, wrap `<Path>` and `<G>` in small `forwardRef` components that strip `collapsable` / `onLayout` before they reach the DOM (React 19 + react-native-svg quirk). See `variants/default.js` and the [animated icons doc](../../../../../animated-icons.md) for the exact pattern.
3. Use **design tokens only** (`bg-card`, `border-border`, `text-foreground`, `text-primary`, …). No hardcoded colors.
4. Let stroke / fill default to `currentColor` and set `style={{ color: 'inherit' }}` on `<Svg>` so Tailwind `text-*` on the parent tints the whole graphic, just like the static Lucide icons.
5. Don't sprinkle `useMemo` / `memo` — the web app runs the React Compiler (see `[agents.md](../../../../../agents.md)`).

## Bundle / deferred-loading notes

- **Native**: ships in the main bundle; `react-native-svg` is already a dep of `apps/expo`. No special handling needed.
- **Web**: prefer the `next/dynamic` snippet above so callers opt in. The shared package is marked `sideEffects: false` (see `[packages/app/package.json](../../../package.json)`), so unused exports tree-shake.
- **If a future variant needs Skia or Lottie**: install it **only in `apps/expo`** first, put the heavy code in its own variant file, and require web callers to dynamic-import that variant. That way `@shopify/react-native-skia` / CanvasKit (~2.6 MB on web) never enters the shared `packages/app` import graph and never lands on a route that doesn't use it.

