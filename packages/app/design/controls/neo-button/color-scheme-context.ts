import { createContext, useContext } from 'react';
import { processColor } from 'react-native';

/**
 * Colour scheme for NeoButtons on a surface whose brightness differs from the app's theme, e.g.
 * the header resting on a coloured band (`layout.header.band_scheme`). iOS passes it to the Expo
 * UI Host, so SwiftUI glass draws its chrome and label for that scheme: free-standing glass
 * doesn't pick it from the backdrop the way system bars do. On web the button's root becomes a
 * `.light` / `.dark` scope with that scheme's colour tokens (design/styles/global.css).
 * null = the app's own scheme.
 */
export type NeoButtonColorScheme = 'light' | 'dark' | null;

export const NeoButtonColorSchemeContext = createContext<NeoButtonColorScheme>(null);

export const useNeoButtonColorScheme = (): NeoButtonColorScheme => useContext(NeoButtonColorSchemeContext);

/**
 * The scheme a web button draws with on that surface. A selected button takes the opposite one:
 * in the surface's own scheme its toggled fill sinks into the band (a dark accent wash on a
 * bright band), while the inverse stands out from its neighbours, as a selected segment does.
 * iOS needs no flip: selected glass takes its fill and label from the app's own tokens.
 */
export function selectedColorScheme(scheme: NeoButtonColorScheme, selected: boolean): NeoButtonColorScheme {
    if (!scheme || !selected) return scheme;
    return scheme === 'dark' ? 'light' : 'dark';
}

/** Any RN colour as unsigned 0xAARRGGBB; null when it can't be parsed. */
function toArgb(color: unknown): number | null {
    const value = processColor(color as Parameters<typeof processColor>[0]);
    return typeof value === 'number' ? value >>> 0 : null;
}

/** True for a colour that paints something: parsed, and not fully transparent. */
export function isVisibleColor(color: unknown): boolean {
    const argb = toArgb(color);
    return argb !== null && argb >>> 24 > 0;
}

const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * The scheme whose label colour reads better on `color` (any RN colour): 'dark' (white labels)
 * when white has the higher WCAG contrast against it, else 'light'. A translucent `color` is
 * first composited over `backdrop`, the opaque colour showing through it. null for an unknown or
 * fully transparent colour, or a translucent one without a backdrop.
 */
export function colorSchemeForBackground(color: unknown, backdrop?: unknown): NeoButtonColorScheme {
    const fg = toArgb(color);
    if (fg === null) return null;
    const alpha = (fg >>> 24) / 255;
    if (alpha === 0) return null;
    const bg = alpha < 1 ? toArgb(backdrop) : fg;
    if (bg === null) return null;
    const mix = (shift: number) => alpha * ((fg >> shift) & 0xff) + (1 - alpha) * ((bg >> shift) & 0xff);
    const luminance = 0.2126 * channel(mix(16)) + 0.7152 * channel(mix(8)) + 0.0722 * channel(mix(0));
    const onWhite = 1.05 / (luminance + 0.05);
    const onBlack = (luminance + 0.05) / 0.05;
    return onWhite >= onBlack ? 'dark' : 'light';
}
