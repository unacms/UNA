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
 * 3. what the call site uses when UNA is automatic: `button_style_default`, `button_size_default`.
 *
 * So a menu follows UNA when its call site names no style, or names one only as a default. The `_default` keys
 * do not stay in the result. Returns `params` itself when there is nothing to change.
 */
export function withMenuButtonParams(
    params: Record<string, any> | null | undefined,
    menu: { button_style?: unknown; button_size?: unknown } | null | undefined
): Record<string, any> {
    const base = params || {};
    const una = typeof menu?.button_style === 'string' ? UNA_MENU_BUTTON_STYLES[menu.button_style] : undefined;
    const unaSize = typeof menu?.button_size === 'string' && UNA_MENU_BUTTON_SIZES.has(menu.button_size) ? menu.button_size : undefined;
    const { button_style_default: defaultStyle, button_size_default: defaultSize, ...rest } = base;

    const fixedStyle = base.button_style != null || base.button_variant != null;
    const style = fixedStyle ? undefined : (una?.style ?? defaultStyle ?? undefined);
    const size = base.button_size != null ? undefined : (unaSize ?? defaultSize ?? undefined);

    const hasDefaults = 'button_style_default' in base || 'button_size_default' in base;
    if (style == null && size == null && !hasDefaults) return base;

    const result = hasDefaults ? rest : { ...base };
    if (style != null) {
        result.button_style = style;
        result.button_primary_style ??= una ? una.primaryStyle : primaryStyleFor(style);
    }
    if (size != null) result.button_size = size;
    return result;
}
