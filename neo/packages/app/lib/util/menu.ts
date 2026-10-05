import { fetcher } from 'app/lib/fetcher';
import { UNA_URL } from 'app/config';
import { appSetting } from './settings';
import { strToObj } from './object';
import { getURI } from './url';

/** UNA / settings menu item: `name`, `title`, `link`, `icon`, `type`, nested `items` / `subitems`, visibility flags… */
export type MenuItem = { [key: string]: any };

/** Menu items as an array or a name-keyed object. */
type MenuItemList = MenuItem[] | Record<string, MenuItem> | null | undefined;

export type DropdownSection = { header: MenuItem | null; items: MenuItem[] };

const getNameFromSetting = (setting: unknown): string | null => {
    if (typeof setting === 'string') {
        return setting;
    } else if (setting && typeof setting === 'object' && (setting as MenuItem).name) {
        return (setting as MenuItem).name;
    }
    return null;
};

export async function getDataForMenu(menu: { object?: unknown; params?: unknown } | null | undefined, callback?: (data: any) => any): Promise<any> {
    const data = await fetcher(
        '/api.php?r=system/get_menu/TemplServices&params[]={"object":"' + menu?.object + '","params":' + JSON.stringify(menu?.params) + '}'
    )
    callback?.(data.data)
    return data.data
}

export async function runMenuItemCallback(oItem: MenuItem | null | undefined): Promise<boolean> {
    const requestUrl = oItem?.data?.request_url
    if (!requestUrl) return false

    await fetcher('/api.php?r=' + requestUrl)
    return true
}

/** App settings use `description`; UNA Studio stores the same copy as `info`. */
export function resolveMenuItemDescription(item: MenuItem | null | undefined): string {
    const candidates = [item?.description, item?.info];
    for (const value of candidates) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
        }
    }
    return '';
}

/**
 * UNA nests children on the parent as `subitems` once Studio sets parent_id
 * (`getMenuItemsHierarchy` / `_getMenuItemAPI`). Custom settings menus nest
 * the same way as `items` (navbar More, launcher, etc.). The API field may be
 * an array or a name-keyed object — accept both.
 */
function asMenuItemList(items: MenuItemList): MenuItem[] {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'object') return Object.values(items);
    return [];
}

export function getMenuItemChildren(item: MenuItem | null | undefined): MenuItem[] {
    const fromSub = asMenuItemList(item?.subitems).filter(Boolean);
    if (fromSub.length) return fromSub;
    return asMenuItemList(item?.items).filter(Boolean);
}

function getMenuItemChildrenKey(item: MenuItem | null | undefined): 'subitems' | 'items' | null {
    if (asMenuItemList(item?.subitems).length) return 'subitems';
    if (asMenuItemList(item?.items).length) return 'items';
    return null;
}

export function isMenuItemNavigable(item: MenuItem | null | undefined): boolean {
    const link = typeof item?.link === 'string' ? item.link.trim() : '';
    if (!link) return false;
    if (link.startsWith('javascript:')) return false;
    return true;
}

/** Prefix relative UNA menu links so dropdown rows navigate in-app. */
export function normalizeMenuItemHref(link: unknown): string {
    if (typeof link !== 'string') return '';
    const trimmed = link.trim();
    if (!trimmed || trimmed.startsWith('javascript:')) return '';
    if (trimmed[0] === '/' || trimmed.includes('://')) return trimmed;
    return '/' + trimmed;
}

/**
 * Flatten a menu tree for DropdownMenu: parent items with children become
 * `group_header` rows (section columns), and nested `subitems` / `items`
 * follow as regular rows. Empty parents are omitted. Already-flat lists
 * with `group_header` rows pass through unchanged.
 */
export function flattenMenuItemsForDropdown(items: MenuItemList): MenuItem[] {
    const out: MenuItem[] = [];

    const visit = (list: MenuItemList) => {
        asMenuItemList(list).forEach((item) => {
            if (!item || item.name === 'more-auto') return;

            if (item.type === 'group_header' || item.type === 'separator') {
                out.push(item);
                return;
            }

            const children = getMenuItemChildren(item);
            if (children.length) {
                const start = out.length;
                visit(children);
                if (out.length === start) return;

                const title = item.title || item.name;
                if (title) {
                    out.splice(start, 0, {
                        type: 'group_header',
                        id: `header-${item.id ?? item.name ?? start}`,
                        name: item.name,
                        title,
                        first: start === 0,
                    });
                }
                return;
            }

            if (!isMenuItemNavigable(item)) return;
            out.push(item);
        });
    };

    visit(items);
    return out;
}

