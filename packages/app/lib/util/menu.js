import { fetcher } from 'app/lib/fetcher';
import { UNA_URL } from 'app/config';
import { appSetting } from './settings';
import { strToObj } from './object';
import { getURI } from './url';

const getNameFromSetting = (setting) => {
    if (typeof setting === 'string') {
        return setting;
    } else if (setting && typeof setting === 'object' && setting.name) {
        return setting.name;
    }
    return null;
};

export async function getDataForMenu(menu, callback) {
    const data = await fetcher(
        '/api.php?r=system/get_menu/TemplServices&params[]={"object":"' + menu?.object + '","params":' + JSON.stringify(menu?.params) + '}'
    )
    callback?.(data.data)
    return data.data
}

export async function runMenuItemCallback(oItem) {
    const requestUrl = oItem?.data?.request_url
    if (!requestUrl) return false

    await fetcher('/api.php?r=' + requestUrl)
    return true
}

/** App settings use `description`; UNA Studio stores the same copy as `info`. */
export function resolveMenuItemDescription(item) {
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
function asMenuItemList(items) {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'object') return Object.values(items);
    return [];
}

export function getMenuItemChildren(item) {
    const fromSub = asMenuItemList(item?.subitems).filter(Boolean);
    if (fromSub.length) return fromSub;
    return asMenuItemList(item?.items).filter(Boolean);
}

function getMenuItemChildrenKey(item) {
    if (asMenuItemList(item?.subitems).length) return 'subitems';
    if (asMenuItemList(item?.items).length) return 'items';
    return null;
}

export function isMenuItemNavigable(item) {
    const link = typeof item?.link === 'string' ? item.link.trim() : '';
    if (!link) return false;
    if (link.startsWith('javascript:')) return false;
    return true;
}

/** Prefix relative UNA menu links so dropdown rows navigate in-app. */
export function normalizeMenuItemHref(link) {
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
export function flattenMenuItemsForDropdown(items) {
    const out = [];

    const visit = (list) => {
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
export function groupDropdownItems(items) {
    const sections = [];
    let current = null;

    const startSection = (header = null) => {
        current = { header, items: [] };
        sections.push(current);
    };

    asMenuItemList(items).forEach((item) => {
        if (item?.type === 'group_header') {
            startSection(item);
            return;
        }
        if (!current) startSection(null);
        current.items.push(item);
    });

    return sections.filter((section) => section.header || section.items.length);
}

function menuLeafKeys(item) {
    if (!item || item.type === 'group_header' || item.type === 'separator') return [];
    const keys = [];
    if (item.name) keys.push(`name:${item.name}`);
    const uri = getURI(normalizeMenuItemHref(item.link || '')) || '';
    if (uri) keys.push(`uri:${uri}`);
    return keys;
}

function menuSectionKey(header) {
    const raw = String(header?.name || header?.title || '').toLowerCase().trim();
    return raw.replace(/-\d+$/, '');
}

function withNormalizedLink(item) {
    if (!item?.link || item.type === 'group_header' || item.type === 'separator') return item;
    const link = normalizeMenuItemHref(item.link);
    return link && link !== item.link ? { ...item, link } : item;
}

function overlayMenuLeaf(base, overlay) {
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
export function mergeNavbarMoreWithLauncher(localItems, launcherItems) {
    const localFlat = flattenMenuItemsForDropdown(localItems);
    const remoteFlat = flattenMenuItemsForDropdown(launcherItems);
    if (!remoteFlat.length) return localFlat;
    if (!localFlat.length) return remoteFlat;

    const overlayByKey = new Map();
    localFlat.forEach((item) => {
        menuLeafKeys(item).forEach((key) => overlayByKey.set(key, item));
    });

    const used = new Set();
    const markUsed = (item) => {
        menuLeafKeys(item).forEach((key) => used.add(key));
    };
    const isUsed = (item) => menuLeafKeys(item).some((key) => used.has(key));

    const overlaySections = groupDropdownItems(localFlat);
    const primarySections = groupDropdownItems(remoteFlat);
    const out = [];

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
export function getDropdownSectionsLayout(sectionCount, windowWidth, options = {}) {
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
export function dropdownLeafItems(items) {
    return asMenuItemList(items).filter(
        (item) => item && item.type !== 'group_header' && item.type !== 'separator'
    );
}

/** Compact waffle (Apps launcher): 3 equal tiles, shell hugs the grid. */
export function getDropdownGridLayout(options = {}) {
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

export function findIconFromRemote(s) {
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
        return kebab.replace(/(^|-)([a-z0-9])/g, (_, _dash, ch) => ch.toUpperCase());
    }

    return s;
}

export function menuItemsByNameNew(name, menu, currentUser, url = '') {
    return menuItemsByName(name, menu?.items, currentUser, url, menu?.config)
}

export function menuItemsByName(name, items, currentUser, url = '', config = null) {
    if (!items)
        return [];

    const menuSettings = getMenuSettings(name, config);//appSetting('menu_items', name)
    let menuSettingNames = []

    if (menuSettings) {
        if (menuSettings.items) {
            if (typeof menuSettings.items[0] === 'string') {
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettings.items.includes(item.name)) || (!!item.link && menuSettings.items.includes(getURI(item.link)))));
            }
            else {
                menuSettingNames = menuSettings.items.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));

                menuSettingNames = [];
                items = items.map(item1 => {
                    const item2 = menuSettings.items.find(item2 => item2.name === item1.name);
                    return item2 ? { ...item1, ...item2 } : item1;
                });
            }
        }
        else {
            if (menuSettings.items) {
                menuSettingNames = menuSettings.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));
            }
        }
        if (menuSettingNames) {
            items.forEach(item => {
                if (menuSettingNames.includes(item.name)) {
                    let matchedSettings = menuSettings.filter(item2 => item.name === item2.name);

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

export function menuItemsFilter(items, currentUser) {
    if (!items)
        return items;
    items = asMenuItemList(items);
    if (!currentUser) {
        items = items.filter(item => item.nonlogged !== false && item.nonoperator !== false);
    }
    else {
        items = items.filter(item => item.logged !== false);
        if (!currentUser.operator) {
            items = items.filter(item => item.nonoperator !== false);
        }

        items = items.filter(item => {
            return !item.membership_level || (item.membership_level & Math.pow(2, currentUser.membership)) == Math.pow(2, currentUser.membership)
        });
    }

    items = items.map(item => {
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

export function getMenuSettings(object, config, menu) {
    if (!appSetting('layout', 'user_remote_config'))
        return appSetting('menu_items', object);

    let a = {}
    if (appSetting('layout', 'user_remote_config') && config)
        a = strToObj(config);

    if (a && !a.name && menu?.title)
        a.name = menu.title;

    if (a && !a.icon && menu?.icon)
        a.icon = menu.icon;

    return a
}
