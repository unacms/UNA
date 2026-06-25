import Link from 'app/ui/atoms/link';
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { usePathname } from 'app/lib/hooks/router';
import { getFriendsCounter } from 'app/customization/functions';
import { Icon } from 'app/ui/atoms/icon'
import { useTranslation } from 'react-i18next';
import { useFooter, useSetFooterHeight } from 'app/context/jotai/layout';
import { useCallback, useEffect, useState } from 'react';
import { useSound } from 'app/lib/hooks/useSound';

function isInStandaloneMode() {
    if (window.navigator.standalone) {
        return true;
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    return false;
}

export default function () {
    const { currentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    const { t } = useTranslation();
    const notifCount = currentUser ? currentUser.notifications : 0;
    const iFrCounter = getFriendsCounter(currentUser);
    let pathname = usePathname()
    const footer = useFooter();
    const setFooterHeight = useSetFooterHeight();

    const hideForGuest = !currentUser && !appSetting('layout', 'show_tabbar_on_mobile_non_logged');
    const isFooterEnabled = Boolean(footer);
    const lockUnconfirmed = appSetting('layout', 'lock_unconfirmed') && !currentUser?.confirmed;
    const shouldHide = lockUnconfirmed || hideForGuest || !isFooterEnabled;
    
    useEffect(() => {
        // When the tab bar is not rendering (early return), immediately clear the
        // stored height so Page.minHeight is not incorrectly reduced.
        if (shouldHide) setFooterHeight(0);
        // Also clear on unmount so stale values never survive navigation.
        return () => setFooterHeight(0);
    }, [shouldHide]);

    if (shouldHide)
        return null

    if (pathname == '/')
        pathname = '/home';

   
    return (
        <View
            className={
                `min-h-16 fixed bottom-0 left-0 z-30 border-t border-black/5 dark:border-black/20 w-full lg:hidden bg-card ${isInStandaloneMode() ? "pb-4" : ""}`
            }
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
            <View
                className={`z-50 w-full pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row w-full px-2 gap-2">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = appSetting('messenger', 'url') === tab.url ? pathname.includes(tab.url) : pathname === tab.url;
                        return <MenuBottomItem key={`bmi-${index}`} notifCount={notifCount} iFrCounter={iFrCounter} link={tab.url} badge={tab.badge} index={index} icon={tab.icon} title={t(tab.title)} isActive={isActive} animated={tab.animated} addClassName={tab.addClassName} />
                    })}
                </Row>
            </View>
        </View>
    );
}

function MenuBottomItem({ link, title, badge, icon, isActive, iFrCounter, notifCount, animated, addClassName }) {
    const { currentUser } = useCurrentUser();
    const playSound = useSound('click');
    const useAnimatedIcon = animated === true;
    const [groupHovered, setGroupHovered] = useState(false);
    const badgeObj = [
        {
            condition: (link === appSetting('notifications', 'url') || badge == 'notifications') && notifCount > 0, //to remove in 11.25 link === appSetting('notifications', 'url')
            value: { variant: 'primary', text: notifCount }
        },
        {
            condition: (link === appSetting('messenger', 'url') || badge == 'messenger') && currentUser?.counters?.bx_messenger_new_messages > 0,
            value: { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages }
        },
        {
            condition: (link === '/friends' || badge == 'friends') && iFrCounter > 0,
            value: { variant: 'primary', text: iFrCounter }
        },
        {
            condition: (badge == 'notifications, messenger') && currentUser?.counters?.bx_messenger_new_messages+notifCount > 0,
            value: { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages+notifCount }
        }
    ].find(item => item.condition)?.value || null;

    const handlePress = useCallback(() => {
           playSound();
    }, []);
    const baseIconClassName = isActive
        ? 'text-accent-foreground'
        : 'text-secondary-foreground web:group-hover:text-foreground';
    const iconClassName = addClassName ? `${baseIconClassName} ${addClassName}` : baseIconClassName;

    const link1 =  link === '{profile}' ? currentUser?.url : link


    return (
            <Link
                href={link1}
                noprefetch={link1 === appSetting('notifications', 'url') ? "false" : "true"}
                className="group w-full"
                alt={title}
                 onClick={handlePress}
            >
                <View
                    className={`justify-between my-auto items-center rounded-xl p-1.5 text-center gap-1.5 web:hover:bg-muted/50 ${isActive && 'bg-accent/60'}`}
                    onMouseEnter={useAnimatedIcon ? () => setGroupHovered(true) : undefined}
                    onMouseLeave={useAnimatedIcon ? () => setGroupHovered(false) : undefined}
                >
                    <View className="items-center justify-center">
                        {
                            link === appSetting('dashboard', 'url') || icon=='dashboard' 
                            ? <View className="w-6 h-6"><Profile  {...currentUser} url_avatar = {currentUser.avatar} url={link1} displayType="unit_wo_info" displaySize="xs" /></View> : 
                            <Icon icon={icon} size={24} animated={useAnimatedIcon} active={useAnimatedIcon ? isActive : undefined} hovered={useAnimatedIcon ? groupHovered : undefined} className={iconClassName} />
                        }
                    </View>
                    {<Text className={` web:group-hover:text-accent-foreground text-[11px] tracking-tight leading-none font-medium whitespace-nowrap ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>{title}</Text>}
                    {badgeObj && <View className={`absolute bg-destructive border-2 border-card rounded-full px-1.5 min-w-6 items-center justify-center  -top-1 left-1/2 -translate-x-1/2 ml-4`}><Text className="text-white text-xs font-medium tracking-tight leading-5 ">{badgeObj.text}</Text></View>}
                </View>
                
            </Link>
    );
}
