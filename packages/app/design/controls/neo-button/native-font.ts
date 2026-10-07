/**
 * Label font for the native (Expo UI) NeoButton on iOS and Android, from the
 * same theme classes as the JS button: size from `controlSizes.*.font`
 * (`text-base` …), weight from the style's text classes (`font-medium` …),
 * family from the app font setting (customization/config/fonts.js).
 */
import { Platform } from 'react-native';
import { nativeFontFamily } from 'app/design/fonts/font-choice';

export type NativeFontWeight =
    | 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium'
    | 'semibold' | 'bold' | 'heavy' | 'black';

/**
 * The app's main font family on this device, or null when it is the platform
 * UI font (SF Pro / the Android default): the native button keeps its own.
 */
export const NATIVE_BUTTON_FONT_FAMILY: string | null = (() => {
    const family = nativeFontFamily('main', Platform.OS === 'android' ? 'android' : 'ios');
    return family === 'System' || family === 'sans-serif' ? null : family;
})();

// Fallback sizes when `controlSizes.*.font` has no text size class.
const FONT_SIZE_PT: Record<string, number> = { mini: 14, small: 14, regular: 16, large: 16, extraLarge: 18 };

export function fontSizeFromClass(fontCls: unknown, controlSize: string) {
    if (typeof fontCls === 'string') {
        if (fontCls.includes('text-xl')) return 20;
        if (fontCls.includes('text-lg')) return 18;
        if (fontCls.includes('text-base')) return 16;
        if (fontCls.includes('text-sm')) return 14;
        if (fontCls.includes('text-xs')) return 12;
    }
    return FONT_SIZE_PT[controlSize] ?? 16;
}

const FONT_WEIGHT_FROM_CLASS: [string, NativeFontWeight][] = [
    ['font-extralight', 'ultraLight'],
    ['font-thin', 'thin'],
    ['font-light', 'light'],
    ['font-semibold', 'semibold'],
    ['font-extrabold', 'heavy'],
    ['font-black', 'black'],
    ['font-bold', 'bold'],
    ['font-medium', 'medium'],
    ['font-normal', 'regular'],
];

export function fontWeightFromClass(cls: unknown): NativeFontWeight | null {
    if (typeof cls !== 'string' || !cls) return null;
    for (const [token, weight] of FONT_WEIGHT_FROM_CLASS) {
        if (cls.includes(token)) return weight;
    }
    return null;
}

/** Compose `fontWeight` for a SwiftUI-style weight name. */
export const COMPOSE_FONT_WEIGHT: Record<NativeFontWeight, '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'> = {
    thin: '100',
    ultraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
};
