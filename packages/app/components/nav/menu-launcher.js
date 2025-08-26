import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu, storageSet, storageGet } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native'

export default function () {
    const bApps = appSetting('layout', 'apps') == true;
    const cached = storageGet('menu:launcher', '');

    const [menuData, setMenuData] = useState(cached);
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();
    const { width } = useWindowDimensions()
    const isLgUp = width >= LAYOUT_BREAKPOINTS.lg
    const buttonVariant = isLgUp ? 'secondary' : 'text'
    const buttonSize = isLgUp ? 'base' : 'base'

     useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'launcher'), params: null }, _setMenuData);
        };
        if (!menuData)
            fetchData();
    }, []);

    function _setMenuData(data){
        storageSet('menu:launcher', '', data);
        setMenuData(data)
    }

    const menu_launcher_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_launcher'), currentUser);
    
    if (!bApps)
         return <></>;
    if ((menu_launcher_items.length == 0) && menuData)
        return <></>;

    return (
     
            <DropdownMenu items={menu_launcher_items.map((item, index) => ({
                id: 'menu-' + index,
                link: '/' + item.link,
                title: t(item.title),
                icon: item.icon,
            }))}
            >
                <ButtonRef
                    tooltip="All Apps"
                    rounded
                    alt={t("All Apps")}
                    startDecorator="LayoutGrid"
                    variant={buttonVariant}
                    size={buttonSize}
                />
            </DropdownMenu>
    );
}