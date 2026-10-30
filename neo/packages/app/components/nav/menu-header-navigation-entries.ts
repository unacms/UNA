import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import {
    appSetting,
    flattenMenuItemsForDropdown,
    getMenuItemChildren,
    menuItemsByName,
    menuItemsByNameNew,
    menuItemsFilter,
    mergeNavbarMoreWithLauncher,
    type MenuItem,
} from 'app/lib/util';

export type MenuNavigationEntry = {
    key: string;
    /** The `menu_navigation` item, title translated. */
    item: MenuItem;
    /** A group's subitems flattened for a dropdown (`group_header` / `separator` rows included); empty for a link. */
    rows: MenuItem[];
};

/**
 * `menuItemsByName` applies the visibility flags (logged / nonlogged / nonoperator /
 * membership_level) to top-level items only, so a group's nested items get them here.
 */
function filterMenuTree(items: MenuItem[], currentUser: unknown): MenuItem[] {
    return ((menuItemsFilter(items, currentUser) || []) as MenuItem[]).map((item) => {
        const children = getMenuItemChildren(item);
        return children.length ? { ...item, subitems: undefined, items: filterMenuTree(children, currentUser) } : item;
    });
}

/**
 * The header menu's entries (menu-header-navigation.js and its .ios.tsx): one per
 * `menu_items.menu_navigation` item, translated. A group (an item with `items` or
 * `subitems`) holds its rows flattened for a dropdown, section headers included. A group
 * flagged `launcher: true` also lists the remote Apps launcher, merged the way the
 * desktop MenuTop merges it into More.
 */
export function useMenuNavigationEntries(): MenuNavigationEntry[] {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();

    const source = appSetting('menu_items', 'menu_navigation');
    const wantsLauncher =
        !!appSetting('layout', 'user_remote_config') &&
        !!appSetting('layout', 'apps') &&
        Array.isArray(source) &&
        source.some((item: MenuItem) => item?.launcher);
    const { menuData: launcherMenuData } = useMenuData(
        wantsLauncher ? appSetting('menu_items', 'objects', 'launcher') : null
    );

    return useMemo(() => {
        const launcherItems = wantsLauncher ? menuItemsByNameNew('menu_post', launcherMenuData, currentUser) : [];
        return menuItemsByName('main_menu', source, currentUser).map((item, index) => {
            const children = filterMenuTree(getMenuItemChildren(item), currentUser);
            return {
                key: item.name ?? String(index),
                item: { ...item, title: t(item.title) },
                rows: flattenMenuItemsForDropdown(item.launcher ? mergeNavbarMoreWithLauncher(children, launcherItems) : children)
                    .map((row) => ({ ...row, title: t(row.title) })),
            };
        });
    }, [source, wantsLauncher, launcherMenuData, currentUser, t]);
}
