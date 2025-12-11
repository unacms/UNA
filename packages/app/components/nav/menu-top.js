import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    const [indicatorStyle, setIndicatorStyle] = useState({ 
        translateX: __menuTopIndicatorPersist.translateX, 
        width: __menuTopIndicatorPersist.width, 
        visible: __menuTopIndicatorPersist.initialized 
    });

    const handleItemLayout = (index, layout) => {
        setItemLayouts((prev) => {
            const width = layout?.width || 0;
            const x = layout?.x || 0;
            if (prev[index] && prev[index].width === width && prev[index].x === x) return prev;
            return { ...prev, [index]: { width, x } };
        });
    };

    useEffect(() => {
        if (activeIndex != null && activeIndex >= 0) {
            const target = itemLayouts[activeIndex];
            if (target && typeof target.x === 'number' && typeof target.width === 'number') {
                setIndicatorStyle({ translateX: target.x, width: target.width, visible: true });
                // Persist for future remounts
                __menuTopIndicatorPersist = { initialized: true, translateX: target.x, width: target.width };
            }
        }
        if(activeIndex == -1){
             setIndicatorStyle({ translateX: 0, width: 0, visible: false });
        }
    }, [activeIndex, itemLayouts]);

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
            <View 
                className="rounded-full flex-none bg-ring absolute -bottom-2 left-0 h-[3px]"
                style={{ 
                    width: indicatorStyle.width,
                    transform: `translateX(${indicatorStyle.translateX}px)`,
                    opacity: indicatorStyle.visible ? 1 : 0,
                    pointerEvents: 'none',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out'
                }}
            />
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
                            ? 'bg-transparent text-accent-foreground'
                            : 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/60 active:bg-accent'
                            }`}
                    >
                        <Icon
                            icon={icon}
                            className={`${isActive ? "text-accent-foreground h-9 w-9 items-center justify-center flex" : "text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                        />
                        {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground'} text-base px-3 leading-6`}>{title}</Text>}
                    </Row>
                </View>
            </Tooltip>
        </Link>
    )
}
