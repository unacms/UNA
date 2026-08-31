'use client'

import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, Ellipse } from 'react-native-svg'

// Re-export the shared inline SVG set (brand/custom icons). Explicit `.js` avoids
// resolving back to this `.web.js` file. These remain available on web too.
export * from './icons-svg.js'

// ---------------------------------------------------------------------------
// Web-only inline Lucide icons (Tier 1).
//
// On web the default icon path renders a <span> whose mask-image points at the
// /api/icon route — one HTTP request per icon, which causes first-paint pop-in.
// For the hottest, above-the-fold UI-chrome icons we instead render the SVG
// inline (zero network, no jank) using the real Lucide icon-node geometry.
//
// This is intentionally a `.web.js` file: native keeps resolving icons through
// `iconset.js` (lucide-react-native, theme-aware colour resolution), so this
// adds no native behaviour change. The node data is copied verbatim from
// lucide-react v1.16.0 so stroke widths/paths match the masked output exactly.
// ---------------------------------------------------------------------------

const TAGS = { path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse }

const makeLucideIcon = (nodes) => function LucideInlineIcon({ width, height, size, color, strokeWidth, className }) {
    const resolvedWidth = width || size || 24
    const resolvedHeight = height || size || 24
    // Mirror the mask path: a wrapping <span> carries the icon's own className
    // (text-* colour + layout) while the SVG strokes with `currentColor` so it
    // inherits that colour. An explicit `color` prop overrides via inline style.
    const explicitColor = color && color !== 'currentColor' ? color : undefined
    return (
        <span
            className={className}
            style={{ display: 'inline-flex', flexShrink: 0, ...(explicitColor ? { color: explicitColor } : null) }}
        >
            <Svg
                width={resolvedWidth}
                height={resolvedHeight}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {nodes.map(([tag, attrs], i) => {
                    const Tag = TAGS[tag]
                    return Tag ? <Tag key={i} {...attrs} /> : null
                })}
            </Svg>
        </span>
    )
}

export const Menu = makeLucideIcon([['path', { d: 'M4 5h16' }], ['path', { d: 'M4 12h16' }], ['path', { d: 'M4 19h16' }]])
export const Search = makeLucideIcon([['path', { d: 'm21 21-4.34-4.34' }], ['circle', { cx: '11', cy: '11', r: '8' }]])
export const X = makeLucideIcon([['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]])
export const Bell = makeLucideIcon([['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }], ['path', { d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' }]])
export const MessageSquare = makeLucideIcon([['path', { d: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z' }]])
export const MessageCircle = makeLucideIcon([['path', { d: 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719' }]])
export const Heart = makeLucideIcon([['path', { d: 'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5' }]])
export const Bookmark = makeLucideIcon([['path', { d: 'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z' }]])
export const Star = makeLucideIcon([['path', { d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }]])
export const Plus = makeLucideIcon([['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]])
export const Settings = makeLucideIcon([['path', { d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915' }], ['circle', { cx: '12', cy: '12', r: '3' }]])
export const User = makeLucideIcon([['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }], ['circle', { cx: '12', cy: '7', r: '4' }]])
export const Image = makeLucideIcon([['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', ry: '2' }], ['circle', { cx: '9', cy: '9', r: '2' }], ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }]])
export const Eye = makeLucideIcon([['path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }], ['circle', { cx: '12', cy: '12', r: '3' }]])
export const Ellipsis = makeLucideIcon([['circle', { cx: '12', cy: '12', r: '1' }], ['circle', { cx: '19', cy: '12', r: '1' }], ['circle', { cx: '5', cy: '12', r: '1' }]])
export const ChevronRight = makeLucideIcon([['path', { d: 'm9 18 6-6-6-6' }]])
export const ChevronLeft = makeLucideIcon([['path', { d: 'm15 18-6-6 6-6' }]])
export const ChevronDown = makeLucideIcon([['path', { d: 'm6 9 6 6 6-6' }]])
export const ChevronUp = makeLucideIcon([['path', { d: 'm18 15-6-6-6 6' }]])
export const ArrowLeft = makeLucideIcon([['path', { d: 'm12 19-7-7 7-7' }], ['path', { d: 'M19 12H5' }]])
export const ArrowRight = makeLucideIcon([['path', { d: 'M5 12h14' }], ['path', { d: 'm12 5 7 7-7 7' }]])
export const ArrowUp = makeLucideIcon([['path', { d: 'm5 12 7-7 7 7' }], ['path', { d: 'M12 19V5' }]])
export const Square = makeLucideIcon([['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }]])
export const Check = makeLucideIcon([['path', { d: 'M20 6 9 17l-5-5' }]])
export const Languages = makeLucideIcon([['path', { d: 'm5 8 6 6' }], ['path', { d: 'm4 14 6-6 2-3' }], ['path', { d: 'M2 5h12' }], ['path', { d: 'M7 2h1' }], ['path', { d: 'm22 22-5-10-5 10' }], ['path', { d: 'M14 18h6' }]])
export const LogIn = makeLucideIcon([['path', { d: 'm10 17 5-5-5-5' }], ['path', { d: 'M15 12H3' }], ['path', { d: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' }]])
export const UserRoundPlus = makeLucideIcon([['path', { d: 'M2 21a8 8 0 0 1 13.292-6' }], ['circle', { cx: '10', cy: '8', r: '5' }], ['path', { d: 'M19 16v6' }], ['path', { d: 'M22 19h-6' }]])
export const Camera = makeLucideIcon([['path', { d: 'M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z' }], ['circle', { cx: '12', cy: '13', r: '3' }]])
export const Lock = makeLucideIcon([['rect', { width: '18', height: '11', x: '3', y: '11', rx: '2', ry: '2' }], ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }]])
export const Share2 = makeLucideIcon([['circle', { cx: '18', cy: '5', r: '3' }], ['circle', { cx: '6', cy: '12', r: '3' }], ['circle', { cx: '18', cy: '19', r: '3' }], ['line', { x1: '8.59', x2: '15.42', y1: '13.51', y2: '17.49' }], ['line', { x1: '15.41', x2: '8.59', y1: '6.51', y2: '10.49' }]])
export const Trash2 = makeLucideIcon([['path', { d: 'M10 11v6' }], ['path', { d: 'M14 11v6' }], ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }], ['path', { d: 'M3 6h18' }], ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]])
export const Pencil = makeLucideIcon([['path', { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' }], ['path', { d: 'm15 5 4 4' }]])
