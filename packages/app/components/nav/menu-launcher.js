import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu, storageSet, storageGet } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';

export default function () {

    const bApps = appSetting('layout', 'apps') == true;
    const cached = storageGet('menu:launcher', '');

    const [menuData, setMenuData] = useState(cached);
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();

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

    if ((menu_launcher_items.length == 0) || !bApps)
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
                    variant="secondary"
                    rounded
                    alt={t("All Apps")}
                    startDecorator="LayoutGrid"
                    hitSlop={4}
                    
                    size="base"
                    
                />
            </DropdownMenu>
    );
}