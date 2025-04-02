import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';

export default function () {

    const bApps = appSetting('layout', 'apps') == true;
    const [menuData, setMenuData] = useState(false);
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'launcher'), params: null }, setMenuData);
        };
        fetchData();
    }, []);

    const menu_launcher_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_launcher'), currentUser);

    if ((menu_launcher_items.length == 0 && menuData) || !bApps)
        return <></>;

    return (
        <View className="relative flex-row">
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
                    size="base"
                    solid
                    fullWidth
                    rounded
                    alt={t("All Apps")}
                    startDecorator="LayoutGrid"
                />
            </DropdownMenu>
        </View>
    );
}