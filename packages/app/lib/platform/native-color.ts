import { processColor } from 'react-native';

/**
 * Any RN color (hex, rgb()/rgba(), named, a resolved Uniwind token) →
 * `#RRGGBBAA` for Expo UI / SwiftUI, which takes hex but not CSS functions
 * or variables. `alpha` (0–1) replaces the color's own alpha when given.
 */
export function toHexColor(color: unknown, alpha?: number): string | null {
    const argb = processColor(color as Parameters<typeof processColor>[0]);
    if (typeof argb !== 'number') return null;
    const value = argb >>> 0;
    const rgb = (value & 0xffffff).toString(16).padStart(6, '0');
    const a = alpha == null
        ? (value >>> 24) & 0xff
        : Math.round(Math.min(1, Math.max(0, alpha)) * 255);
    return `#${rgb}${a.toString(16).padStart(2, '0')}`;
}
