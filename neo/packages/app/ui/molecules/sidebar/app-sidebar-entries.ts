/**
 * What the Application sidebar lists, the same on the web and in the native apps: UNA's `sys_site_panel` menu, whose
 * items are submenus (`sys_profile_stats`, `sys_profile_followings`...), and a menu item as a row.
 */
import { strToObj } from 'app/lib/util';

export type SidebarMenuItem = { [key: string]: any };

export type SidebarRowEntry = {
    key: string;
    title: string;
    /** Lucide name; empty in the drawer for an item without one (the footer's links). */
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

/** `{"drawer": true}` in a panel item's App config (`config`): the item is for the native apps' drawer only. */
function isDrawerOnly(panel: SidebarMenuItem): boolean {
    const config = typeof panel?.config === 'string' && panel.config ? strToObj(panel.config) : panel?.config;
    return !!config && typeof config === 'object' && !!config.drawer;
}

/** One of the panel's menus: its object, and the panel item's title, which heads it in the drawer. */
export type PanelSection = { object: string; title: string };

/**
 * The panel's submenus, in order. The web sidebar leaves out the ones marked for the drawer (the modules, the
 * account's menu, the footer's links: its header and footer have them); the drawer (`drawer`) lists all.
 */
export function panelSections(menuData: unknown, drawer = false): PanelSection[] {
    const items = (menuData as { items?: unknown } | null | undefined)?.items;
    if (!Array.isArray(items)) return [];
    return items
        .filter((panel: SidebarMenuItem) => typeof panel?.submenu === 'string' && !!panel.submenu && (drawer || !isDrawerOnly(panel)))
        .map((panel: SidebarMenuItem) => ({ object: String(panel.submenu), title: typeof panel.title === 'string' ? panel.title : '' }));
}

/** The names of the web sidebar's submenus, in order. */
export function panelSubmenus(menuData: unknown): string[] {
    return panelSections(menuData).map((section) => section.object);
}

/** A titled menu of the drawer with more rows than this starts collapsed, under its title. */
export const DRAWER_SECTION_OPEN_MAX = 8;

function toRow(item: SidebarMenuItem, key: string, url: string, fallbackIcon = 'Circle'): SidebarRowEntry {
    const link = [item?.link, item?.url].find((value) => typeof value === 'string' && value) ?? '';
    const count = item?.addon && typeof item.addon !== 'object' ? String(item.addon) : '';
    return {
        key,
        title: String(item?.title || item?.name || ''),
        icon: typeof item?.icon === 'string' && item.icon ? item.icon : fallbackIcon,
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

/**
 * What the drawer's head or its Preferences already hold, so a menu's own item for it is left out: the viewer's
 * profile and the profile switcher (the account's menu), the language, theme and sounds switchers (the footer's).
 */
const DRAWER_OWN = new Set(['profile', 'switch-profile', 'switch_language', 'switch_template', 'color_scheme', 'sounds']);

/**
 * A submenu's rows in the native apps' drawer: only the items that open a page (no text lines, no items that run a
 * script on the site, no badge), without the ones the drawer has a control of its own for. An item without an icon
 * keeps none.
 */
export function drawerRows(object: string, menuData: unknown, url: string): SidebarRowEntry[] {
    const items = (menuData as { items?: unknown } | null | undefined)?.items;
    if (!Array.isArray(items)) return [];
    const rows: SidebarRowEntry[] = [];
    const add = (item: SidebarMenuItem, key: string) => {
        if (!item || item.display_type === 'text' || DRAWER_OWN.has(String(item.name ?? ''))) return;
        // The footer's badge is an SVG, not an icon's name.
        const row = toRow(typeof item.icon === 'string' && item.icon.startsWith('<') ? { ...item, icon: '' } : item, key, url, '');
        // `{switch_profile}` and the like: a marker the site fills in, not a page.
        if (!row.href || row.href.includes('{') || !item.title) return;
        rows.push(row);
    };
    items.forEach((item: SidebarMenuItem, index: number) => {
        const key = `${object}-${item?.name ?? index}`;
        add(item, key);
        if (Array.isArray(item?.subitems)) {
            item.subitems.forEach((child: SidebarMenuItem, i: number) => add(child, `${key}-${child?.name ?? i}`));
        }
    });
    return rows;
}
