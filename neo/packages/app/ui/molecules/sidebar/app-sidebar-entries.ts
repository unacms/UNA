/**
 * What the Application sidebar lists, the same on the web and in the native apps: UNA's `sys_site_panel` menu, whose
 * items are submenus (`sys_profile_stats`, `sys_profile_followings`...), and a menu item as a row.
 */
export type SidebarMenuItem = { [key: string]: any };

export type SidebarRowEntry = {
    key: string;
    title: string;
    icon: string;
    /** Where the row goes; none for a row that is only a label. */
    href?: string;
    /** The item's counter; empty when there is none or it is zero. */
    count: string;
    /** The row of the page on screen. */
    current: boolean;
};

/** A link or a page URL as a bare path, so the two compare: no origin, no slashes around it. */
export function comparable(value: unknown): string {
    if (typeof value !== 'string' || !value) return '';
    let path = value;
    const scheme = /^https?:\/\//.exec(path);
    if (scheme) {
        const slash = path.indexOf('/', scheme[0].length);
        path = slash === -1 ? '' : path.slice(slash);
    }
    return path.split('/').filter(Boolean).join('/');
}

export function rowHref(link: string): string | undefined {
    if (!link || link === 'javascript:void(0)') return undefined;
    if (link.startsWith('/') || /^https?:/.test(link)) return link;
    return `/${link}`;
}

/** The names of the panel's submenus, in order. */
export function panelSubmenus(menuData: unknown): string[] {
    const items = (menuData as { items?: unknown } | null | undefined)?.items;
    if (!Array.isArray(items)) return [];
    return items
        .map((panel: SidebarMenuItem) => panel?.submenu)
        .filter((submenu): submenu is string => typeof submenu === 'string' && !!submenu);
}

function toRow(item: SidebarMenuItem, key: string, url: string): SidebarRowEntry {
    const link = [item?.link, item?.url].find((value) => typeof value === 'string' && value) ?? '';
    const count = item?.addon && typeof item.addon !== 'object' ? String(item.addon) : '';
    return {
        key,
        title: String(item?.title || item?.name || ''),
        icon: typeof item?.icon === 'string' && item.icon ? item.icon : 'Circle',
        href: rowHref(link),
        count: count === '0' ? '' : count,
        current: !!comparable(item?.link) && comparable(item?.link) === url,
    };
}

/** A submenu's rows, one under another: an item, then the items under it (a list of followed contexts). */
export function menuRows(object: string, menuData: unknown, url: string): SidebarRowEntry[] {
    const items = (menuData as { items?: unknown } | null | undefined)?.items;
    if (!Array.isArray(items)) return [];
    const rows: SidebarRowEntry[] = [];
    items.forEach((item: SidebarMenuItem, index: number) => {
        const key = `${object}-${item?.name ?? index}`;
        rows.push(toRow(item, key, url));
        if (Array.isArray(item?.subitems)) {
            item.subitems.forEach((child: SidebarMenuItem, i: number) => rows.push(toRow(child, `${key}-${child?.name ?? i}`, url)));
        }
    });
    return rows;
}
