import { View } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import Link from 'app/ui/atoms/link'

export default function ({ cntClasses, btnStyle, menu_items }) {
    const [menuData, setMenuData] = useState(false);
    const { currentUser, setCurrentUser } = useCurrentUser();
    const btnStyle1 = btnStyle || {
        variant: "text",
        size: "sm",
    }
    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'footer'), params: null }, setMenuData);
        };
        if (!menu_items)
            fetchData();
    }, []);
    
    const menu_launcher_items = menu_items || (appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_footer'), currentUser));

    if ((menu_launcher_items.length == 0 && menuData))
        return <></>;

    return (
        <View className={cntClasses}>
            {menu_launcher_items.map((item, index) => (
                <Link href={`/${item.link}`} key={item.link || index}>
                    <Button
                        {...btnStyle1}
                        title={item.title}
                    />
                </Link>
            ))}
        </View>
    );
}