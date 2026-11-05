import type { AnimatedIconSpec, IconNode } from './types';

/**
 * Specs of the animated icons upstream NEO ships, keyed by Lucide component name.
 *
 * Node data is lucide-static 1.66.0 `icon-nodes.json`, the version both the web masks (/lucide/*) and the iOS
 * asset catalog come from; copy it again when Lucide is bumped and an icon's drawing changes. Each icon gets one
 * quiet motion that says what it is (a bell rings, a lens tilts, a check is drawn) and, where it has a closed
 * outline, the active duotone fill.
 */

const path = (d: string): IconNode => ['path', { d }];
const circle = (cx: number, cy: number, r: number): IconNode => ['circle', { cx, cy, r }];
const rect = (x: number, y: number, width: number, height: number, rx: number): IconNode => ['rect', { x, y, width, height, rx }];
const line = (x1: number, y1: number, x2: number, y2: number): IconNode => ['line', { x1, y1, x2, y2 }];

export const specs: Record<string, AnimatedIconSpec> = {
    House: {
        parts: [
            { nodes: [path('M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z')], fill: true },
            { nodes: [path('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8')], motion: { kind: 'draw' } },
        ],
    },
    Compass: {
        parts: [
            { nodes: [circle(12, 12, 10)], fill: true },
            {
                nodes: [path('m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z')],
                motion: { kind: 'rotate', deg: 90, origin: [12, 12], ms: 400 },
            },
        ],
    },
    TvMinimalPlay: {
        parts: [
            { nodes: [rect(2, 3, 20, 14, 2)], fill: true },
            {
                nodes: [path('M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z')],
                motion: { kind: 'lift', x: 1.5, y: 0 },
            },
            { nodes: [path('M7 21h10')] },
        ],
    },
    Store: {
        parts: [
            { nodes: [path('M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5')] },
            { nodes: [path('M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05')], fill: true },
            {
                nodes: [path('M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244')],
                fill: true,
                motion: { kind: 'lift', y: -1 },
            },
        ],
    },
    Shapes: {
        parts: [
            {
                nodes: [path('M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z')],
                fill: true,
                motion: { kind: 'wiggle', deg: 12, origin: [12, 7] },
            },
            { nodes: [rect(3, 14, 7, 7, 1)], fill: true },
            { nodes: [circle(17.5, 17.5, 3.5)], fill: true },
        ],
    },
    Calendar: {
        stagger: 60,
        parts: [
            { nodes: [rect(3, 3, 18, 18, 2)], fill: true },
            { nodes: [path('M3 9h18')] },
            { nodes: [path('M8 2v3')], motion: { kind: 'lift', y: -1.25 } },
            { nodes: [path('M16 2v3')], motion: { kind: 'lift', y: -1.25 } },
        ],
    },
    Bell: {
        parts: [
            {
                nodes: [
                    path('M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'),
                    path('M10.268 21a2 2 0 0 0 3.464 0'),
                ],
                fill: [0],
                motion: { kind: 'wiggle', deg: 10, origin: [12, 2.5], ms: 500 },
            },
        ],
    },
    Info: {
        parts: [
            { nodes: [circle(12, 12, 10)], fill: true },
            { nodes: [path('M12 16v-4')], motion: { kind: 'draw', ms: 300 } },
            { nodes: [path('M12 8h.01')], motion: { kind: 'appear', ms: 200 }, delay: 200 },
        ],
    },
    Mail: {
        parts: [
            { nodes: [rect(2, 4, 20, 16, 2)], fill: true },
            { nodes: [path('m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7')], motion: { kind: 'lift', y: -1.25 } },
        ],
    },
    Menu: {
        stagger: 50,
        stillWhenActive: true,
        parts: [
            { nodes: [path('M4 5h16')], motion: { kind: 'lift', y: -0.75, ms: 300 }, active: { y: 7, deg: 45, origin: [12, 5] } },
            { nodes: [path('M4 12h16')], motion: { kind: 'lift', y: -0.75, ms: 300 }, active: { hide: true } },
            { nodes: [path('M4 19h16')], motion: { kind: 'lift', y: -0.75, ms: 300 }, active: { y: -7, deg: -45, origin: [12, 19] } },
        ],
    },
    MessageCircleMore: {
        stagger: 80,
        parts: [
            { nodes: [path('M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719')], fill: true },
            { nodes: [path('M8 12h.01')], motion: { kind: 'appear', ms: 200 } },
            { nodes: [path('M12 12h.01')], motion: { kind: 'appear', ms: 200 } },
            { nodes: [path('M16 12h.01')], motion: { kind: 'appear', ms: 200 } },
        ],
    },
    UsersRound: {
        parts: [
            { nodes: [path('M18 21a8 8 0 0 0-16 0')] },
            { nodes: [circle(10, 8, 5)], fill: true },
            { nodes: [path('M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3')], motion: { kind: 'lift', x: -1.5, y: 0 } },
        ],
    },

    // Site, tab bar and toolbar icons that had no animation before.
    UserRound: {
        parts: [
            { nodes: [circle(12, 8, 5)], fill: true, motion: { kind: 'lift', y: -1 } },
            { nodes: [path('M20 21a8 8 0 0 0-16 0')] },
        ],
    },
    File: {
        parts: [
            { nodes: [path('M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z')], fill: true },
            { nodes: [path('M14 2v5a1 1 0 0 0 1 1h5')], motion: { kind: 'draw' } },
        ],
    },
    FileText: {
        stagger: 80,
        parts: [
            { nodes: [path('M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z')], fill: true },
            { nodes: [path('M14 2v5a1 1 0 0 0 1 1h5')] },
            { nodes: [path('M10 9H8')], motion: { kind: 'draw', ms: 250 } },
            { nodes: [path('M16 13H8')], motion: { kind: 'draw', ms: 250 } },
            { nodes: [path('M16 17H8')], motion: { kind: 'draw', ms: 250 } },
        ],
    },
    MessagesSquare: {
        stagger: 90,
        parts: [
            { nodes: [path('M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z')], fill: true, motion: { kind: 'lift', y: -1 } },
            { nodes: [path('M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1')], motion: { kind: 'lift', y: -1 } },
        ],
    },
    SquareCheck: {
        parts: [
            { nodes: [rect(3, 3, 18, 18, 2)], fill: true },
            { nodes: [path('m16 9-5.5 5.5L8 12')], motion: { kind: 'draw', ms: 350 } },
        ],
    },
    LayoutDashboard: {
        stagger: 50,
        parts: [
            { nodes: [rect(3, 3, 7, 9, 1)], fill: true, motion: { kind: 'pulse', scale: 0.88, origin: [6.5, 7.5] } },
            { nodes: [rect(14, 3, 7, 5, 1)], motion: { kind: 'pulse', scale: 0.88, origin: [17.5, 5.5] } },
            { nodes: [rect(14, 12, 7, 9, 1)], fill: true, motion: { kind: 'pulse', scale: 0.88, origin: [17.5, 16.5] } },
            { nodes: [rect(3, 16, 7, 5, 1)], motion: { kind: 'pulse', scale: 0.88, origin: [6.5, 18.5] } },
        ],
    },
    Search: {
        parts: [
            {
                nodes: [path('m21 21-4.34-4.34'), circle(11, 11, 8)],
                fill: [1],
                motion: { kind: 'rotate', deg: -12, origin: [11, 11] },
            },
        ],
    },
    Plus: {
        parts: [
            { nodes: [path('M5 12h14'), path('M12 5v14')], motion: { kind: 'rotate', deg: 90, origin: [12, 12] } },
        ],
    },
    CircleStar: {
        parts: [
            { nodes: [circle(12, 12, 10)], fill: true },
            {
                nodes: [path('M11.051 7.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z')],
                motion: { kind: 'swing', deg: 72, origin: [12, 12], ms: 450 },
            },
        ],
    },
    Image: {
        parts: [
            { nodes: [['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }]], fill: true },
            { nodes: [circle(9, 9, 2)], motion: { kind: 'lift', y: -1.25 } },
            { nodes: [path('m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21')] },
        ],
    },
    Hash: {
        stagger: 60,
        parts: [
            { nodes: [line(10, 3, 8, 21)], motion: { kind: 'draw', ms: 250 } },
            { nodes: [line(16, 3, 14, 21)], motion: { kind: 'draw', ms: 250 } },
            { nodes: [line(4, 9, 20, 9)], motion: { kind: 'draw', ms: 250 } },
            { nodes: [line(4, 15, 20, 15)], motion: { kind: 'draw', ms: 250 } },
        ],
    },
    BookText: {
        stagger: 80,
        parts: [
            { nodes: [path('M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20')], fill: true },
            { nodes: [path('M8 7h6')], motion: { kind: 'draw', ms: 250 } },
            { nodes: [path('M8 11h8')], motion: { kind: 'draw', ms: 250 } },
        ],
    },
    Briefcase: {
        parts: [
            { nodes: [path('M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16')], motion: { kind: 'lift', y: -1 } },
            { nodes: [rect(2, 6, 20, 14, 2)], fill: true },
        ],
    },
    ShoppingCart: {
        parts: [
            {
                nodes: [
                    path('m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18'),
                    path('M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25'),
                    circle(18, 20, 2),
                    circle(8, 20, 2),
                ],
                fill: [1],
                motion: { kind: 'lift', x: 1.5, y: 0 },
            },
        ],
    },
    Building: {
        stagger: 30,
        parts: [
            { nodes: [rect(4, 2, 16, 20, 2)], fill: true },
            { nodes: [path('M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3')] },
            { nodes: [path('M8 14h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M12 14h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M16 14h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M8 10h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M12 10h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M16 10h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M8 6h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M12 6h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M16 6h.01')], motion: { kind: 'appear', ms: 160 } },
        ],
    },
    Camera: {
        parts: [
            { nodes: [path('M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z')], fill: true },
            { nodes: [circle(12, 13, 3)], motion: { kind: 'pulse', scale: 1.25, origin: [12, 13] } },
        ],
    },
    Film: {
        stagger: 50,
        parts: [
            { nodes: [rect(3, 3, 18, 18, 2)], fill: true },
            { nodes: [path('M7 3v18'), path('M3 12h18'), path('M17 3v18')] },
            { nodes: [path('M3 7.5h4')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M3 16.5h4')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M17 7.5h4')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M17 16.5h4')], motion: { kind: 'draw', ms: 200 } },
        ],
    },
    BookOpenText: {
        stagger: 60,
        parts: [
            { nodes: [path('M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z')], fill: true },
            { nodes: [path('M12 5v16')] },
            { nodes: [path('M6 9h2')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M16 9h2')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M6 13h2')], motion: { kind: 'draw', ms: 200 } },
            { nodes: [path('M16 13h2')], motion: { kind: 'draw', ms: 200 } },
        ],
    },
    CircleLetterC: {
        parts: [
            { nodes: [circle(12, 12, 10)], fill: true },
            { nodes: [path('M15 9.354a4 4 0 1 0 0 5.292')], motion: { kind: 'draw', ms: 400 } },
        ],
    },
    Handshake: {
        parts: [
            {
                nodes: [
                    path('m11 17 2 2a1 1 0 1 0 3-3'),
                    path('m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4'),
                    path('m21 3 1 11h-2'),
                    path('M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3'),
                    path('M3 4h8'),
                ],
                motion: { kind: 'wiggle', deg: 6, origin: [12, 12], ms: 450 },
            },
        ],
    },
    ShieldCheck: {
        parts: [
            { nodes: [path('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z')], fill: true },
            { nodes: [path('m9 12 2 2 4-4')], motion: { kind: 'draw', ms: 350 } },
        ],
    },
    CircleGauge: {
        parts: [
            { nodes: [path('M15.6 2.7a10 10 0 1 0 5.7 5.7')] },
            { nodes: [circle(12, 12, 2)], fill: true },
            { nodes: [path('M13.4 10.6 19 5')], motion: { kind: 'swing', deg: -80, origin: [12, 12], ms: 500 } },
        ],
    },
    QrCode: {
        stagger: 25,
        parts: [
            { nodes: [rect(3, 3, 5, 5, 1)], fill: true },
            { nodes: [rect(16, 3, 5, 5, 1)], fill: true },
            { nodes: [rect(3, 16, 5, 5, 1)], fill: true },
            { nodes: [path('M21 16h-3a2 2 0 0 0-2 2v3')] },
            { nodes: [path('M12 7v3a2 2 0 0 1-2 2H7')] },
            { nodes: [path('M12 3h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M3 12h.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M16 12h1')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M21 12v.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M12 16v.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M21 21v.01')], motion: { kind: 'appear', ms: 160 } },
            { nodes: [path('M12 21v-1')], motion: { kind: 'appear', ms: 160 } },
        ],
    },
};
