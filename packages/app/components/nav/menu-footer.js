import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { menuItemsByName, menuItemsByNameNew, getDataForMenu } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, memo } from 'react';
import Link from 'app/ui/atoms/link'
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useCurrentUserStore } from 'app/context/user';

// Module-level store so menu data survives page transitions.
// fetched: prevents duplicate in-flight requests.
// menuData: false until API responds, then the actual data array.
const useMenuDataStore = create((set, get) => ({
    menuData: false,
    fetched: false,
    fetchMenuData: (object) => {
        if (get().fetched) return;
        set({ fetched: true });
        getDataForMenu({ object, params: null }, (data) => {
            set({ menuData: data });
        });
    },
}));

function MenuFooterComponent({
    cntClasses,
    btnStyle,
    menu_items,
    variant = 'ghost',
    size = 'sm',
    itemClassName = '',
}) {
    const { t } = useTranslation();
    const { menuData, fetchMenuData } = useMenuDataStore();

    // Subscribe only to the fields menuItemsFilter actually reads:
    // - existence (logged vs visitor)
    // - operator flag (operator-only items)
    // - membership (numeric level bitmask for UNA visibility permissions)
    // - url (profile link resolution)
    // Notification count and other volatile fields are intentionally excluded
    // to avoid re-renders on unrelated currentUser updates.
    const currentUser = useCurrentUserStore(
        useShallow((state) => {
            const u = state.currentUser;
            if (!u) return null;
            return {
                id: u.id,
                operator: u.operator,
                membership: u.membership,
                url: u.url,
            };
        })
    );

    const visualProps = useMemo(() => {
        const legacy = btnStyle || {};
        return {
            variant: variant ?? legacy.variant ?? 'ghost',
            size: size ?? legacy.size ?? 'sm',
            className: itemClassName ?? legacy.className ?? '',
        };
    }, [btnStyle, variant, size, itemClassName]);

    useEffect(() => {
        if (!menu_items) {
            fetchMenuData(appSetting('menu_items', 'objects', 'footer'));
        }
    }, [menu_items, fetchMenuData]);

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