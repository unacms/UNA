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
        profile = <View className="w-[32px] h-[32px] p-[4px]"><Profile {...dUser} displayType="unit_wo_info" displaySize="xs" /></View>
    }

    if (pathname == '/')
        pathname = '/home';

    return (
        <View
            className={
                ` fixed bottom-0 left-0 z-30 w-full lg:hidden shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.1] tabbar bg-bgrtabbar dark:bg-bgrtabbar-d ${isInStandaloneMode() ? "pb-4" : ""}`
            }
        >
            <View
                className={`z-50 w-full pb-0 ${isInStandaloneMode() ? "h-12" : "h-16"}`}
            >
                <Row className="flex-auto items-center flex-row w-full px-2 gap-x-2">
                    {TabList.filter(item => !item.hide).map((tab, index) => {
                        const isActive = pathname === tab.url;
                        const textColor = isActive ? "text-primary" : "text-neutral-700 dark:text-neutral-300";
    
                        return (
                            <View
                                key={"fl" + index}
                                className=" w-full flex-auto items-center "
                            >
                                <Link
                                    href={tab.url}
                                    noprefetch={tab.url === appSetting('notifications', 'url') ? "false" : "true"}
                                    className="w-full"
                                >
                                    <Button
                                        variant="tab"
                                        
                                        size="sm"
                                        fullWidth={true}
                                        pressed={isActive}
                                        indicator={isActive}
                                        indicatorPosition="top"
                                        indicatorClassName="animate-appear h-[3px] w-full bg-primary dark:bg-primary-d -translate-y-[5px] rounded-full"
                                        startDecorator={tab.url === appSetting('dashboard', 'url') && profile ? null : tab.icon}
                                        direction="flex-col bg-transparent "
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
                                                className={`group-hover:text-primary dark:group-hover:text-primary text-[12px] tracking-tight leading-[14px] whitespace-nowrap ${textColor}`}
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
