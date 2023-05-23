import Link from '../ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';

export default function () {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');

    let profile = null
    if (currentUser){
        let dUser = currentUser;
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />
    }

 	return (
        <View className=" backdrop-blur z-50  bg-backgroundnavbar dark:bg-backgroundnavbar-dark border-t  border-bordercolornavbar dark:border-bordercolornavbar-dark w-full px-2 h-16">
            <Row className="flex-auto items-center flex-row justify-around my-2 w-full">
                {TabList.map((tab, index) => (
                        <View key={"fl" + index} className='w-1/6  flex items-center rounded-lg text-base p-1.5 duration-200 hover:bg-backgrounditem  dark:hover:bg-backgrounditem-dark '>
                           <Link  href={tab.url} >
                           <View className='flex-col gap-1 items-center'>
                            {tab.url == '/dashboard' && profile ? profile : <Icon icon={tab.icon} width={24} height={24} />}
                             <Text className=' text-gray-700 hover:text-gray-900 dark:hover:text-white dark:text-gray-300 text-[10px] whitespace-nowrap'>{tab.title}</Text>
                            </View>
                            </Link>
                        </View>
                ))}
          </Row>
        </View>
    );
} 
