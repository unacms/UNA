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
        visible: false
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

        setIndicatorStyle((prev) => {
            if (prev.translateX === target.x && prev.width === target.width && prev.visible === true) {
                return prev;
            }
            return { translateX: target.x, width: target.width, visible: true };
        });
        // Persist for future remounts
        __menuTopIndicatorPersist = { initialized: true, translateX: target.x, width: target.width };
        
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
                className="rounded-full flex-none bg-ring absolute -bottom-2 left-0 h-0.5"
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
        <Link variant="text" size="lg" className=" min-w-16 flex-auto relative group web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <Tooltip content={title}>
                <View className="flex-auto web:group" key={`menu-${index}`}>
                    <Row
                        className={`items-center content-center justify-center px-2 h-12 flex-auto flex-wrap rounded-lg  ${isActive
                            ? ' web:hover:bg-accent/60 active:bg-accent text-accent-foreground'
                            : 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/80 web:group-focus:bg-muted/80 web:active:bg-border/80 '
                            }`}
                    >
                        <Icon
                            icon={icon}
                            className={`${isActive ? "text-accent-foreground h-9 w-9 my-auto items-center justify-center flex" : "text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                        />
                        {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground'} text-sm px-2 leading-5`}>{title}</Text>}
                    </Row>
                </View>
            </Tooltip>
        </Link>
    )
}
