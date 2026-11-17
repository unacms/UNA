/**
 * A menu whose items have groups is drawn as sections (the account's Settings: the phone list's cards and the desktop
 * sidebar): the account's items first, then the current profile's under its name, the items without a group, and the
 * dangerous ones last (deleting the account). UNA says an item's group in Studio > Navigation > an item > "Group in the
 * apps" (`sys_menu_items.group_name`, the item's `group`); an older UNA keeps it in the item's `config`
 * (`{"group":"account"}`).
 */
export const MENU_GROUPS = ['account', 'profile', 'other', 'danger'] as const;
export type MenuGroup = (typeof MENU_GROUPS)[number];

type GroupedItem = { group?: unknown; config?: unknown } | null | undefined;

function asMenuGroup(value: unknown): MenuGroup | null {
    return typeof value === 'string' && value !== 'other' && (MENU_GROUPS as readonly string[]).includes(value) ? (value as MenuGroup) : null;
}

/** The `group` key of an item's `config`, which UNA sends as a JSON string. */
function configGroup(config: unknown): unknown {
    if (config && typeof config === 'object') return (config as { group?: unknown }).group;
    if (typeof config !== 'string' || !config.includes('group')) return null;
    try {
        return JSON.parse(config)?.group;
    } catch {
        return null;
    }
}

/** An item's group (`account`, `profile` or `danger`); `null` when it has none. */
export function getMenuItemGroup(item: GroupedItem): MenuGroup | null {
    return asMenuGroup(item?.group) ?? asMenuGroup(configGroup(item?.config));
}

/** True when the menu's items say which group they belong to, so the menu is drawn in sections. */
export function hasMenuGroups(items: GroupedItem[]): boolean {
    return (items || []).some((item) => getMenuItemGroup(item) !== null);
}

/**
 * The entries in sections, in the order the sections are shown; an entry without a group goes to `other`, and a
 * section without entries is left out. `groupOf` says an entry's group (`getMenuItemGroup` of its menu item).
 */
export function groupMenuEntries<T>(entries: T[], groupOf: (entry: T) => MenuGroup | null): { group: MenuGroup; entries: T[] }[] {
    const byGroup = new Map<MenuGroup, T[]>();
    for (const entry of entries || []) {
        const group = groupOf(entry) ?? 'other';
        byGroup.set(group, [...(byGroup.get(group) || []), entry]);
    }
    return MENU_GROUPS.filter((group) => byGroup.has(group)).map((group) => ({ group, entries: byGroup.get(group) || [] }));
}
