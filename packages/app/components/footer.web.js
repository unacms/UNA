import Link from '../ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';

export default function () {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');

 	return (
        <View className=" backdrop-blur z-50 border-t bg-navbar/80 dark:bg-navbar-dark/80 border-neoborder dark:border-neoborder-dark w-full px-2 h-16">
            <Row className="flex-auto items-center flex-row justify-around my-2 w-full">
                {TabList.map((tab, index) => (
                        <View key={"fl" + index} className='w-1/6  flex items-center rounded-lg text-base p-1.5 duration-200 hover:bg-neoitem  dark:hover:bg-neoitem-dark '>
                           <Link  href={tab.url} >
                           <View className='flex items-center'>
                            <Icon icon={tab.icon} width={24} height={24} />
                             <Text className='font-semibold text-gray-700 hover:text-gray-900 dark:hover:text-white dark:text-gray-300 text-xs'>{tab.title}</Text>
                            </View>
                            </Link>
                        </View>
                ))}
          </Row>
        </View>
    );
} 
