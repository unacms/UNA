/**
 * NeoButton control scale + legacy vocabulary — single source of truth.
 *
 * Pure data, no React: the resolver, the legacy mapper and the button adapters
 * all read the size/style mapping from here, so the migration tables (legacy
 * `xs/sm/base/lg/xl`, legacy variants) live in one place.
 *
 * Heights stay in the theme (`neo_button.controlSizes`); the hit area is
 * derived from them with `hitSlopForHeight` so every control reaches
 * `MIN_TARGET`. The resolver's dev-only `checkScaleOnce` warns when a theme
 * size drifts (target below 44, or a value with no utility class).
 */
import type { NeoButtonStyle, NeoControlSize } from 'app/design/controls/neo-button/neo-button.types';

/** Minimum touch / click target (pt / px), WCAG 2.5.5 + HIG. */
export const MIN_TARGET = 44;

/** Hit area per side so a control of `height` reaches MIN_TARGET: mini 28 → 8, small 36 → 4, 44+ → 0. */
export const hitSlopForHeight = (height: number) => Math.max(0, Math.ceil((MIN_TARGET - height) / 2));

/** Legacy `button_sizes` keys (+ UNA `md`) → Neo controlSize. */
export const LEGACY_TO_CONTROL_SIZE: Readonly<Record<string, NeoControlSize>> = {
    xs: 'mini',
    sm: 'small',
    base: 'regular',
    md: 'regular',
    lg: 'large',
    xl: 'xlarge',
};

export const NEO_CONTROL_SIZES: ReadonlySet<string> = new Set(['mini', 'small', 'regular', 'large', 'xlarge']);

/** Neo or legacy size → Neo controlSize. `''` / unknown / nullish → undefined (theme default). */
export function toControlSize(size: unknown): NeoControlSize | undefined {
    if (typeof size !== 'string' || !size) return undefined;
    if (NEO_CONTROL_SIZES.has(size)) return size as NeoControlSize;
    return LEGACY_TO_CONTROL_SIZE[size];
}

/**
 * Legacy variant → best visual Neo match (migration spec §2). Legacy keys win
 * over same-named Neo styles (`link`). `accent` has no Neo style: the mapper
 * adds the accent wash on top of `bordered` (see `legacyToNeoButtonProps`).
 */
export const LEGACY_VARIANT_TO_NEO: Readonly<Record<string, { style: NeoButtonStyle; role?: 'destructive' }>> = {
    default: { style: 'bordered' },
    secondary: { style: 'bordered' },
    outline: { style: 'bordered' },
    primary: { style: 'borderedProminent' },
    danger: { style: 'borderedProminent', role: 'destructive' },
    text: { style: 'borderless' },
    link: { style: 'borderless' },
    ghost: { style: 'plain' },
    accent: { style: 'bordered' },
};

export const NEO_STYLES: ReadonlySet<string> = new Set([
    'plain', 'bordered', 'borderedProminent', 'borderless', 'link', 'glass', 'glassProminent',
]);

/**
 * `undefined`/`null` → `{}` (NeoButton default style); legacy key → table;
 * Neo name → itself; `''`, `false`, `custom`, `group-item`, `none`, unknown → `plain`
 * (legacy applied no classes for those).
 */
export function toNeoStyle(variant: unknown): { style?: NeoButtonStyle; role?: 'destructive' } {
    if (variant === undefined || variant === null) return {};
    if (typeof variant === 'string' && LEGACY_VARIANT_TO_NEO[variant]) return { ...LEGACY_VARIANT_TO_NEO[variant] };
    if (typeof variant === 'string' && NEO_STYLES.has(variant)) return { style: variant as NeoButtonStyle };
    return { style: 'plain' };
}
