import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MotiView, AnimatePresence } from 'moti'

import { fetcher } from 'app/lib/fetcher';
import { TouchableOpacity } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import MainMenu from 'app/components/nav/mainmenu'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { processMenu } from 'app/lib/util'
import { Slider } from 'app/ui/molecules/slider';

import Notifications from 'app/components/units/notifications';
import 'app/styles/dropdown.css';

export default function (props) {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [menuPopup, setMenuPopup] = useState(false)

  let { width } = useWindowDimensions()

  if (width > 1280 && menuPopup) setMenuPopup(false)

  const showMenu = (params) => {
    setMenuPopup(!menuPopup)
  }

  const hideMenu = (params) => {
    setMenuPopup(false)
  }

    const sNtfsSkeleton = (
        <View className=" px-1.5 pb-1.5 ">
           <View className=" items-center  flex-row mb-1 ">

<Text className='text-gray-700 dark:text-gray-300 text-lg flex-auto font-bold ml-0.5'>Notifications</Text>

  <Link href="/notifications-view">
  <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title="View all"  />
  </Link>
</View>
        {[...Array(1, 2, 3)].map( i => 
            <View key={i} className="flex-col p-2 my-[1px] w-[500px] bg-backgroundcard dark:bg-backgroundcard-dark rounded">
                <View className="animate-pulse flex-row items-center gap-2">
                    <View className="rounded-full bg-neutral-500/40 h-12 w-12"></View>
                    <View className="flex-1 gap-1.5">
                        <View className="flex-row justify-between">
                            <View className="h-3 w-1/2 bg-neutral-500/60 rounded-full"></View>    
                            <View className="h-3 w-20 bg-neutral-500/40 rounded-full"></View>
                        </View>
                        <View className="h-3 w-full bg-neutral-500/50 rounded-full"></View>
                    </View>
                </View>
            </View>
        )}
        </View>
    );

    const [ntfsOpen, setNtfsOpen] = useState(false);
    const [ntfsContent, setNtfsContent] = useState(sNtfsSkeleton);
    const handleClickNotifications = async () => {
        const iPerPage = 5;
        const aParams = {
            params: {
                type: 'obj_own_and_con',
                start: 0,
                per_page: iPerPage,
                modules: ''
            }
        };

        const sResponse = await fetcher('/api.php?r=bx_notifications/get_data/Module&params=' + JSON.stringify(aParams));
        if(!sResponse?.data) 
            return;

        const oBlock = sResponse.data.shift();
        if(oBlock.data?.unit != 'notifications' || !oBlock.data?.data) 
            return;

        const sContent = (
            <View className=" px-1.5 pb-1.5 ">
                <View className=" items-center  flex-row mb-1 ">

                <Text className='text-gray-700 dark:text-gray-300 text-lg flex-auto font-bold ml-0.5'>Notifications</Text>

                  <Link href="/notifications-view">
                  <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title="View all"  />
                  </Link>
              </View>
                {oBlock.data.data.map(a => <Notifications key={a.id} data={a} />)}
                {oBlock.data.data.length > iPerPage && <View className="flex flex-row justify-end mx-4 mb-2">
                    <Link href="/notifications-view">
                        <Button variant="text" title="View All" rounded endDecorator="ArrowRight" onPress={() => {setNtfsOpen(false)}} />
                    </Link>
                </View>}
            </View>
        );

        setNtfsContent(sContent);            
    }

  return (
    <View className="fixed -top-[1px]  z-50 w-full mb-16">
      <TouchableOpacity
        className="xl:hidden"
        onPress={hideMenu}
      ></TouchableOpacity>
      <View className="  backdrop-blur h-16 px-2 sm:px-4  items-center w-full   border-b  bg-backgroundnavbar dark:bg-backgroundnavbar-dark   border-bordercolornavbar dark:border-bordercolornavbar-dark flex-row space-x-2 sm:space-x-4 ">
      <Row className="flex-row space-x-1 flex-none items-center"> 
        { /*props.uri == 'home'*/ true && <TouchableOpacity className="xl:hidden " onPress={showMenu}>
          <Button variant="text" startDecorator="List" rounded align="start" />
        </TouchableOpacity>
        }
        <TouchableOpacity className="" onPress={hideMenu}>
          <Link href="/home">
            <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto gap-2">
              {appSetting('theme', 'svg', 'logo-mark')}
              {appSetting('theme', 'svg', 'logo-text')}
            </View>
          </Link>
        </TouchableOpacity>
      </Row>
      
      <Row className="flex-row space-x-2 flex-auto justify-end lg:justify-between ">
        <Row className="hidden lg:flex flex-row flex-none  grow mx-auto px-12">
          <Slider offset={300}>
            {processMenu('main_menu', props.menu_top.items).map((item, index) => (
                  !item.link.includes('javascript') && (
                    <Link href={item.link} key={`menu-${index}`}>
                    <Button
                      variant="text"
                      startDecorator={item.icon}
                      align="start"
                      title={item.title}
                    />
                  </Link>
                )
              ))}
          </Slider>
        </Row>
        <Row>
        {!!currentUser &&
        <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
            <DropdownMenu.Root open={ntfsOpen} onOpenChange={(bOpen) => {bOpen && handleClickNotifications(); setNtfsOpen(bOpen);}}>
              <DropdownMenu.Trigger>
                <Button variant="text" rounded startDecorator="notifications" onPress={() => {}} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="DropdownMenuContent border border-bordercolormodal dark:border-bordercolormodal-dark backdrop-blur mx-1 bg-backgroundmodal dark:bg-backgroundmodal-dark shadow-lg ">{ntfsContent}</DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          <Link href="/messenger">
            <Button variant="text" rounded startDecorator="messages" />
          </Link>
          <Link href="/create-post">
            <Button variant="text" rounded startDecorator="plus" />
          </Link>
          <Link href="/logout">
            <Button variant="text" rounded startDecorator="account" />
          </Link>
        </Row>
        }

        {!currentUser &&
        <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
          <Link href="/login">
            <Button variant="text" rounded startDecorator="account" />
          </Link>
        </Row>
        }

        <Link href="/search">
          <Button variant="text" rounded startDecorator="search" />
        </Link>
        </Row>
        </Row>
      </View>
      <AnimatePresence exitBeforeEnter>
        {menuPopup && (
          <View>
            <MotiView
              from={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
                translateX: -1000,
              }}
              transition={{
                duration: 0,
              }}
            >
              <TouchableOpacity
                className="bg-white/80 dark:bg-black/80 bg-red-500 w-full absolute top-0 h-screen"
                onPress={showMenu}
              ></TouchableOpacity>
            </MotiView>
            <MotiView
              style={{ width: 288 }}
              from={{
                
                translateX: -300,
                overshootClamping: false,
              }}
              animate={{
                translateX: 0,

                overshootClamping: false,
              }}
              exit={{
                height: 0,
                translateX: -300,
                overshootClamping: false,
              }}
              transition={{
                overshootClamping: true,
                /*type: 'timing',
        duration: 1500,
        delay: 100,*/
              }}
            >
              <TouchableOpacity className="w-72 h-screen" onPress={showMenu}>
                <MainMenu {...props} />
              </TouchableOpacity>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}