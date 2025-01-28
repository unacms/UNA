import Link from 'app/ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next';
import { callFn } from 'app/lib/functions/call';

function isInStandaloneMode() {
    if (window.navigator.standalone) {
        return true;
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    return false;
}

export default function () {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    const notifCount = currentUser ? currentUser.notifications : 0;
    const iFrCounter = callFn("getFriendsCounter", [currentUser]);

    let pathname = usePathname()

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />
    }

    if (pathname == '/')
        pathname = '/home';

    return (
        <View
            className={
                ` fixed bottom-0 left-0 z-30 w-full lg:hidden border-t border-bdrnavbar dark:border-bdrnavbar-d tabbar bg-bgrtabbar dark:bg-bgrtabbar-d ${isInStandaloneMode() ? "pb-4" : ""}`
            }
        >
            <View
                className={`z-50 w-full px-2 pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row justify-around w-full">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = pathname === tab.url;
                        const textColor = isActive ? "text-primary" : "text-neutral-700 dark:text-neutral-300";
    
                        return (
                            <View
                                key={"fl" + index}
                                className={` ${ isActive ? 'bg-primary/10' : 'transparent' } w-1/6 flex items-center rounded-lg text-base p-1.5 duration-200 group hover:text-primary dark:hover:text-primary ${textColor}`}
                            >
                                <Link
                                    href={tab.url}
                                    noprefetch={tab.url === appSetting('notifications', 'url') ? "false" : "true"}
                                >
                                    <View className="flex-col gap-1 items-center">
                                        {tab.url === appSetting('dashboard', 'url') && profile ? (
                                            profile
                                        ) : (
                                            <Icon icon={tab.icon} width={24} height={24} />
                                        )}
    
                                        {!!tab.title && (
                                            <Text
                                                className={`group-hover:text-primary dark:group-hover:text-primary text-[10px] whitespace-nowrap ${textColor}`}
                                            >
                                                {tab.title}
                                            </Text>
                                        )}
    
                                        {tab.url === appSetting('notifications', 'url') && notifCount > 0 && (
                                            <View className="absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full px-1.5 items-center justify-center -right-1 -top-2">
                                                <Text className="text-white text-xs font-semibold">{notifCount}</Text>
                                            </View>
                                        )}
    
                                        {tab.url === appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages > 0 && (
                                            <View className="absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full px-1.5 items-center justify-center -right-1 -top-2">
                                                <Text className="text-white text-xs font-semibold">
                                                    {currentUser.counters.bx_messenger_new_messages}
                                                </Text>
                                            </View>
                                        )}
    
                                        {tab.url === '/friends-all' && iFrCounter > 0 && (
                                            <View className="absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full px-1.5 items-center justify-center -right-1 -top-2">
                                                <Text className="text-white text-xs font-semibold">{iFrCounter}</Text>
                                            </View>
                                        )}
                                    </View>
                                </Link>
                            </View>
                        );
                    })}
                </Row>
            </View>
        </View>
    );
} 
