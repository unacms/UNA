// Props shared by edge-blur.tsx (fallback wash) and edge-blur.ios.tsx (native blur).

import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { View } from 'app/design/view';

/** Settings slot: `layout.header.fade_blur`, `layout.footer_fade_blur` or `layout.tabbar_fade_blur`. */
export type EdgeBlurSlot = 'header' | 'footer' | 'tabbar';

export type EdgeBlurConfig = {
    /** SwiftUI material sampled behind the edge. */
    material?: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'ultraThick' | 'bar';
    /** Fraction of the height (from the edge) that stays fully blurred before easing out. */
    hold?: number;
    /**
     * Peak strength at the edge, 0–1 (default 1): scales the whole mask, so the
     * blur and `tint` both get more see-through. The gentlest overall knob.
     */
    opacity?: number;
    /** Gradient samples along the easing curve (more = smoother, 14 is plenty). */
    steps?: number;
    /** Extra px the blur reaches past the element it backs (header / footer). */
    extend?: number;
    /**
     * Opacity of the page `bg-background` color layered over the material, per
     * color scheme. The system materials carry their own gray tint; this pulls
     * the blur back to the page color (e.g. black in dark mode).
     */
    tint?: { light?: number; dark?: number };
};

export type EdgeBlurProps = {
    /** Edge the blur is anchored to; it fades toward the opposite side. */
    edge?: 'top' | 'bottom';
    /** Native blur settings. Missing → the `fallbackClassName` wash. */
    config?: EdgeBlurConfig | null;
    /** Tailwind wash used on web / Android, or when `config` is unset. */
    fallbackClassName?: string;
    style?: StyleProp<ViewStyle>;
};

/**
 * A container painted with a gradient wash (composer footers, in-panel
 * headers). iOS swaps `washClassName` for a native `EdgeBlur` when `config`
 * is set; elsewhere the container renders exactly `className + washClassName`.
 */
export type EdgeBlurViewProps = ComponentProps<typeof View> & {
    edge?: 'top' | 'bottom';
    config?: EdgeBlurConfig | null;
    /** Static Tailwind literal (`bg-linear-to-t from-… to-transparent`) so Uniwind can scan it. */
    washClassName?: string;
};
