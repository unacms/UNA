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
import { useCallback, useEffect } from 'react';
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

    const shouldHide = (!currentUser && !appSetting('layout', 'show_tabbar_on_mobile_non_logged')) || !footer;

    useEffect(() => {
        // When the tab bar is not rendering (early return), immediately clear the
        // stored height so Page.minHeight is not incorrectly reduced.
        if (shouldHide) setFooterHeight(0);
        // Also clear on unmount so stale values never survive navigation.
        return () => setFooterHeight(0);
    }, [shouldHide]);

    if (shouldHide)
        return null

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')
        profile = <View className="w-7 h-7"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
    }

    if (pathname == '/')
        pathname = '/home';

   
    return (
        <View
            className={
                `min-h-16 fixed bottom-0 left-0 z-30 w-full lg:hidden bg-card ${isInStandaloneMode() ? "pb-4" : ""}`
            }
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
            <View
                className={`z-50 w-full pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row w-full px-1 gap-1">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = appSetting('messenger', 'url') === tab.url ? pathname.includes(tab.url) : pathname === tab.url;
                        return <MenuBottomItem key={`bmi-${index}`} notifCount={notifCount} iFrCounter={iFrCounter} profile={profile} link={tab.url} badge={tab.badge} index={index} icon={tab.icon} title={t(tab.title)} isActive={isActive} />
                    })}
                </Row>
            </View>
        </View>
    );
}

function MenuBottomItem({ link, title, index, badge, icon, isActive, profile, iFrCounter, notifCount }) {
    const { currentUser } = useCurrentUser();
    const playSound = useSound('click');
    const badgeObj = [
        {
            condition: (link === appSetting('notifications', 'url') || badge.includes == 'notifications') && notifCount > 0, //to remove in 11.25 link === appSetting('notifications', 'url')
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


    return (
            <Link
                href={link}
                noprefetch={link === appSetting('notifications', 'url') ? "false" : "true"}
                className="w-full"
                alt={title}
                 onClick={handlePress}
            >
                <View className={`justify-between my-auto items-center rounded-xl p-1.5 text-center gap-1 web:hover:bg-muted/60 justify-center ${isActive && 'bg-accent/10'}`}>
                    <Text className={`${isActive ? 'text-accent-foreground' : 'text-secondary-foreground web:group-hover:text-foreground'}`}>
                        {link === appSetting('dashboard', 'url') ? profile : <Icon icon={icon} size={28} />}
                    </Text>
                    {<Text className={` web:group-hover:text-accent-foreground text-xs tracking-tight leading-none font-medium whitespace-nowrap ${isActive ? 'text-accent-foreground' : 'text-muted-foreground web:group-hover:text-foreground'}`}>{title}</Text>}
                    {badgeObj && <View className={`absolute bg-destructive border-2 border-card rounded-full px-1.5 min-w-6 items-center justify-center  -top-1 left-1/2 -translate-x-1/2 ml-4`}><Text className="text-white text-xs font-medium tracking-tight leading-5 ">{badgeObj.text}</Text></View>}
                </View>
                
            </Link>
    );
}