/** Turn a flat dropdown list (`group_header` + items) into column sections. */
export function groupDropdownItems(items: MenuItemList): DropdownSection[] {
    const sections: DropdownSection[] = [];
    let current: DropdownSection | null = null;

    const startSection = (header: MenuItem | null = null): DropdownSection => {
        const section: DropdownSection = { header, items: [] };
        current = section;
        sections.push(section);
        return section;
    };

    asMenuItemList(items).forEach((item) => {
        if (item?.type === 'group_header') {
            startSection(item);
            return;
        }
        const target = current ?? startSection(null);
        target.items.push(item);
    });

    return sections.filter((section) => section.header || section.items.length);
}

function menuLeafKeys(item: MenuItem | null | undefined): string[] {
    if (!item || item.type === 'group_header' || item.type === 'separator') return [];
    const keys: string[] = [];
    if (item.name) keys.push(`name:${item.name}`);
    const uri = getURI(normalizeMenuItemHref(item.link || '')) || '';
    if (uri) keys.push(`uri:${uri}`);
    return keys;
}

function menuSectionKey(header: MenuItem | null | undefined): string {
    const raw = String(header?.name || header?.title || '').toLowerCase().trim();
    return raw.replace(/-\d+$/, '');
}

function withNormalizedLink(item: MenuItem): MenuItem {
    if (!item?.link || item.type === 'group_header' || item.type === 'separator') return item;
    const link = normalizeMenuItemHref(item.link);
    return link && link !== item.link ? { ...item, link } : item;
}

function overlayMenuLeaf(base: MenuItem, overlay: MenuItem | undefined): MenuItem {
    if (!overlay) return withNormalizedLink(base);
    const description = resolveMenuItemDescription(overlay) || resolveMenuItemDescription(base);
    return withNormalizedLink({
        ...base,
        icon: overlay.icon || base.icon,
        animated: overlay.animated ?? base.animated,
        ...(description ? { description } : {}),
    });
}

/**
 * Navbar More is a static tree; Apps (`sys_homepage`) is API-driven.
 * Prefer the launcher order/inventory, overlay local copy/icons, and append
 * local-only rows (Documentation, Groups, …) into the matching section.
 */
export function mergeNavbarMoreWithLauncher(localItems: MenuItemList, launcherItems: MenuItemList): MenuItem[] {
    const localFlat = flattenMenuItemsForDropdown(localItems);
    const remoteFlat = flattenMenuItemsForDropdown(launcherItems);
    if (!remoteFlat.length) return localFlat;
    if (!localFlat.length) return remoteFlat;

    const overlayByKey = new Map<string, MenuItem>();
    localFlat.forEach((item) => {
        menuLeafKeys(item).forEach((key) => overlayByKey.set(key, item));
    });

    const used = new Set<string>();
    const markUsed = (item: MenuItem) => {
        menuLeafKeys(item).forEach((key) => used.add(key));
    };
    const isUsed = (item: MenuItem) => menuLeafKeys(item).some((key) => used.has(key));

    const overlaySections = groupDropdownItems(localFlat);
    const primarySections = groupDropdownItems(remoteFlat);
    const out: MenuItem[] = [];

    primarySections.forEach((section) => {
        if (section.header) {
            out.push({ ...section.header, first: out.length === 0 });
        }
        section.items.forEach((item) => {
            const overlay = menuLeafKeys(item).map((key) => overlayByKey.get(key)).find(Boolean);
            markUsed(overlay || item);
            out.push(overlayMenuLeaf(item, overlay));
        });
        const sectionKey = menuSectionKey(section.header);
        if (!sectionKey) return;
        overlaySections.forEach((overlaySection) => {
            if (menuSectionKey(overlaySection.header) !== sectionKey) return;
            overlaySection.items.forEach((item) => {
                if (isUsed(item)) return;
                markUsed(item);
                out.push(withNormalizedLink(item));
            });
        });
    });

    overlaySections.forEach((section) => {
        const remaining = section.items.filter((item) => !isUsed(item));
        if (!remaining.length) return;
        if (section.header) {
            out.push({ ...section.header, first: out.length === 0 });
        }
        remaining.forEach((item) => {
            markUsed(item);
            out.push(withNormalizedLink(item));
        });
    });

    return out;
}

