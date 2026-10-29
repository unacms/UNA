import type { IllustrationName, IllustrationShape } from './illustration.types';

// Every illustration is drawn on a 200 x 200 canvas, from filled paths only.
export const ILLUSTRATION_VIEWBOX = '0 0 200 200';

const circle = (cx: number, cy: number, r: number) =>
    `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const ring = (cx: number, cy: number, outer: number, inner: number) =>
    circle(cx, cy, outer) + circle(cx, cy, inner);

// Home splash ("connect, share, create"): four tiles of basic shapes.
const splash: IllustrationShape[] = [
    // Top left: a dot on a rounded square.
    { d: roundedRect(4, 4, 92, 92, 24), tone: 'muted' },
    { d: circle(50, 50, 26), tone: 'primary' },
    // Top right: a quarter disc from the shared corner, a small dot in the free corner.
    { d: 'M104 96V4A92 92 0 0 1 196 96Z', tone: 'accent' },
    { d: circle(180, 20, 12), tone: 'accentForeground' },
    // Bottom left: two half discs meeting at their curves.
    { d: 'M4 104A46 46 0 0 0 96 104Z', tone: 'accentForeground' },
    { d: 'M4 196A46 46 0 0 1 96 196Z', tone: 'muted' },
    // Bottom right: a ring around a dot.
    { d: ring(150, 150, 46, 30), tone: 'muted', evenOdd: true },
    { d: circle(150, 150, 16), tone: 'primary' },
];

// Create account ("time to join"): four tiles like the splash, a plus in the first.
const join: IllustrationShape[] = [
    // Top left: a plus on a rounded square.
    { d: roundedRect(4, 4, 92, 92, 24), tone: 'primary' },
    { d: roundedRect(45, 26, 10, 48, 5), tone: 'primaryForeground' },
    { d: roundedRect(26, 45, 48, 10, 5), tone: 'primaryForeground' },
    // Top right: a leaf with a dot.
    { d: 'M150 4H196V50A46 46 0 0 1 150 96H104V50A46 46 0 0 1 150 4Z', tone: 'accent' },
    { d: circle(150, 50, 14), tone: 'accentForeground' },
    // Bottom left: an arch.
    { d: 'M4 196V150A46 46 0 0 1 96 150V196Z', tone: 'muted' },
    // Bottom right: a disc.
    { d: circle(150, 150, 46), tone: 'accentForeground' },
];

export const ILLUSTRATIONS: Record<IllustrationName, IllustrationShape[]> = { splash, join };
