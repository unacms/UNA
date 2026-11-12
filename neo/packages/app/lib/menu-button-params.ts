/**
 * UNA's button style of a menu (`button_style` in the menu's API; Studio > Navigation > a menu > Button style,
 * `BxDolMenu::BUTTON_STYLE_*`) as NeoButton's style and the style of the menu's primary items.
 */
const UNA_MENU_BUTTON_STYLES: Readonly<Record<string, { style: string; primaryStyle: string }>> = {
    regular: { style: 'bordered', primaryStyle: 'borderedProminent' },
    glass: { style: 'glass', primaryStyle: 'glassProminent' },
    plain: { style: 'plain', primaryStyle: 'borderedProminent' },
};

/** UNA's button sizes of a menu (`button_size`, `BxDolMenu::BUTTON_SIZE_*`): NeoButton's control sizes of the same names. */
const UNA_MENU_BUTTON_SIZES = new Set(['mini', 'small', 'regular', 'large']);

/** The style of a menu's primary items beside buttons of NeoButton `style`. */
function primaryStyleFor(style: unknown): string {
    return style === 'glass' ? 'glassProminent' : 'borderedProminent';
}

/**
 * A menu's `params` with its button style and size settled between the call site and UNA.
 *
 * UNA says per menu how its buttons look (`button_style`) and how big they are (`button_size`); empty is automatic.
 * For each of the two, the first that is set wins:
 *
 * 1. what the call site fixes: `button_style` (or the legacy `button_variant`), `button_size`;
 * 2. what UNA says for the menu;
 * 3. what the call site uses when UNA is automatic: `button_style_default` (or `button_variant_default`, a legacy
 *    variant, for a menu that still draws its buttons through the legacy adapter), `button_size_default`.
 *
 * So a menu follows UNA when its call site names no style, or names one only as a default. UNA's style is set
 * as `button_style` and as `button_variant`, for the items that still draw through the legacy adapter. The
 * `_default` keys do not stay in the result. Returns `params` itself when there is nothing to change.
 */
export function withMenuButtonParams(
    params: Record<string, any> | null | undefined,
    menu: { button_style?: unknown; button_size?: unknown } | null | undefined
): Record<string, any> {
    const base = params || {};
    const add = { ...styleParams(base, menu), ...sizeParams(base, menu) };
    const hasDefaults = DEFAULT_KEYS.some((key) => key in base);
    if (!hasDefaults && Object.keys(add).length === 0) return base;

    const result: Record<string, any> = { ...base, ...add };
    for (const key of DEFAULT_KEYS) delete result[key];
    return result;
}

/** The call site's keys for a menu UNA leaves on Automatic. They are settled here and do not stay in the result. */
const DEFAULT_KEYS = ['button_style_default', 'button_variant_default', 'button_size_default'] as const;

/** The style params to set: none when the call site fixes a style, else UNA's, else the call site's default. */
function styleParams(base: Record<string, any>, menu: { button_style?: unknown } | null | undefined): Record<string, any> {
    if (base.button_style != null || base.button_variant != null) return {};

    const una = typeof menu?.button_style === 'string' ? UNA_MENU_BUTTON_STYLES[menu.button_style] : undefined;
    if (una) {
        return {
            button_style: una.style,
            // Items that draw through the legacy adapter (likes, favorites, reports…) read `button_variant`, which
            // takes a NeoButton style too: without it they would keep the app's default look in a menu UNA styles.
            button_variant: una.style,
            button_primary_style: base.button_primary_style ?? una.primaryStyle,
        };
    }

    const style = base.button_style_default;
    if (style != null) return { button_style: style, button_primary_style: base.button_primary_style ?? primaryStyleFor(style) };

    return base.button_variant_default == null ? {} : { button_variant: base.button_variant_default };
}

/** The size param to set: none when the call site fixes a size, else UNA's, else the call site's default. */
function sizeParams(base: Record<string, any>, menu: { button_size?: unknown } | null | undefined): Record<string, any> {
    if (base.button_size != null) return {};

    const una = typeof menu?.button_size === 'string' && UNA_MENU_BUTTON_SIZES.has(menu.button_size) ? menu.button_size : undefined;
    const size = una ?? base.button_size_default;
    return size == null ? {} : { button_size: size };
}