const DROPDOWN_SECTION_MIN = 240; // w-60
const DROPDOWN_SECTION_MAX = 320; // w-80
const DROPDOWN_SECTION_GAP = 4; // gap-1
const DROPDOWN_SECTION_STACK_BELOW = 640; // sm
const DROPDOWN_POPUP_GUTTER = 32;
// Theme shell uses `p-1.5` (6px × 2). Must match `theme.dropdown.cnt` — too
// small and the last column wraps while the popup still reserves its width.
const DROPDOWN_POPUP_PAD = 12;

/**
 * How many section columns fit, and how wide they should be.
 * Columns stay between w-60 and w-80; the shell hugs that row (does not
 * reserve width for wrapped sections).
 */
export type DropdownSectionsLayout = {
    stacked: boolean;
    cols: number;
    colWidth: number | null;
    contentWidth: number | null;
    popupWidth: number | null;
    minWidth: number;
    maxWidth: number;
    gap: number;
};

type LayoutOptions = { minWidth?: number; maxWidth?: number; gap?: number; stackBelow?: number; pad?: number };

export function getDropdownSectionsLayout(sectionCount: number, windowWidth: number, options: LayoutOptions = {}): DropdownSectionsLayout {
    const minWidth = options.minWidth ?? DROPDOWN_SECTION_MIN;
    const maxWidth = options.maxWidth ?? DROPDOWN_SECTION_MAX;
    const gap = options.gap ?? DROPDOWN_SECTION_GAP;
    const stackBelow = options.stackBelow ?? DROPDOWN_SECTION_STACK_BELOW;
    const pad = options.pad ?? DROPDOWN_POPUP_PAD;
    const count = Math.max(1, sectionCount || 1);

    if (!windowWidth || windowWidth < stackBelow) {
        return {
            stacked: true,
            cols: 1,
            colWidth: null,
            contentWidth: null,
            popupWidth: null,
            minWidth,
            maxWidth,
            gap,
        };
    }

    const available = Math.max(
        minWidth,
        windowWidth - DROPDOWN_POPUP_GUTTER - pad
    );
    const maxCols = Math.max(1, Math.floor((available + gap) / (minWidth + gap)));
    const cols = Math.min(count, maxCols);
    const colWidth = Math.min(
        maxWidth,
        Math.max(minWidth, Math.floor((available - gap * (cols - 1)) / cols))
    );
    const contentWidth = cols * colWidth + gap * (cols - 1);

    return {
        stacked: false,
        cols,
        colWidth,
        contentWidth,
        popupWidth: contentWidth + pad,
        minWidth,
        maxWidth,
        gap,
    };
}

const DROPDOWN_GRID_COLS = 3;
const DROPDOWN_GRID_CELL = 108;
const DROPDOWN_GRID_GAP = 4;

/** Drop section headers/separators so a dropdown can render as a tile grid. */
export function dropdownLeafItems(items: MenuItemList): MenuItem[] {
    return asMenuItemList(items).filter(
        (item) => item && item.type !== 'group_header' && item.type !== 'separator'
    );
}

/** Compact waffle (Apps launcher): 3 equal tiles, shell hugs the grid. */
export function getDropdownGridLayout(options: { cols?: number; cellWidth?: number; gap?: number; pad?: number } = {}): { cols: number; cellWidth: number; gap: number; contentWidth: number; popupWidth: number } {
    const cols = options.cols ?? DROPDOWN_GRID_COLS;
    const cellWidth = options.cellWidth ?? DROPDOWN_GRID_CELL;
    const gap = options.gap ?? DROPDOWN_GRID_GAP;
    const pad = options.pad ?? DROPDOWN_POPUP_PAD;
    const contentWidth = cols * cellWidth + Math.max(0, cols - 1) * gap;
    return {
        cols,
        cellWidth,
        gap,
        contentWidth,
        popupWidth: contentWidth + pad,
    };
}

const KEBAB_ICON_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// Font Awesome style prefixes UNA puts before the name (`far file-word`).
const FA_STYLE_TOKENS = new Set(['fa', 'fas', 'far', 'fab', 'fal', 'fad', 'fat']);

/** Map a UNA / Font Awesome icon string to an icon-set name (PascalCase); returns input if unknown. */
export function findIconFromRemote<T extends string | null | undefined>(s: T): T | string {
    if (!s || /^[A-Z][^\s]*$/.test(s))
        return s;
    const data = appSetting('menu_items', 'iconset');
    const words = s.replace(/\bcol-\S*\b/g, '').trim().split(/\s+/)
        .filter((word) => !FA_STYLE_TOKENS.has(word));
    for (let word of words) {
        const name = data[word] || data[word.replace(/^fa-/, '')];
        if (name) {
            return name;
        }
    }

    // UNA also sends Lucide names in kebab case (`log-in`); icon sets are keyed by PascalCase.
    const kebab = words.map((word) => word.replace(/^fa-/, '')).find((word) => KEBAB_ICON_NAME.test(word));
    if (kebab) {
        return kebab.replace(/(^|-)([a-z0-9])/g, (_: string, _dash: string, ch: string) => ch.toUpperCase());
    }

    return s;
}

