import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

// Persist indicator state across remounts (web/native)
let __menuTopIndicatorPersist = { initialized: false, x: 0, width: 0 };

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

    const handleItemLayout = (index, layout) => {
        setItemLayouts((prev) => {
            const width = layout?.width || 0;
            const x = layout?.x || 0;
            if (prev[index] && prev[index].width === width && prev[index].x === x) return prev;
            return { ...prev, [index]: { width, x } };
        });
    };

    // Animated underline shared values
    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const hasPositionedRef = useRef(false);

    // Restore last known position on mount to avoid starting from 0
    useEffect(() => {
        if (__menuTopIndicatorPersist.initialized && !hasPositionedRef.current) {
            indicatorX.value = __menuTopIndicatorPersist.x;
            indicatorWidth.value = __menuTopIndicatorPersist.width;
            hasPositionedRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (activeIndex != null && activeIndex >= 0) {
            const target = itemLayouts[activeIndex];
            if (target && typeof target.x === 'number' && typeof target.width === 'number') {
                if (!hasPositionedRef.current) {
                    // First paint after mount/remount: place without anim to avoid jumping from 0
                    indicatorX.value = target.x;
                    indicatorWidth.value = target.width;
                    hasPositionedRef.current = true;
                } else {
                    indicatorX.value = withSpring(target.x, { damping: 20, stiffness: 200, mass: 0.8 });
                    indicatorWidth.value = withSpring(target.width, { damping: 20, stiffness: 200, mass: 0.8 });
                }
                // Persist latest for future remounts
                __menuTopIndicatorPersist = { initialized: true, x: target.x, width: target.width };
            }
        }
    }, [activeIndex, itemLayouts]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        transformOrigin: 'left center',
        width: `${indicatorWidth.value}px`,
    }), [indicatorX, indicatorWidth, activeIndex]);

    return (
        <Row className={`${appSetting('layout', 'header', 'content_center')} relative`}>
            {menu_navbar_items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <View key={`wrap-${index}`} onLayout={(e) => handleItemLayout(index, e?.nativeEvent?.layout)} className="flex-auto relative">
                        <MenuTopItem
                            index={index}
                            link={item.link}
                            icon={item.icon}
                            isTitle={item.showTitle}
                            title={t(item.title)}
                            isActive={isActive}
                        />
                    </View>
                );
            })}
            {activeIndex > -1 && <Animated.View style={[animatedStyle, { pointerEvents: 'none' }]} className="rounded-full flex-none bg-primary/80 absolute -bottom-2 left-0 h-[3px]" />}
        </Row>

    )
}

function MenuTopItem({ link, title, index, icon, isTitle, isActive }) {
    return (
        <Link className=" rounded-xl min-w-16 flex-auto relative " href={link} alt={title}>
            <Tooltip content={title}>
                <View className="flex-auto group" key={`menu-${index}`}>
                    <Row
                        className={`items-center justify-center h-12 min-w-14 px-1.5 flex-auto rounded-xl web:duration-200 web:group-active:opacity-50 ${isActive
                            ? 'bg-transparent text-primary'
                            : 'text-muted-foreground web:group-hover:text-foreground web:hover:bg-muted/60 active:bg-muted'
                            }`}
                    >
                        <Icon
                            icon={icon}
                            className={`${isActive ? "text-primary h-9 w-9 items-center justify-center flex" : "text-muted-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                        />
                        {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-primary' : 'text-neutral-800 dark:text-neutral-200'} text-base px-3 leading-6`}>{title}</Text>}
                    </Row>
                </View>
            </Tooltip>
        </Link>
    )
}
