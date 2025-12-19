import Link from 'app/ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { usePathname } from 'app/lib/hooks/router';
import { getFriendsCounter } from 'app/functions';
import { Icon } from 'app/ui/atoms/icon'
import { useTranslation } from 'react-i18next';
import { useFooter } from 'app/context/jotai/layout';

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

    if (!currentUser && !appSetting('layout', 'show_tabbar_on_mobile_non_logged')|| !footer)
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
                `min-h-16 fixed bottom-0 backdrop-blur-xl left-0 z-30 w-full lg:hidden shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.1] tabbar bg-bgrtabbar dark:bg-bgrtabbar-d ${isInStandaloneMode() ? "pb-4" : ""}`
            }
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
        }
    ].find(item => item.condition)?.value || null;

    return (
            <Link
                href={link}
                noprefetch={link === appSetting('notifications', 'url') ? "false" : "true"}
                className="w-full"
                alt={title}
            >
                <View className={`flex flex-col justify-between my-auto items-center rounded-xl p-1.5 text-center gap-1 hover:bg-muted/60 justify-center ${isActive && 'bg-accent/10'}`}>
                    <Text className={`${isActive ? 'text-label-link' : 'text-secondary-foreground group-hover:text-foreground'}`}>
                        {link === appSetting('dashboard', 'url') ? profile : <Icon icon={icon} size={28} />}
                    </Text>
                    {<Text className={` group-hover:text-label-linkhover text-xs tracking-tight leading-none font-medium whitespace-nowrap ${isActive ? 'text-label-link' : 'text-muted-foreground group-hover:text-foreground'}`}>{title}</Text>}
                    {badgeObj && <View className={`absolute bg-destructive border-2 border-card rounded-full px-1.5 min-w-6 items-center justify-center  -top-1 left-1/2 -translate-x-1/2 ml-4`}><Text className="text-white text-xs font-medium tracking-tight leading-5 ">{badgeObj.text}</Text></View>}
                </View>
            </Link>
    );
}
