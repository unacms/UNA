import { createContext, useContext } from 'react';
import { processColor } from 'react-native';

/**
 * Colour scheme for native NeoButtons on a surface whose brightness differs from the app's
 * theme, e.g. the header resting on a coloured band (`layout.header.band_scheme`). iOS passes it
 * to the Expo UI Host, so SwiftUI glass draws its chrome and label for that scheme. Free-standing
 * glass doesn't pick it from the backdrop the way system bars do. null = the app's own scheme.
 */
export type NeoButtonColorScheme = 'light' | 'dark' | null;

export const NeoButtonColorSchemeContext = createContext<NeoButtonColorScheme>(null);

export const useNeoButtonColorScheme = (): NeoButtonColorScheme => useContext(NeoButtonColorSchemeContext);

const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * The scheme whose label colour reads better on `color` (any RN colour): 'dark' (white labels)
 * when white has the higher WCAG contrast against it, else 'light'. null for an unknown colour.
 */
export function colorSchemeForBackground(color: unknown): NeoButtonColorScheme {
    const argb = processColor(color as Parameters<typeof processColor>[0]);
    if (typeof argb !== 'number') return null;
    const value = argb >>> 0;
    const luminance = 0.2126 * channel((value >> 16) & 0xff)
        + 0.7152 * channel((value >> 8) & 0xff)
        + 0.0722 * channel(value & 0xff);
    const onWhite = 1.05 / (luminance + 0.05);
    const onBlack = (luminance + 0.05) / 0.05;
    return onWhite >= onBlack ? 'dark' : 'light';
}
