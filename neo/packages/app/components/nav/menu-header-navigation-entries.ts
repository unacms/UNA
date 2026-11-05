import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import {
    appSetting,
    findIconFromRemote,
    flattenMenuItemsForDropdown,
    getMenuItemChildren,
    isMenuItemNavigable,
    menuItemsByName,
    menuItemsByNameNew,
    mergeNavbarMoreWithLauncher,
    normalizeMenuItemHref,
    strToObj,
    withSiteMenuHomeLink,
    type MenuItem,
} from 'app/lib/util';

export type MenuNavigationEntry = {
    key: string;
    /** The menu item, title translated. */
    item: MenuItem;
    /** A group's subitems flattened for a dropdown (`group_header` / `separator` rows included); empty for a link. */
    rows: MenuItem[];
};

export type MenuNavigationButton = {
    key: string;
    /** The menu item, title translated. */
    item: MenuItem;
    /** The prominent button (Sign Up), from the item's `primary` flag. */
    primary: boolean;
};

export type MenuNavigationEntries = {
    entries: MenuNavigationEntry[];
    /** Items shown as buttons above the others (the site menu's Log In and Sign Up for guests on phones). */
    buttons: MenuNavigationButton[];
    /** The site menu is still loading: keep the button so the header doesn't shift. */
    pending: boolean;
};

/**
 * The header-toolbar `auth` buttons (`MenuHeaderNavigationProps.auth`), for a menu whose data has none: a
 * `menu_navigation` setting without them, or a site from before UNA marked its Log in and Sign up items.
 */
export const AUTH_BUTTONS: MenuNavigationButton[] = [
    { key: 'login', item: { name: 'login', title: 'Log In', icon: 'LogIn', link: '/login' }, primary: false },
    { key: 'create-account', item: { name: 'create-account', title: 'Sign Up', icon: 'UserPlus', link: '/create-account' }, primary: true },
];

function isTruthyFlag(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
}

/**
 * A link shown as a button above the menu's rows: UNA marks it with `"button": true` in the item's App
 * config (`config`), a `menu_navigation` item with `button: true`. Its `primary` flag makes it the prominent one.
 */
function isMenuButtonItem(item: MenuItem): boolean {
    if (getMenuItemChildren(item).length || !isMenuItemNavigable(item)) return false;
    if (isTruthyFlag(item.button)) return true;
    const config = typeof item.config === 'string' && item.config ? strToObj(item.config) : item.config;
    return !!config && typeof config === 'object' && isTruthyFlag(config.button);
}

/** A site menu item, its submenus too, with in-app links and Lucide icons. */
function siteMenuItem(item: MenuItem): MenuItem {
    const children = getMenuItemChildren(item);
    return {
        ...item,
        link: normalizeMenuItemHref(withSiteMenuHomeLink(item).link),
        icon: findIconFromRemote(item.icon) || 'ChevronRight',
        ...(children.length ? { subitems: children.map(siteMenuItem) } : {}),
    };
}

/**
 * The header menu's entries (menu-header-navigation.tsx and its .ios.tsx), with the
 * visibility flags applied at every level (`menuItemsByName`): one per item of the
 * `menu_items.menu_navigation` setting or, without it, of UNA's site menu
 * (`menu_items.objects.site`, the one the desktop navbar shows), except the items shown as
 * buttons (`isMenuButtonItem`), which come apart in `buttons`. A group (an item with
 * `items` or `subitems`) holds its rows flattened for a dropdown, section headers
 * included. A `menu_navigation` group flagged `launcher: true` also lists the remote
 * Apps launcher, merged the way the desktop MenuTop merges it into More.
 */
export function useMenuNavigationEntries(): MenuNavigationEntries {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();

    const staticItems = appSetting('menu_items', 'menu_navigation');
    const useSiteMenu = !Array.isArray(staticItems) || !staticItems.length;
    const { menuData: siteMenuData, isFetched } = useMenuData(
        useSiteMenu ? appSetting('menu_items', 'objects', 'site') : null
    );
    // The launcher's apps, as MenuTop takes them: the `menu_launcher` setting if set, else UNA's launcher menu.
    const wantsLauncher =
        !useSiteMenu &&
        !!appSetting('layout', 'apps') &&
        staticItems.some((item: MenuItem) => item?.launcher);
    const staticLauncher = appSetting('menu_items', 'menu_launcher');
    const useStaticLauncher = Array.isArray(staticLauncher) && staticLauncher.length > 0;
    const { menuData: launcherMenuData } = useMenuData(
        wantsLauncher && !useStaticLauncher ? appSetting('menu_items', 'objects', 'launcher') : null
    );

    const { entries, buttons } = useMemo(() => {
        const source = useSiteMenu
            ? (siteMenuData?.items ?? [])
                  .filter((item: MenuItem) => item && item.name !== 'more-auto')
                  .map(siteMenuItem)
            : staticItems;
        let launcherItems: MenuItem[] = [];
        if (wantsLauncher) {
            launcherItems = useStaticLauncher
                ? menuItemsByName('', staticLauncher, currentUser)
                : menuItemsByNameNew('menu_post', launcherMenuData, currentUser);
        }
        const visible = menuItemsByName('main_menu', source, currentUser);
        const buttons: MenuNavigationButton[] = visible.filter(isMenuButtonItem).map((item, index) => ({
            key: item.name ?? `button-${index}`,
            item: { ...item, title: t(item.title) },
            primary: isTruthyFlag(item.primary),
        }));
        const entries = visible
            .filter((item) => !isMenuButtonItem(item))
            .map((item, index) => {
                const children = getMenuItemChildren(item);
                return {
                    key: item.name ?? String(index),
                    // Rows animate their icons on hover, as the navbar does; an item may opt out with `animated: false`.
                    item: { ...item, title: t(item.title), animated: item.animated ?? true },
                    hasChildren: children.length > 0,
                    rows: flattenMenuItemsForDropdown(item.launcher ? mergeNavbarMoreWithLauncher(children, launcherItems) : children)
                        .map((row) => ({ ...row, title: t(row.title), animated: row.animated ?? true })),
                };
            })
            // The site menu can hold script-only items and submenus with nothing for this viewer.
            .filter((entry) => !useSiteMenu || (entry.hasChildren ? entry.rows.length > 0 : isMenuItemNavigable(entry.item)))
            .map(({ hasChildren: _hasChildren, ...entry }) => entry);
        return { entries, buttons };
    }, [useSiteMenu, siteMenuData, staticItems, wantsLauncher, useStaticLauncher, staticLauncher, launcherMenuData, currentUser, t]);

    return { entries, buttons, pending: useSiteMenu && !isFetched };
}
