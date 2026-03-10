import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting, menuItemsByNameNew } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useState } from 'react';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import { useIsDesktop } from 'app/context/measure';
import { useMenuData } from 'app/context/menu-data';

export default function MenuAdd({ buttonProps, children }) {
    const bMenu = appSetting('layout', 'add_menu') == true;
    const { currentUser } = useCurrentUser();
    const { menuData } = useMenuData(appSetting('menu_items', 'objects', 'add'));
    const [pageData, setPageData] = useState(false);
    const isDesktop = useIsDesktop();

    const menu_add_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);

    if (!bMenu)
         return <></>;

    if ((menu_add_items.length == 0) && menuData)
        return <></>;
    
    const defaultButtonProps = {
        variant: isDesktop ? 'secondary' : 'text',
        rounded: 'rounded',
        startDecorator: 'Plus',
        tooltip: 'Create',
        size: isDesktop ? 'base' : 'base',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) };

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} url={pageData?.url} />
            <DropdownMenu
                onSelect={(oItem, event) => handleFormModal(oItem, event, setPageData)}
                items={menu_add_items.map(
                    (item, index) => {
                        return (
                            {
                                id: 'menu-' + index,
                                link: item.link,
                                title: item.title,
                                icon: item.icon
                            }
                        )
                    }
                )}
            >
                {!!children ? children : <Button
                    {...buttonProps}
                />}
            </DropdownMenu>
        </>
    );
}