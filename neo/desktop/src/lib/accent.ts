/**
 * A network's theme colour as the app's accent (design spec 8.3). Every shade keeps the site's
 * hue and chroma (clamped to sRGB) and moves only its OKLCH lightness until each pair it is used
 * in passes WCAG 2.x: white text on the fill 4.5, text 4.5, icons, rings, bars and the switch 3,
 * each measured on the surfaces tokens.css puts it on (the translucent ones alpha-blended over
 * theirs, as the page composites them). The fill takes the passing lightness nearest the site's
 * own, so a colour that already passes is used as it is. Every other shade takes the passing
 * lightness nearest NEO's shade for the same role (accent-700 light text, accent-600 light icon,
 * accent-300 dark text, accent-400 dark icon, accent-500 dark switch), so it is as light or dark
 * as NEO's and keeps NEO's margins instead of sitting on a threshold. A shade that no lightness
 * lets pass is null, and tokens.css keeps NEO's blue for it alone. NEO's own colour, and one with
 * almost no chroma (white, a grey) or none at all, keeps NEO's blue everywhere.
 */

export type Rgb = readonly [number, number, number];

/** The shades a site's colour gives, as #rrggbb; null keeps NEO's for that token. */
export type Accent = {
    /** --accent-fill (both themes) and, light, --selection-bar, --unread, --focus-ring, --switch-on */
    fill: string | null;
    fillHover: string | null;
    textLight: string | null;
    textDark: string | null;
    /** light --accent-icon */
    iconLight: string | null;
    /** dark --accent-icon, --selection-bar, --unread and --focus-ring */
    iconDark: string | null;
    /** dark --switch-on */
    switchDark: string | null;
};

const WHITE: Rgb = [255, 255, 255];
const NEUTRAL_900: Rgb = [24, 24, 27];
const NEUTRAL_100: Rgb = [244, 244, 245];
const NEUTRAL_800: Rgb = [39, 39, 42];
const INK_LIGHT: Rgb = [10, 10, 12]; // neutral-950
const INK_DARK: Rgb = [250, 250, 252]; // neutral-50

/** NEO's values (tokens.css), which a shade falls back to. */
export const NEO = {
    fill: [37, 99, 235] as Rgb, // accent-600
    fillHover: [29, 78, 216] as Rgb, // accent-700
    textLight: [29, 78, 216] as Rgb, // accent-700
    textDark: [147, 197, 253] as Rgb, // accent-300
    iconLight: [37, 99, 235] as Rgb,
    iconDark: [96, 165, 250] as Rgb, // accent-400
    switchDark: [59, 130, 246] as Rgb, // accent-500
};

/** `top` at `alpha` over an opaque `under`, in sRGB as the page composites. */
export function over(top: Rgb, alpha: number, under: Rgb): Rgb {
    return [0, 1, 2].map((i) => top[i]! * alpha + under[i]! * (1 - alpha)) as unknown as Rgb;
}

/**
 * The surfaces the shades are measured on (spec 1.3, 1.4). The sidebar is its 85% tint over the
 * darkest backdrop a light material shows, rgb(70 70 72), and over the brightest a dark one
 * shows, rgb(150 150 155); its current row adds the grey selection over that.
 */
export const SURFACES = {
    white: WHITE,
    neutral900: NEUTRAL_900,
    sidebarLight: over(NEUTRAL_100, 0.85, [70, 70, 72]),
    sidebarDark: over(NEUTRAL_800, 0.85, [150, 150, 155]),
    get rowLight(): Rgb {
        return over(INK_LIGHT, 0.08, this.sidebarLight);
    },
    get rowDark(): Rgb {
        return over(INK_DARK, 0.1, this.sidebarDark);
    },
    /** the dark grouped box: ink 6% over neutral-900 */
    groupedDark: over(INK_DARK, 0.06, NEUTRAL_900),
    /** --fill-control, under links in a bubble and a reacted button's count: ink 7% over white, 12% over neutral-900 */
    controlLight: over(INK_LIGHT, 0.07, WHITE),
    controlDark: over(INK_DARK, 0.12, NEUTRAL_900),
    /** --fill-control-hover: 10% and 15% */
    controlHoverLight: over(INK_LIGHT, 0.1, WHITE),
    controlHoverDark: over(INK_DARK, 0.15, NEUTRAL_900),
};

