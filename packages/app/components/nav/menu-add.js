import { View } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting, menuItemsByNameNew, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { getPageData, getBlocksFromData, getDataForMenu, storageSet, storageGet } from 'app/lib/util';
import { useState, useEffect, useMemo } from 'react';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import { useWindowDimensions } from 'react-native'


export default function MenuAdd({ buttonProps, children }) {
    const bMenu = appSetting('layout', 'add_menu') == true;
    const { currentUser } = useCurrentUser();
    const [pageData, setPageData] = useState(false);
    const cached = storageGet('menu:add', '');
    const [menuData, setMenuData] = useState(cached);
    const { width } = useWindowDimensions()
    const isLgUp = width >= LAYOUT_BREAKPOINTS.lg

    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'add'), params: null }, _setMenuData);
        };
        if (!menuData)
            fetchData();
    }, []);

    function _setMenuData(data){
        storageSet('menu:add', '', data);
        setMenuData(data)
    }

    const menu_add_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);

    if (!bMenu)
         return <></>;

    if ((menu_add_items.length == 0) && menuData)
        return <></>;
    
    const defaultButtonProps = {
        variant: isLgUp ? 'secondary' : 'text',
        rounded: 'rounded',
        startDecorator: 'Plus',
        tooltip: 'Create',
        size: isLgUp ? 'base' : 'base',
    }

    buttonProps = { ...defaultButtonProps, ...(buttonProps || {}) };

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} />
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