import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu, storageSet, storageGet } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { useIsDesktop } from 'app/context/measure';
import { useMenuData } from 'app/context/menu-data';

export default function () {
    const bApps = appSetting('layout', 'apps');

    const isDesktop = useIsDesktop();
    const { menuData } = useMenuData(appSetting('menu_items', 'objects', 'launcher'));

    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();

    const menu_launcher_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_launcher'), currentUser);

    if (!bApps)
        return <></>;
    if ((menu_launcher_items.length == 0) && menuData)
        return <></>;

    return (
        <DropdownMenu
            items={menu_launcher_items.map((item, index) => ({
                id: `menu-${index}`,
                link: '/' + item.link,
                title: t(item.title),
                icon: item.icon,
            }))}
            buttonProps={{
                tooltip: 'All Apps',
                borderShape: 'circle',
                accessibilityLabel: t('All Apps'),
                image: bApps === true ? 'LayoutGrid' : bApps,
                style: isDesktop ? 'bordered' : 'borderless',
                controlSize: isDesktop ? 'large' : 'regular',
            }}
        />
    );
}