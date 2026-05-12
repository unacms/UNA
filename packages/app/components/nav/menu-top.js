import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { getComponent } from 'app/components/registry';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

// Persist indicator state across remounts (web/native)
let __menuTopIndicatorPersist = { initialized: false, translateX: 0, width: 0 };

export default function MenuTop({ url, uri }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    // Compute active index based on current route
    const activeIndex = useMemo(() => {
        return menu_navbar_items.findIndex((item) => (item.link === '/' + url) || (item.link === '/' && uri === 'home'));
    }, [menu_navbar_items, url, uri]);

    // Track measured layouts for each tab item
    const [itemLayouts, setItemLayouts] = useState({});
    const [containerLayout, setContainerLayout] = useState({ x: 0, measured: false });
    const [indicatorStyle, setIndicatorStyle] = useState({ 
        translateX: __menuTopIndicatorPersist.translateX, 
        width: __menuTopIndicatorPersist.width, 
        visible: false
    });

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

    useEffect(() => {
        if (activeIndex == null) {
            return;
        }
        if (activeIndex === -1) {
            setIndicatorStyle({ translateX: 0, width: 0, visible: false });
            return;
        }
       const target = itemLayouts[activeIndex];
        if (!(target && typeof target.x === 'number' && typeof target.width === 'number')) {
            // Keep the previous dimensions but hide the indicator until active tab layout is measured.
            setIndicatorStyle((prev) => prev.visible ? { ...prev, visible: false } : prev);
            return;
        }
        if (Platform.OS === 'web' && !containerLayout.measured) {
            setIndicatorStyle((prev) => prev.visible ? { ...prev, visible: false } : prev);
            return;
        }

        const translateX = Platform.OS === 'web'
            ? target.x - containerLayout.x
            : target.x;

        setIndicatorStyle((prev) => {
            if (prev.translateX === translateX && prev.width === target.width && prev.visible === true) {
                return prev;
            }
            return { translateX, width: target.width, visible: true };
        });
        // Persist for future remounts
        __menuTopIndicatorPersist = { initialized: true, translateX, width: target.width };
        
    }, [activeIndex, itemLayouts, containerLayout]);

    const MenuTopItem = getComponent('menu-item', 'topmenu');

    return (
        <Row
            className={`${appSetting('layout', 'header', 'content_center')} relative`}
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
                            items={item.items}
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
