import Link from '../ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';
import { useState } from 'react'
import { Button } from 'app/design/controls'

export default function () {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const TabList = currentUser ? appSetting('menu', 'bottom_tabs_logged') : appSetting('menu', 'bottom_tabs_non_logged');
    const [notifCount, setNotifCount] = useState(currentUser? currentUser.notifications : null)


    let profile = null
    if (currentUser){
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="xs" />

        /*const evtSource = new EventSource(appSetting("urls", "notifs") + dUser.id + "&params[]=" + dUser.notifCount);
        evtSource.onmessage = (event) => {
            if (event.data != notifCount)
                setNotifCount(event.data)
        };*/
    }

    

 	return (
        <>
        <View className="fixed bottom-0 z-30 w-full sm:hidden tabbar bg-backgroundtabbar dark:bg-backgroundtabbar-dark">
          <View className=" backdrop-blur z-50  bg-backgroundnavbar dark:bg-backgroundnavbar-dark border-t  border-bordercolornavbar dark:border-bordercolornavbar-dark w-full px-2 h-16">
              <Row className="flex-auto items-center flex-row justify-around my-2 w-full">
                  {TabList.map((tab, index) => (
                          <View key={"fl" + index} className='w-1/6 text-neutral-700 dark:text-neutral-300 flex items-center rounded-lg text-base p-1.5 duration-200 group hover:text-primary dark:hover:text-primary '>
                             <Link  href={tab.url} >
                             <View className='flex-col gap-1 items-center'>
                              {tab.url == '/dashboard' && profile ? profile : <Icon icon={tab.icon} width={24} height={24} />}
                               <Text className='group-hover:text-primary dark:group-hover:text-primary  text-[10px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap'>{tab.title}</Text>
                               {(tab.url == '/notifications-view' && notifCount > 0) && <View className='absolute bg-red-500 border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 -top-2'><Text className='text-white text-xs font-semibold'>{notifCount}</Text></View>}
                              </View>
                              </Link>
                          </View>
                  ))}
            </Row>
          </View></View>

        </>
    );
} 