function channel(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The WCAG 2.x contrast ratio of two opaque colours. */
export function contrast(a: Rgb, b: Rgb): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function parseHex(hex: string | null | undefined): Rgb | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? '');
    if (!m) return null;
    const n = parseInt(m[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(rgb: Rgb): string {
    return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

type Lch = { l: number; c: number; h: number };

/** sRGB (0-255) to OKLCH (Björn Ottosson's OKLab). */
export function toOklch(rgb: Rgb): Lch {
    const [r, g, b] = rgb.map(channel) as unknown as Rgb;
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** OKLCH to linear sRGB, unclamped (out of gamut when a channel leaves 0..1). */
function linearOf({ l: L, c, h }: Lch): [number, number, number] {
    const A = c * Math.cos(h);
    const B = c * Math.sin(h);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

function inGamut(lin: [number, number, number]): boolean {
    return lin.every((v) => v >= -1e-6 && v <= 1 + 1e-6);
}

function encode(v: number): number {
    const c = Math.min(1, Math.max(0, v));
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
}

/** OKLCH to 8-bit sRGB, the chroma lowered until it fits sRGB (the hue and lightness kept). */
export function fromOklch(lch: Lch): Rgb {
    let c = lch.c;
    if (!inGamut(linearOf({ ...lch, c }))) {
        let lo = 0;
        let hi = c;
        for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            if (inGamut(linearOf({ ...lch, c: mid }))) lo = mid;
            else hi = mid;
        }
        c = lo;
    }
    const lin = linearOf({ ...lch, c });
    return [encode(lin[0]), encode(lin[1]), encode(lin[2])];
}

/** Colours with less chroma than this are no colour of a site's own: NEO's blue stays. */
export const MIN_CHROMA = 0.04;

const STEP = 0.0025;

/**
 * The sidebar's surfaces are assumed backdrops under a translucent material (spec 1.4), not
 * measured ones: a shade drawn on them gets this much above 3:1, so it does not sit on the line
 * (NEO's accent-600 is 3.13 on the light grey row, accent-400 3.41 on the dark one).
 */
export const MATERIAL_MARGIN = 0.1;
const ON_MATERIAL = 3 + MATERIAL_MARGIN;

/**
 * The colour of `base`'s hue and chroma at the lightness nearest `from` that passes `ok`, in
 * 8-bit sRGB as the page gets it; null when no lightness does.
 */
function nearestPassing(base: Lch, from: number, ok: (rgb: Rgb) => boolean): Rgb | null {
    // the starting lightness exactly, when it passes (the scan's grid may miss it)
    const start = fromOklch({ ...base, l: from });
    if (ok(start)) return start;
    let best: Rgb | null = null;
    let bestDistance = Infinity;
    for (let l = 0; l <= 1 + 1e-9; l += STEP) {
        const rgb = fromOklch({ ...base, l });
        if (!ok(rgb)) continue;
        const d = Math.abs(l - from);
        if (d < bestDistance) {
            best = rgb;
            bestDistance = d;
        }
    }
    return best;
}

const hex = (rgb: Rgb | null) => (rgb ? toHex(rgb) : null);
const lightnessOf = (rgb: Rgb) => toOklch(rgb).l;

/** The shades of a site's theme colour, or null to keep NEO's blue (spec 8.3). */
export function deriveAccent(colour: string | null | undefined): Accent | null {
    const rgb = parseHex(colour);
    if (!rgb) return null;
    // NEO's own blue is NEO's palette, the same whether the site sets it or not
    if (toHex(rgb) === toHex(NEO.fill)) return null;
    const base = toOklch(rgb);
    if (base.c < MIN_CHROMA) return null;
    const { white, neutral900, sidebarLight, sidebarDark, rowLight, rowDark, groupedDark, controlLight, controlDark, controlHoverLight, controlHoverDark } = SURFACES;

    // the fill: white on it, it on white and neutral-900 (the raised and content surfaces of
    // both themes), and it as the light selection bar on its own 12% tint over white
    const fill = nearestPassing(base, base.l, (c) => contrast(white, c) >= 4.5 && contrast(c, neutral900) >= 3 && contrast(c, over(c, 0.12, white)) >= 3);
    const fillNow = fill ?? NEO.fill;
    const fillHover = fill ? fromOklch({ ...toOklch(fill), c: base.c, l: toOklch(fill).l - 0.06 }) : null;
    const selectedLight = over(fillNow, 0.12, white);

    // light text: on content, on the selection, and on the control fill (a link in a bubble,
    // a reacted button's count), hovered or not
    const textLight = nearestPassing(base, lightnessOf(NEO.textLight), (c) => contrast(c, white) >= 4.5 && contrast(c, selectedLight) >= 4.5 && contrast(c, controlLight) >= 4.5 && contrast(c, controlHoverLight) >= 4.5);
    const iconLight = nearestPassing(base, lightnessOf(NEO.iconLight), (c) => contrast(c, sidebarLight) >= ON_MATERIAL && contrast(c, rowLight) >= ON_MATERIAL);

    // dark: the icon is also the selection bar on its own 18% tint, the unread dot and the ring
    const iconDark = nearestPassing(base, lightnessOf(NEO.iconDark), (c) => contrast(c, neutral900) >= 3 && contrast(c, sidebarDark) >= ON_MATERIAL && contrast(c, rowDark) >= ON_MATERIAL && contrast(c, over(c, 0.18, neutral900)) >= 3);
    const selectedDark = over(iconDark ?? NEO.iconDark, 0.18, neutral900);
    const textDark = nearestPassing(base, lightnessOf(NEO.textDark), (c) => contrast(c, neutral900) >= 4.5 && contrast(c, selectedDark) >= 4.5 && contrast(c, controlDark) >= 4.5 && contrast(c, controlHoverDark) >= 4.5);
    const switchDark = nearestPassing(base, lightnessOf(NEO.switchDark), (c) => contrast(c, groupedDark) >= 3 && contrast(white, c) >= 3);

    return {
        fill: hex(fill),
        fillHover: hex(fillHover),
        textLight: hex(textLight),
        textDark: hex(textDark),
        iconLight: hex(iconLight),
        iconDark: hex(iconDark),
        switchDark: hex(switchDark),
    };
}

/** The custom properties tokens.css reads (`var(--site-…, NEO's)`), by shade. */
export const ACCENT_PROPERTIES: Record<keyof Accent, string> = {
    fill: '--site-fill',
    fillHover: '--site-fill-hover',
    textLight: '--site-text-light',
    textDark: '--site-text-dark',
    iconLight: '--site-icon-light',
    iconDark: '--site-icon-dark',
    switchDark: '--site-switch-dark',
};

/** Write a site's shades on <html> (or take them off with null): tokens.css picks them per theme. */
export function applyAccent(accent: Accent | null, root: HTMLElement = document.documentElement): void {
    for (const key of Object.keys(ACCENT_PROPERTIES) as (keyof Accent)[]) {
        const value = accent?.[key];
        if (value) root.style.setProperty(ACCENT_PROPERTIES[key], value);
        else root.style.removeProperty(ACCENT_PROPERTIES[key]);
    }
}
