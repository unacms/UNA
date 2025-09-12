import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'app/ui/atoms/link'

let footerMenuDataCache = null;

const MenuFooter = ({ cntClasses, btnStyle, menu_items, variant, size, itemClassName }) => {
    const { t } = useTranslation();
    const [menuData, setMenuData] = useState(footerMenuDataCache !== null ? footerMenuDataCache : false);
    const { currentUser } = useCurrentUser();
    // Backward compatibility: derive visual props from legacy btnStyle unless explicitly provided
    const visualProps = useMemo(() => {
        const legacy = btnStyle || {};
        return {
            variant: variant ?? legacy.variant ?? 'text',
            size: size ?? legacy.size ?? 'sm',
            className: itemClassName ?? legacy.className ?? '',
        };
    }, [btnStyle, variant, size, itemClassName]);

    useEffect(() => {
        if (!menu_items && footerMenuDataCache === null) {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'footer'), params: null }, (data) => {
                footerMenuDataCache = data || [];
                setMenuData(footerMenuDataCache);
            });
        }
    }, [menu_items]);
    
    const menu_launcher_items = useMemo(() => (
        menu_items || (appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_footer'), currentUser))
    ), [menu_items, menuData, currentUser]);

    if ((menu_launcher_items.length === 0 && menuData))
        return <></>;

    return (
        <View className={cntClasses}>
            {menu_launcher_items.map((item, index) => (
                <Link
                    href={`/${item.link}`}
                    key={item.link || index}
                    variant={visualProps.variant}
                    //size={visualProps.size} discuss with Roman to restore
                    className={visualProps.className}
                >
                    {t(item.title)}
                </Link>
            ))}
        </View>
    );
};

export default memo(MenuFooter);