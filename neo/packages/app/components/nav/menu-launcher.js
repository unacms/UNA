import { useCurrentUser } from 'app/context/user'
import {
    appSetting,
    getHeaderToolbarNeoButtonDefaults,
    menuItemsByName,
    menuItemsByNameNew,
    flattenMenuItemsForDropdown,
    hasDropdownActions,
    normalizeMenuItemHref,
} from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useIsDesktop } from 'app/context/measure';
import { useMenuData } from 'app/context/menu-data';
import { menuViewerKey } from 'app/lib/menu-remember';

/**
 * The apps menu's items, whether it has nothing to show (off in the settings, or no item for this viewer), when the
 * header leaves no slot for it, and whether it is still `loading` (the header draws a placeholder in its slot).
 * `load` false skips loading the menu. A member's menu is kept on the device (lib/menu-remember.ts), so it loads
 * only the first time.
 */
export function useMenuLauncherItems(load = true) {
    const bApps = appSetting('layout', 'apps');
    const { currentUser } = useCurrentUser();
    // `menu_launcher` setting pins the apps; unset, they come from UNA's launcher menu.
    const staticItems = appSetting('menu_items', 'menu_launcher');
    const useStatic = Array.isArray(staticItems) && staticItems.length > 0;
    const { menuData, isFetched } = useMenuData(
        load && !useStatic ? appSetting('menu_items', 'objects', 'launcher') : null,
        { rememberFor: menuViewerKey(currentUser) }
    );

    const items = useStatic
        ? menuItemsByName('', staticItems, currentUser)
        : menuItemsByNameNew('menu_post', menuData, currentUser);
    const known = useStatic || !!menuData || isFetched;

    return { items, empty: !bApps || (!hasDropdownActions(items) && known), loading: !!bApps && load && !known };
}

export default function MenuLauncher({ buttonProps }) {
    const bApps = appSetting('layout', 'apps');
    const isDesktop = useIsDesktop();
    const { t } = useTranslation();
    const { items: menu_launcher_items, empty } = useMenuLauncherItems();

    if (empty)
        return <></>;

    return (
        <DropdownMenu
            align="auto"
            variant="grid"
            items={flattenMenuItemsForDropdown(menu_launcher_items).flatMap((item, index) => {
                if (item.type === 'group_header' || item.type === 'separator') return [];
                return [{
                    id: item.id ?? `menu-${index}`,
                    link: normalizeMenuItemHref(item.link),
                    title: t(item.title),
                    icon: item.icon,
                    image: item.image,
                    animated: item.animated,
                    target: item.target,
                }];
            })}
            buttonProps={{
                tooltip: 'All Apps',
                borderShape: 'circle',
                accessibilityLabel: t('All Apps'),
                image: bApps === true ? 'LayoutGrid' : bApps,
                ...getHeaderToolbarNeoButtonDefaults(isDesktop),
                ...(buttonProps || {}),
            }}
        />
    );
}