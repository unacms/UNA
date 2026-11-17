/**
 * A card's buttons as UNA's site shows them. UNA sends a card's snippet meta menu as `meta.items`: counts and other
 * text, and the buttons the site draws on the card (a friend or follow toggle, Join, a suggestion's Add and Ignore),
 * each an element with its own `data.type`. A list type can name the actions it wants (getUnitActionNames); where it
 * names none, or UNA sends none of those it names, the card takes UNA's buttons in the menu's order: the first two
 * (UNA's site shows two as well), and a suggestion's Ignore as the dismiss button. `getUnitMenuItems` in
 * `default/functions.js` draws what pickUnitActions returns.
 */
const ACTION_TYPES = new Set(['connections', 'connections_ext', 'recommendation']);

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
    return typeof type === 'string' && ACTION_TYPES.has(type);
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

/** The actions a list wants on its cards, by their names in UNA's snippet meta menu; '' for none. */
export type UnitActionNames = { primary: string; secondary: string; dismiss: string };

/** People's and organizations' lists (and the connections' lists, module `system`) that name their own actions. */
const PROFILE_LIST_ACTIONS: Record<string, Partial<UnitActionNames>> = {
    person_friends_recommendations: { primary: 'befriend', dismiss: 'ignore-befriend' },
    browse_friend_requests: { primary: 'befriend', secondary: 'unfriend' },
    person_friends_suggestion: { primary: 'befriend' },
    person_friend_requested: { primary: 'unfriend' },
    person_following_recommendations: { primary: 'subscribe', dismiss: 'ignore-subscribe' },
    person_followers: { primary: 'subscribe', secondary: 'unsubscribe' },
    person_following: { primary: 'unsubscribe' },
};

/** A module whose cards are profiles' (the connections' lists come as `system`). */
export function isProfileUnitModule(moduleName: unknown): boolean {
    return moduleName === 'bx_persons' || moduleName === 'bx_organizations' || moduleName === 'system';
}

export function getUnitActionNames(unitType: unknown, moduleName: unknown): UnitActionNames {
    if (isProfileUnitModule(moduleName)) {
        const named = typeof unitType === 'string' ? PROFILE_LIST_ACTIONS[unitType] : undefined;
        return { primary: named?.primary ?? '', secondary: named?.secondary ?? '', dismiss: named?.dismiss ?? '' };
    }
    // contexts (groups, events, spaces ...): joining, or following a channel
    const follows = moduleName === 'bx_channels';
    return {
        primary: follows ? 'subscribe' : 'join',
        secondary: follows ? 'unsubscribe' : 'leave',
        dismiss: unitType === 'context_recommendations' ? 'ignore-join' : '',
    };
}

/**
 * The card's buttons out of UNA's items: the ones the list names (`fixedPrimary`: a button the list makes itself,
 * Friends' Message), else UNA's own (getSiteUnitActions). A lone second button takes the first place.
 */
export function pickUnitActions<T extends UnitMetaItem, P = T>(
    items: readonly T[] | null | undefined,
    names: UnitActionNames,
    fixedPrimary: P | null = null,
): { primary: T | P | null; secondary: T | null; dismiss: T | null } {
    const list = Array.isArray(items) ? items : [];
    const byName = (name: string): T | null => (name ? list.find((item) => item?.name === name) ?? null : null);

    let primary: T | P | null = fixedPrimary ?? byName(names.primary);
    let secondary = byName(names.secondary);
    let dismiss = byName(names.dismiss);

    if (!primary && !secondary) {
        const site = getSiteUnitActions(list);
        primary = site.primary;
        secondary = site.secondary;
        dismiss = dismiss ?? site.dismiss;
    }
    if (!primary && secondary) {
        primary = secondary;
        secondary = null;
    }
    return { primary, secondary, dismiss };
}
