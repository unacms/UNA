/**
 * A card's buttons as UNA's site shows them. UNA sends a card's snippet meta menu as `meta.items`: counts and other
 * text, and the buttons the site draws on the card (a friend or follow toggle, Join, a suggestion's Add and Ignore),
 * each an element with its own `data.type`. A list type can name the actions it wants (`getUnitMenuItems` in
 * `default/functions.js`); where it names none, or UNA sends none of those it names, the card takes UNA's buttons in
 * the menu's order: the first two (UNA's site shows two as well), and a suggestion's Ignore as the dismiss button.
 */
const ACTION_TYPES = ['connections', 'connections_ext', 'recommendation'];

/** UNA's snippet meta menu shows this many buttons on a card (`_iButtonsMax`). */
export const UNIT_ACTIONS_MAX = 2;

export type UnitMetaItem = {
    name?: string;
    data?: { type?: unknown; a?: unknown; [key: string]: unknown } | null;
} | null | undefined;

export type SiteUnitActions<T> = { primary: T | null; secondary: T | null; dismiss: T | null };

/** A meta item UNA sends as a button: a connection (toggle or one action) or a suggestion's action. */
export function isUnitActionItem(item: UnitMetaItem): boolean {
    const type = item?.data?.type;
    return typeof type === 'string' && ACTION_TYPES.includes(type);
}

/** A suggestion's Ignore: the card's dismiss button, not one of its two actions. */
export function isUnitDismissItem(item: UnitMetaItem): boolean {
    return isUnitActionItem(item) && item?.data?.type === 'recommendation' && item?.data?.a === 'ignore';
}

export function getSiteUnitActions<T extends UnitMetaItem>(items: readonly T[] | null | undefined): SiteUnitActions<T> {
    const list = Array.isArray(items) ? items : [];
    const actions = list.filter((item) => isUnitActionItem(item) && !isUnitDismissItem(item)).slice(0, UNIT_ACTIONS_MAX);
    return {
        primary: actions[0] ?? null,
        secondary: actions[1] ?? null,
        dismiss: list.find((item) => isUnitDismissItem(item)) ?? null,
    };
}
