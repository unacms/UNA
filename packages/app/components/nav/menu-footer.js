import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useMemo, memo } from 'react';
import Link from 'app/ui/atoms/link'
import { useCurrentUserNoCounters } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';

function MenuFooterComponent({
    cntClasses,
    btnStyle,
    menu_items,
    variant = 'ghost',
    size = 'sm',
    itemClassName = '',
}) {

    const { t } = useTranslation();
    const currentUser = useCurrentUserNoCounters();
    const { menuData } = useMenuData(appSetting('menu_items', 'objects', 'footer'));

    const visualProps = useMemo(() => {
        const legacy = btnStyle || {};
        return {
            variant: variant ?? legacy.variant ?? 'ghost',
            size: size ?? legacy.size ?? 'sm',
            className: itemClassName ?? legacy.className ?? '',
        };
    }, [btnStyle, variant, size, itemClassName]);
  
    
    const menu_launcher_items = useMemo(() => (
        menu_items || (appSetting('layout', 'user_remote_config')
            ? menuItemsByNameNew('menu_post', menuData, currentUser)
            : menuItemsByName('', appSetting('menu_items', 'menu_footer'), currentUser))
    ), [menu_items, menuData, currentUser]);

    if (menu_launcher_items.length === 0 && menuData)
        return null;

    return (
        <View className={cntClasses}>
            {menu_launcher_items.map((item, index) => (
                <Link
                    href={`/${item.link}`}
                    key={item.link || index}
                    variant={visualProps.variant}
                    size={visualProps.size}
                    className={visualProps.className}
                >
                    {t(item.title)}
                </Link>
            ))}
        </View>
    );
}

export default memo(MenuFooterComponent);