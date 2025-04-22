import Link from 'app/ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { usePathname } from 'next/navigation'
import { callFn } from 'app/lib/functions/call';
import { Icon } from 'app/ui/atoms/icon'
import { Theme } from 'app/design/theme';

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

    const notifCount = currentUser ? currentUser.notifications : 0;
    const iFrCounter = callFn("getFriendsCounter", [currentUser]);
    console.log("iFrCounter", iFrCounter)
    let pathname = usePathname()

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')
        profile = <View className="w-[32px] h-[32px] p-[4px]"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
    }

    if (pathname == '/')
        pathname = '/home';

    return (
        <View
            className={
                `min-h-16 fixed bottom-0 left-0 z-30 w-full lg:hidden shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.1] tabbar bg-bgrtabbar dark:bg-bgrtabbar-d ${isInStandaloneMode() ? "pb-4" : ""}`
            }
        >
            <View
                className={`z-50 w-full pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row w-full px-2 gap-x-2">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = appSetting('messenger', 'url') === tab.url ? pathname.includes(tab.url) : pathname === tab.url;
                        return <MenuBottomItem key={`bmi-${index}`} notifCount={notifCount} iFrCounter={iFrCounter} profile={profile} link={tab.url} index={index} icon={tab.icon} title={tab.title} isActive={isActive} />
                    })}
                </Row>
            </View>
        </View>
    );
}

function MenuBottomItem({ link, title, index, icon, isActive, profile, iFrCounter, notifCount }) {
    const { currentUser } = useCurrentUser();
    const { colors } = Theme();
    const badge = [
        {
            condition: link === appSetting('notifications', 'url') && notifCount > 0,
            value: { variant: 'primary', text: notifCount }
        },
        {
            condition: link === appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages > 0,
            value: { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages }
        },
        {
            condition: link === '/friends' && iFrCounter > 0,
            value: { variant: 'primary', text: iFrCounter }
        }
    ].find(item => item.condition)?.value || null;

    console.log("badge", link, badge)

    return (
        <View
            
            className=" w-full flex-auto items-center "
        >
            <Link
                href={link}
                noprefetch={link === appSetting('notifications', 'url') ? "false" : "true"}
                className="w-full"
            >
                 {isActive && (
                    <View className="-top-3 w-full bg-primary dark:bg-primary-d rounded-xl h-0.5 animate-appear" />
                )}
                <View className={` items-center ${isActive && ''}`}>
                    <Text className={`${isActive ? 'text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {link === appSetting('dashboard', 'url') ? profile : <Icon icon={icon} color={isActive ? colors.primary : colors.default} />}
                    </Text>
                    {<Text className={`group-hover:text-primary dark:group-hover:text-primary text-[12px] tracking-tight  leading-[16px] whitespace-nowrap ${isActive ? 'text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}>{title}</Text>}
                    {badge && <View className={`absolute  bg-contrast dark:bg-contrast-d border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2`}><Text className="text-white text-xs ">{badge.text}</Text></View>}
                </View>
               
            </Link>
        </View>
    );
}
/*<Button
                        variant="tab"
                        
                        size="sm"
                        fullWidth={true}
                        pressed={isActive}
                        indicator={isActive}
                        indicatorPosition="top"
                        indicatorClassName="animate-appear h-[3px] w-full bg-primary dark:bg-primary-d -translate-y-[5px] rounded-full"
                        startDecorator={link === appSetting('dashboard', 'url') && profile ? null : icon}
                        direction="flex-col bg-transparent "
                        addon={link === appSetting('notifications', 'url') && notifCount > 0 ? 
                            {variant: 'primary', text: notifCount} : 
                            link === appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages > 0 ? 
                            {variant: 'primary', text: currentUser.counters.bx_messenger_new_messages} :
                            link === '/friends-all' && iFrCounter > 0 ?
                            {variant: 'primary', text: iFrCounter} : 
                          null}
                    >
                        {link === appSetting('dashboard', 'url') && profile ? (
                            profile
                        ) : null}
                            {!!title && (
                            <Text
                                className={`group-hover:text-primary dark:group-hover:text-primary text-[12px] tracking-tight leading-[14px] whitespace-nowrap ${textColor}`}
                            >
                                {title}
                            </Text>
                        )}
                    
                    </Button>*/
