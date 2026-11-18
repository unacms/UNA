/**
 * A section that opens on its own menu (UNA's `section_nav_small` = `list`: the account's Settings) draws that menu in
 * sections, on the phone list's cards and in the desktop sidebar. UNA makes them with the menu's structure: a top-level
 * item without a link that has subitems is a section, headed by its title (Settings: "Account", and the current
 * profile, whose title UNA fills with the profile's name), over its subitems. The items between sections are a section
 * without a heading. An item whose app config says `"danger": true` (deleting the account) is a section of its own, in
 * the destructive colour.
 *
 * The section parents are lifted out first (`flattenMenuSections`): their subitems take their place, each marked with
 * its `section`, so tabs, routes and the first page see one flat list, as the site's tab row shows it.
 *
 * An older UNA had no parents and gave items a group instead (`group`, before that the `group` key of `config`:
 * `account`, `profile`, `danger`); its sections come in that order, the items without a group before the dangerous ones.
 */
export type MenuSectionTag = { key: string; title: string };

export type MenuSectionItem = {
    name?: string;
    title?: string;
    link?: string;
    url?: string;
    config?: unknown;
    group?: unknown;
    subitems?: MenuSectionItem[];
    section?: MenuSectionTag;
    [key: string]: unknown;
};

export type MenuSection<T> = { key: string; title: string; danger: boolean; entries: T[] };

/** The headings an older UNA's groups get, which it did not send: "Account" and the current profile's name. */
export type LegacyGroupHeadings = { account?: string; profile?: string };

const LEGACY_GROUPS = ['account', 'profile', 'other', 'danger'] as const;
type LegacyGroup = (typeof LEGACY_GROUPS)[number];

/** An item's app `config`, which UNA sends as a JSON string. */
function itemConfig(item: MenuSectionItem | null | undefined): Record<string, unknown> | null {
    const config = item?.config;
    if (config && typeof config === 'object') return config as Record<string, unknown>;
    if (typeof config !== 'string' || !config.trim().startsWith('{')) return null;
    try {
        const parsed = JSON.parse(config);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

/** Whether the item opens a page: UNA sends a parent that only holds its subitems without a link (or `javascript:`). */
export function hasItemLink(item: MenuSectionItem | null | undefined): boolean {
    const link = String(item?.link || item?.url || '');
    return link !== '' && !link.startsWith('javascript:');
}

/** A top-level item that heads a section: no link of its own, and subitems. */
export function isMenuSectionParent(item: MenuSectionItem | null | undefined): boolean {
    return !!item && !hasItemLink(item) && Array.isArray(item.subitems) && item.subitems.length > 0;
}

function legacyGroup(item: MenuSectionItem | null | undefined): LegacyGroup | null {
    const value = typeof item?.group === 'string' && item.group ? item.group : itemConfig(item)?.group;
    return value === 'account' || value === 'profile' || value === 'danger' ? value : null;
}

/** An item that does what can't be undone (deleting the account), drawn in the destructive colour. */
export function isMenuItemDanger(item: MenuSectionItem | null | undefined): boolean {
    return itemConfig(item)?.danger === true || legacyGroup(item) === 'danger';
}

/**
 * The items with each section parent replaced by its subitems, marked with the parent's `section` (its name and
 * title). A parent's subitems that head sections of their own are lifted too, under the same section.
 */
export function flattenMenuSections<T extends MenuSectionItem>(items: T[], section?: MenuSectionTag): T[] {
    return (items || []).flatMap((item) => {
        if (!isMenuSectionParent(item)) return [section ? { ...item, section } : item];
        const tag = section ?? { key: String(item.name || item.title || ''), title: String(item.title || '') };
        return flattenMenuSections((item.subitems || []) as T[], tag);
    });
}

/** Whether the (flattened) items are drawn in sections: some come from a section parent, or have an older UNA's group. */
export function hasMenuSections(items: (MenuSectionItem | null | undefined)[]): boolean {
    return (items || []).some((item) => !!item?.section || legacyGroup(item) !== null || isMenuSectionParent(item));
}

/**
 * The entries in their sections, in the menu's order: a run of entries from one section parent, a run of entries
 * without one (no heading), and each dangerous entry on its own. `itemOf` gives an entry's (flattened) menu item.
 * With an older UNA's groups the sections come in the groups' order instead.
 */
export function buildMenuSections<T>(entries: T[], itemOf: (entry: T) => MenuSectionItem | null | undefined, headings: LegacyGroupHeadings = {}): MenuSection<T>[] {
    const list = entries || [];
    if (!list.some((entry) => itemOf(entry)?.section) && list.some((entry) => legacyGroup(itemOf(entry)) !== null)) {
        return legacyMenuSections(list, itemOf, headings);
    }

    const sections: MenuSection<T>[] = [];
    // The section parent each section comes from ('' for none), to join the next entry to it.
    const parents: string[] = [];
    list.forEach((entry, index) => {
        const item = itemOf(entry);
        const danger = isMenuItemDanger(item);
        const parent = item?.section?.key ?? '';
        const last = sections[sections.length - 1];
        if (last && !danger && !last.danger && parents[parents.length - 1] === parent) {
            last.entries.push(entry);
            return;
        }
        const key = danger ? `danger-${index}` : parent || `other-${index}`;
        sections.push({ key, title: danger ? '' : item?.section?.title || '', danger, entries: [entry] });
        parents.push(parent);
    });
    return sections;
}

function legacyMenuSections<T>(entries: T[], itemOf: (entry: T) => MenuSectionItem | null | undefined, headings: LegacyGroupHeadings): MenuSection<T>[] {
    const byGroup = new Map<LegacyGroup, T[]>();
    for (const entry of entries) {
        const group = legacyGroup(itemOf(entry)) ?? 'other';
        byGroup.set(group, [...(byGroup.get(group) || []), entry]);
    }
    return LEGACY_GROUPS.filter((group) => byGroup.has(group)).map((group) => ({
        key: group,
        title: group === 'account' || group === 'profile' ? headings[group] || '' : '',
        danger: group === 'danger',
        entries: byGroup.get(group) || [],
    }));
}
