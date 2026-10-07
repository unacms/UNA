import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, menuItemsByNameNew, appSetting, flattenMenuItemsForDropdown, mergeNavbarMoreWithLauncher } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { components } from 'app/components/registry';
import { useMenuData } from 'app/context/menu-data';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

// Persist indicator state across remounts (web/native)
let __menuTopIndicatorPersist = { initialized: false, translateX: 0, width: 0 };

export default function MenuTop({ url, uri }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const useRemoteApps = !!appSetting('layout', 'user_remote_config') && !!appSetting('layout', 'apps');
    const { menuData: launcherMenuData } = useMenuData(
        useRemoteApps ? appSetting('menu_items', 'objects', 'launcher') : null
    );
    const launcherItems = useMemo(
        () => (useRemoteApps ? menuItemsByNameNew('menu_post', launcherMenuData, currentUser) : []),
        [useRemoteApps, launcherMenuData, currentUser]
    );
    const menu_navbar_items = useMemo(() => {
        const items = menuItemsByName(
            'main_menu',
            appSetting('menu_items', 'menu_navbar'),
            currentUser
        );
        return items.map((item) => {
            if (!item?.items?.length) return item;
            return {
                ...item,
                items: mergeNavbarMoreWithLauncher(item.items, launcherItems),
            };
        });
    }, [currentUser, launcherItems]);

    // Compute active index based on current route
    const activeIndex = useMemo(() => {
        return menu_navbar_items.findIndex((item) => (item.link === '/' + url) || (item.link === '/' && uri === 'home'));
    }, [menu_navbar_items, url, uri]);

    // Track measured layouts for each tab item
    const [itemLayouts, setItemLayouts] = useState({});
    const [containerLayout, setContainerLayout] = useState({ x: 0, measured: false });
    const handleContainerLayout = (layout) => {
        const x = layout?.x || 0;
        setContainerLayout((prev) => {
            if (prev.measured && prev.x === x) return prev;
            return { x, measured: true };
        });
    };

    const handleItemLayout = (index, layout) => {
        setItemLayouts((prev) => {
            const width = layout?.width || 0;
            const x = layout?.x || 0;
            if (prev[index] && prev[index].width === width && prev[index].x === x) return prev;
            return { ...prev, [index]: { width, x } };
        });
    };

    // The indicator is a pure function of the measured layouts. Deriving it in
    // render (instead of mirroring it into state from an effect) avoids a
    // setState-in-effect cascade: while this fiber still holds a low-priority
    // update (e.g. the onLayout updates queued during idle hydration of the page
    // Suspense boundary) React cannot bail out of a no-op dispatch eagerly, and a
    // sync render that replays those queued updaters gives itemLayouts a new
    // identity every time — an effect keyed on it would loop forever.
    const target = activeIndex >= 0 ? itemLayouts[activeIndex] : null;
    const isMeasured = !!target
        && typeof target.x === 'number' && typeof target.width === 'number'
        && (Platform.OS !== 'web' || containerLayout.measured);
    let indicatorStyle;
    if (activeIndex === -1) {
        indicatorStyle = { translateX: 0, width: 0, visible: false };
    } else if (!isMeasured) {
        // Keep the last known dimensions but hide the indicator until the active tab is measured.
        indicatorStyle = {
            translateX: __menuTopIndicatorPersist.translateX,
            width: __menuTopIndicatorPersist.width,
            visible: false,
        };
    } else {
        indicatorStyle = {
            translateX: Platform.OS === 'web' ? target.x - containerLayout.x : target.x,
            width: target.width,
            visible: true,
        };
    }

    // Persist for future remounts
    useEffect(() => {
        if (!indicatorStyle.visible) return;
        __menuTopIndicatorPersist = {
            initialized: true,
            translateX: indicatorStyle.translateX,
            width: indicatorStyle.width,
        };
    }, [indicatorStyle.visible, indicatorStyle.translateX, indicatorStyle.width]);

    const MenuTopItem = components['menu-item']['topmenu'];

    return (
        <Row
            className={`${appSetting('layout', 'header', 'content_center')} relative`}
            role="navigation"
            aria-label="Primary"
            onLayout={(e) => handleContainerLayout(e?.nativeEvent?.layout)}
        >
            <View
                className={`${appSetting('layout', 'header', 'active_item_indicator_bg')}`}
                style={{
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: indicatorStyle.visible ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out'
                }}
            />

            <View
                className={`${appSetting('layout', 'header', 'active_item_indicator')}`}
                style={{
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: indicatorStyle.visible ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out'
                }}
            />
            {menu_navbar_items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <View key={`wrap-${index}`} onLayout={(e) => handleItemLayout(index, e?.nativeEvent?.layout)} className="flex-auto relative z-10">
                        <MenuTopItem
                            index={index}
                            link={item.link}
                            icon={item.icon}
                            isTitle={item.showTitle}
                            title={t(item.title)}
                            isActive={isActive}
                            items={flattenMenuItemsForDropdown(item.items)}
                            chevron={item.chevron}
                            animated={item.animated}
                            addClassName={item.addClassName}
                        />
                    </View>
                );
            })}
        </Row>

    )
}
