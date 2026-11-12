/**
 * A profile badge's colours: its colour as a light tint behind text in a darker (light theme) or
 * lighter (dark theme) shade of the same hue, the text at least 4.5:1 against the tint (WCAG AA)
 * whatever colour the site gave the badge. The tint is opaque, so a row's hover or selection
 * fill behind the pill does not change the contrast.
 */

type Rgb = readonly [number, number, number];

/** The surfaces the pills sit on: --bg-content in each theme (neutral-0, neutral-900). */
const LIGHT_SURFACE: Rgb = [255, 255, 255];
const DARK_SURFACE: Rgb = [24, 24, 27];
/** How much of the badge's colour the tint has. */
const LIGHT_TINT = 0.14;
const DARK_TINT = 0.24;
/** 4.5:1 with a little room for rounding to whole channel values. */
export const BADGE_MIN_CONTRAST = 4.6;
/** Under Increase Contrast, as the app's other secondary text darkens: 7:1 (WCAG AAA). */
export const BADGE_MORE_CONTRAST = 7.1;
/** A badge with no colour: zinc-500. */
const NEUTRAL: Rgb = [113, 113, 122];

/** Per theme: the tint, its text, and the text under Increase Contrast (`more`). */
export type BadgeColors = { light: { bg: string; fg: string; more: string }; dark: { bg: string; fg: string; more: string } };

export function parseHex(hex: string | null | undefined): Rgb | null {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex ?? '')?.[1];
    if (!m) return null;
    const h = m.length === 3 ? [...m].map((c) => c + c).join('') : m;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(c: Rgb): string {
    return `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function round(c: Rgb): Rgb {
    return [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
}

function luminance(c: Rgb): number {
    const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/** WCAG 2 contrast ratio of two colours. */
export function contrast(a: Rgb | string, b: Rgb | string): number {
    const x = typeof a === 'string' ? (parseHex(a) ?? NEUTRAL) : a;
    const y = typeof b === 'string' ? (parseHex(b) ?? NEUTRAL) : b;
    const lx = luminance(x);
    const ly = luminance(y);
    return (Math.max(lx, ly) + 0.05) / (Math.min(lx, ly) + 0.05);
}

/** The colour moved toward black or white just far enough to reach the contrast against bg. */
function shade(color: Rgb, toward: Rgb, bg: Rgb, min: number = BADGE_MIN_CONTRAST): Rgb {
    for (let t = 0; t <= 1.0001; t += 0.02) {
        const c = round(mix(color, toward, t));
        if (contrast(c, bg) >= min) return c;
    }
    return toward;
}

const cache = new Map<string, BadgeColors>();

export function badgeColors(hex: string | null | undefined): BadgeColors {
    const key = hex ?? '';
    const known = cache.get(key);
    if (known) return known;

    const color = parseHex(hex) ?? NEUTRAL;
    const lightBg = round(mix(LIGHT_SURFACE, color, LIGHT_TINT));
    const darkBg = round(mix(DARK_SURFACE, color, DARK_TINT));
    const result: BadgeColors = {
        light: { bg: toHex(lightBg), fg: toHex(shade(color, [0, 0, 0], lightBg)), more: toHex(shade(color, [0, 0, 0], lightBg, BADGE_MORE_CONTRAST)) },
        dark: { bg: toHex(darkBg), fg: toHex(shade(color, [255, 255, 255], darkBg)), more: toHex(shade(color, [255, 255, 255], darkBg, BADGE_MORE_CONTRAST)) },
    };
    cache.set(key, result);
    return result;
}
