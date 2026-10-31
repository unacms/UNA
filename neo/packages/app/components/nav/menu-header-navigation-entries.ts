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
    type MenuItem,
} from 'app/lib/util';

export type MenuNavigationEntry = {
    key: string;
    /** The menu item, title translated. */
    item: MenuItem;
    /** A group's subitems flattened for a dropdown (`group_header` / `separator` rows included); empty for a link. */
    rows: MenuItem[];
};

export type MenuNavigationEntries = {
    entries: MenuNavigationEntry[];
    /** The site menu is still loading: keep the button so the header doesn't shift. */
    pending: boolean;
};

/** A site menu item, its submenus too, with in-app links and Lucide icons. */
function siteMenuItem(item: MenuItem): MenuItem {
    const children = getMenuItemChildren(item);
    return {
        ...item,
        link: normalizeMenuItemHref(item.link),
        icon: findIconFromRemote(item.icon) || 'ChevronRight',
        ...(children.length ? { subitems: children.map(siteMenuItem) } : {}),
    };
}

/**
 * The header menu's entries (menu-header-navigation.tsx and its .ios.tsx), with the
 * visibility flags applied at every level (`menuItemsByName`): one per item of the
 * `menu_items.menu_navigation` setting or, without it, of UNA's site menu
 * (`menu_items.objects.site`, the one the desktop navbar shows). A group (an item with
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

    const entries = useMemo(() => {
        const source = useSiteMenu
            ? (siteMenuData?.items ?? [])
                  .filter((item: MenuItem) => item && item.name !== 'more-auto')
                  .map(siteMenuItem)
            : staticItems;
        const launcherItems = !wantsLauncher
            ? []
            : useStaticLauncher
                ? menuItemsByName('', staticLauncher, currentUser)
                : menuItemsByNameNew('menu_post', launcherMenuData, currentUser);
        return menuItemsByName('main_menu', source, currentUser)
            .map((item, index) => {
                const children = getMenuItemChildren(item);
                return {
                    key: item.name ?? String(index),
                    item: { ...item, title: t(item.title) },
                    hasChildren: children.length > 0,
                    rows: flattenMenuItemsForDropdown(item.launcher ? mergeNavbarMoreWithLauncher(children, launcherItems) : children)
                        .map((row) => ({ ...row, title: t(row.title) })),
                };
            })
            // The site menu can hold script-only items and submenus with nothing for this viewer.
            .filter((entry) => !useSiteMenu || (entry.hasChildren ? entry.rows.length > 0 : isMenuItemNavigable(entry.item)))
            .map(({ hasChildren: _hasChildren, ...entry }) => entry);
    }, [useSiteMenu, siteMenuData, staticItems, wantsLauncher, useStaticLauncher, staticLauncher, launcherMenuData, currentUser, t]);

    return { entries, pending: useSiteMenu && !isFetched };
}
