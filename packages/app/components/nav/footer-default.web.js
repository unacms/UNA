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
import { Button } from 'app/design/controls';

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
                className={`z-50 w-full pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row justify-around w-full">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = pathname === tab.url;
                        const textColor = isActive ? "text-primary" : "text-neutral-700 dark:text-neutral-300";
    
                        return (
                            <View
                                key={"fl" + index}
                                className="w-1/6 flex items-center"
                            >
                                <Link
                                    href={tab.url}
                                    noprefetch={tab.url === appSetting('notifications', 'url') ? "false" : "true"}
                                >
                                    <Button
                                        variant="text"
                                        size="base"
                                        pressed={isActive}
                                        className={isActive ? 'bg-primary/10' : 'transparent'}
                                        indicator={isActive}
                                        indicatorPosition="top"
                                        indicatorClassName=" h-1 translate-y-[1px] w-full bg-primary-500 rounded-b-full"
                                        startDecorator={tab.url === appSetting('dashboard', 'url') && profile ? null : tab.icon}
                                        direction="flex-col"
                                        addon={tab.url === appSetting('notifications', 'url') && notifCount > 0 ? 
                                            {variant: 'primary', text: notifCount} : 
                                          tab.url === appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages > 0 ? 
                                            {variant: 'primary', text: currentUser.counters.bx_messenger_new_messages} :
                                          tab.url === '/friends-all' && iFrCounter > 0 ?
                                            {variant: 'primary', text: iFrCounter} : 
                                          null}
                                    >
                                        {tab.url === appSetting('dashboard', 'url') && profile ? (
                                            profile
                                        ) : null}
                                        
                                        {!!tab.title && (
                                            <Text
                                                className={`group-hover:text-primary dark:group-hover:text-primary text-[10px] whitespace-nowrap ${textColor}`}
                                            >
                                                {tab.title}
                                            </Text>
                                        )}
                                    </Button>
                                </Link>
                            </View>
                        );
                    })}
                </Row>
            </View>
        </View>
    );
} 
