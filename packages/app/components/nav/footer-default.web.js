import Link from 'app/ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next';

export default function () {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu_items', 'menu_tabbar_logged') : appSetting('menu_items', 'menu_tabbar_non_logged');
    const notifCount = currentUser ? currentUser.notifications : 0;
    let frCount = 0;
    if (currentUser?.counters) {
        frCount = currentUser.counters.respects + currentUser.counters.trust
        if (frCount == 0)
            frCount = currentUser.counters.requests;
    }
    const { t } = useTranslation();
    const pathname = usePathname()

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />
    }

    function isInStandaloneMode() {
        if (window.navigator.standalone) {
            return true;
        } else if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        return false;
    }

    return (
        <View className={"fixed bottom-0 left-0 z-30 w-full backdrop-blur lg:hidden tabbar bg-bgrtabbar dark:bg-bgrtabbar-d "+ (isInStandaloneMode()? "pb-4": "")}>
            <View className={" backdrop-blur z-50  bg-bgrnavbar dark:bg-bgrnavbar-d border-t  border-bdrnavbar dark:border-bdrnavbar-d w-full px-2  "+ (isInStandaloneMode()? "h-12": "h-16")}>
                <Row className="flex-auto items-center flex-row  justify-around  w-full ">
                    {TabList.filter(item => (item.hide != true ) ).map((tab, index) => (
                        <View key={"fl" + index} className={'w-1/6 flex items-center rounded-lg text-base p-1.5 duration-200 group hover:text-primary dark:hover:text-primary ' + (pathname != tab.url ? 'text-neutral-700 dark:text-neutral-300' : 'text-primary')}>
                            <Link href={tab.url} noprefetch={tab.url == appSetting('layout', 'notifications') ? "false" : "true"}>
                                <View className='flex-col gap-1 items-center'>
                                    {tab.url == appSetting('layout', 'dashboard') && profile ? profile : <Icon icon={tab.icon} width={24} height={24} />}
                                    {!!tab.title && <Text className={'group-hover:text-primary dark:group-hover:text-primary  text-[10px] whitespace-nowrap ' + (pathname != tab.url ? 'text-neutral-700 dark:text-neutral-300' : 'text-primary')}>{tab.title}</Text>}
                                    {(tab.url == appSetting('layout', 'notifications') && notifCount > 0) && <View className='absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2'><Text className='text-white text-xs font-semibold'>{notifCount}</Text></View>}
                                    {(tab.url == appSetting('layout', 'messenger') && currentUser?.counters?.bx_messenger_new_messages > 0) && <View className='absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2'><Text className='text-white text-xs font-semibold'>{currentUser?.counters?.bx_messenger_new_messages}</Text></View>}
                                    {(tab.url == '/friends-all' && frCount > 0) && <View className='absolute bg-contrast border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2'><Text className='text-white text-xs font-semibold'>{frCount}</Text></View>}
                                </View>
                            </Link>
                        </View>
                    ))}
                </Row>
            </View>
        </View>
    );
} 