export function menuItemsByNameNew(name: string, menu: { items?: MenuItemList; config?: unknown } | null | undefined, currentUser: any, url = ''): MenuItem[] {
    return menuItemsByName(name, menu?.items, currentUser, url, menu?.config)
}

export function menuItemsByName(name: string, items: any, currentUser: any, url = '', config: unknown = null): MenuItem[] {
    if (!items)
        return [];

    const menuSettings = getMenuSettings(name, config);//appSetting('menu_items', name)
    let menuSettingNames: (string | null)[] = []

    if (menuSettings) {
        if (menuSettings.items) {
            if (typeof menuSettings.items[0] === 'string') {
                items = items.filter((item: MenuItem) => (item.hideInTop || (!!item.name && menuSettings.items.includes(item.name)) || (!!item.link && menuSettings.items.includes(getURI(item.link) as string))));
            }
            else {
                menuSettingNames = menuSettings.items.map(getNameFromSetting);
                items = items.filter((item: MenuItem) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link) as string))));

                menuSettingNames = [];
                items = items.map((item1: MenuItem) => {
                    const item2 = menuSettings.items.find((item2: MenuItem) => item2.name === item1.name);
                    return item2 ? { ...item1, ...item2 } : item1;
                });
            }
        }
        else {
            if (menuSettings.items) {
                menuSettingNames = menuSettings.map(getNameFromSetting);
                items = items.filter((item: MenuItem) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link) as string))));
            }
        }
        if (menuSettingNames) {
            items.forEach((item: MenuItem) => {
                if (menuSettingNames.includes(item.name)) {
                    let matchedSettings = menuSettings.filter((item2: MenuItem) => item.name === item2.name);

                    if (matchedSettings.length > 0) {

                        item.settings = matchedSettings[0].settings;
                    }
                }
            });
        }

        return menuItemsFilter(items, currentUser);
    }
    if (!items)
        items = [{ link: url, title: '' }];

    return menuItemsFilter(items, currentUser);
}

/** Apply visibility flags (logged / nonlogged / nonoperator / membership_level) and fill placeholder links. */
export function menuItemsFilter(items: any, currentUser: any): any {
    if (!items)
        return items;
    items = asMenuItemList(items);
    if (!currentUser) {
        items = items.filter((item: MenuItem) => item.nonlogged !== false && item.nonoperator !== false);
    }
    else {
        items = items.filter((item: MenuItem) => item.logged !== false);
        if (!currentUser.operator) {
            items = items.filter((item: MenuItem) => item.nonoperator !== false);
        }

        items = items.filter((item: MenuItem) => {
            return !item.membership_level || (item.membership_level & Math.pow(2, currentUser.membership)) == Math.pow(2, currentUser.membership)
        });
    }

    items = items.map((item: MenuItem) => {
        const description = resolveMenuItemDescription(item);
        let next = description && item.description !== description
            ? { ...item, description }
            : item;
        if (next.link === '{studio}') {
            next = { ...next, link: UNA_URL + '/studio/launcher.php' };
        } else if (next.link === '{profile}') {
            next = { ...next, link: currentUser?.url };
        } else if (next?.link && next?.link?.includes("{profile_url_postfix}")) { // SHOULD BE IMPROVED by url_postfix
            next = { ...next, link: next.link.replace("{profile_url_postfix}", currentUser?.url.replace('/view-persons-profile/', '')) };
        }
        const childrenKey = getMenuItemChildrenKey(next);
        if (childrenKey) {
            next = { ...next, [childrenKey]: menuItemsFilter(getMenuItemChildren(next), currentUser) };
        }
        return next;
    });
    return items;
}

export function getMenuSettings(object: string, config?: unknown, menu?: { title?: string; icon?: string }): any {
    if (!appSetting('layout', 'user_remote_config'))
        return appSetting('menu_items', object);

    let a: any = {}
    if (appSetting('layout', 'user_remote_config') && config)
        a = strToObj(config as string);

    if (a && !a.name && menu?.title)
        a.name = menu.title;

    if (a && !a.icon && menu?.icon)
        a.icon = menu.icon;

    return a
}
