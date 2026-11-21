import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting, menuItemsByNameNew, getHeaderToolbarNeoButtonDefaults, flattenMenuItemsForDropdown, hasDropdownActions } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useState } from 'react';
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal';
import { useIsDesktop } from 'app/context/measure';
import { useMenuData } from 'app/context/menu-data';
import { menuViewerKey } from 'app/lib/menu-remember';

/**
 * The add menu's items, whether it has nothing to show (off in the settings, or no item for this viewer), when the
 * header leaves no slot for it, and whether it is still `loading` (the header draws a placeholder in its slot).
 * `load` false skips loading the menu. A member's menu is kept on the device (lib/menu-remember.ts), so it loads
 * only the first time.
 */
export function useMenuAddItems(load = true) {
    const bMenu = appSetting('layout', 'add_menu') == true;
    const { currentUser } = useCurrentUser();
    // `menu_add` setting pins the items; unset, they come from UNA's add-content menu.
    const staticItems = appSetting('menu_items', 'menu_add');
    const useStatic = Array.isArray(staticItems) && staticItems.length > 0;
    const { menuData, isFetched } = useMenuData(
        load && !useStatic ? appSetting('menu_items', 'objects', 'add') : null,
        { rememberFor: menuViewerKey(currentUser) }
    );

    const items = useStatic
        ? menuItemsByName('', staticItems, currentUser)
        : menuItemsByNameNew('menu_post', menuData, currentUser);
    const known = useStatic || !!menuData || isFetched;

    return { items, empty: !bMenu || (!hasDropdownActions(items) && known), loading: bMenu && load && !known };
}

/**
 * The add-content menu with its trigger: a round "+" (the header's), `buttonProps` over it, or `children`.
 * @param {{ buttonProps?: Record<string, any>, children?: import('react').ReactNode }} props
 */
export default function MenuAdd({ buttonProps, children }) {
    const { items: menu_add_items, empty } = useMenuAddItems();
    const [pageData, setPageData] = useState(false);
    const isDesktop = useIsDesktop();

    if (empty)
        return <></>;
    
    const defaultButtonProps = {
        ...getHeaderToolbarNeoButtonDefaults(isDesktop),
        borderShape: 'circle',
        image: 'Plus',
        tooltip: 'Create',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) };

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} url={pageData?.url} />
            <DropdownMenu
                align="auto"
                onSelect={(oItem, event) => { setPageData('loading'); handleFormModal(oItem, event, setPageData) }}
                items={flattenMenuItemsForDropdown(menu_add_items).map((item, index) => {
                    if (item.type === 'group_header') {
                        return {
                            id: item.id ?? `header-${index}`,
                            type: 'group_header',
                            title: item.title,
                            first: item.first,
                        };
                    }
                    return {
                        id: item.id ?? 'menu-' + index,
                        link: item.link,
                        title: item.title,
                        icon: item.icon,
                        description: item.description,
                    };
                })}
                buttonProps={children ? undefined : buttonProps}
            >
                {!!children && children}
            </DropdownMenu>
        </>
    );
}