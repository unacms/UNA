'use client'

import { useState, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { MotiView, AnimatePresence } from 'moti'
import { Icon } from 'app/ui/atoms/icon'; 
import { fetcher } from 'app/lib/fetcher'
import { TouchableOpacity } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import MainMenu from 'app/components/nav/mainmenu'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import { Slider } from 'app/ui/molecules/slider'

import Redirect from 'app/ui/atoms/redirect'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Search from 'app/ui/molecules/search'
import Browse from 'app/components/elements/browse'
import Notifications from 'app/components/units/notifications'
import Profile from 'app/ui/molecules/profile'
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic'

export default function (props) {
  const redirectdRef = useRef()
  const { currentUser, setCurrentUser } = useCurrentUser()
  const [menuPopup, setMenuPopup] = useState(false)

  let { width } = useWindowDimensions()

  if (width > 1280 && menuPopup) setMenuPopup(false)

  const showMenu = (params) => {
    setMenuPopup(!menuPopup)
  }

  const hideMenu = (params) => {
    setMenuPopup(false)
  }

  const DropdownMenu = dynamic(() => import('app/ui/atoms/dropdown-menu'), {
    ssr: false,
  })

  const sTxtNtfsTitle = appSetting('lang_keys', 'ntfs_popup_title')
  const sTxtNtfsViewAll = appSetting('lang_keys', 'ntfs_popup_view_all')
  const sNtfsSkeleton = (
    <View key="ddp-content" className="px-1.5 pb-1.5">
      <View className="flex-row items-center mb-1">
        <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">
          {sTxtNtfsTitle}
        </Text>
        <Button
          variant="text"
          size="sm"
          rounded
          endDecorator="CaretDoubleRight"
          title={sTxtNtfsViewAll}
          onPress={() => {
            setNtfsOpen(false)
            handleClick('/notifications-view')
          }}
        />
      </View>
      {[...Array(1, 2, 3)].map((i) => (
        <View
          key={i}
          className="flex-col p-2 my-[1px] bg-backgroundcard dark:bg-backgroundcard-dark rounded-md"
        >
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
      ))}
    </View>
  )

  const [ntfsOpen, setNtfsOpen] = useState(false)
  const [ntfsContent, setNtfsContent] = useState(sNtfsSkeleton)
  const handleClickNotifications = async () => {
    const bInfinite = true
    const aParams = {
      params: {
        type: 'obj_own_and_con',
        start: 0,
        per_page: 12,
        modules: '',
      },
    }

    const sResponse = await fetcher(
      '/api.php?r=bx_notifications/get_data/Module&params=' +
        JSON.stringify(aParams)
    )
    if (!sResponse?.data) return

    const oBlock = sResponse.data.shift()
    if (oBlock.data?.unit != 'notifications' || !oBlock.data?.data) return

    const sContent = (
      <View key="ddp-content" className="px-1.5 pb-1.5">
        <View className="flex-row items-center mb-1">
          <Text className="text-gray-700 dark:text-gray-300 text-lg flex-auto font-bold ml-0.5">
            {sTxtNtfsTitle}
          </Text>
          <Button
            variant="text"
            size="sm"
            rounded
            endDecorator="CaretDoubleRight"
            title={sTxtNtfsViewAll}
            onPress={() => {
              setNtfsOpen(false)
              handleClick('/notifications-view')
            }}
          />
        </View>
        {bInfinite ? (
          <Browse type={oBlock.type} params={{ height: 660 }} {...oBlock} />
        ) : (
          oBlock.data.data.map((a) => <Notifications key={a.id} data={a} />)
        )}
      </View>
    )

    setNtfsContent(sContent)
  }

  const handleClick = (sUrl) => {
    redirectdRef.current.redirect(sUrl)
  }

  let profile = null
  if (currentUser) {
    let dUser = Object.assign({}, currentUser)
    dUser.url_avatar = dUser.avatar
    dUser.url = '/dashboard'
    profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="sm" />
  }

  const menu_top = appSetting('menu_items', 'menu_top')
  const windowWidth = useWindowDimensions().width;

  const router = useRouter();
  let settings = appSetting('layouts', props.uri)
 
  if (windowWidth < 1024 && (settings?.layout == 'blackbox' || settings?.layout == 'profile'))
    return <></>

  let bBackHeader = false; 
  if (windowWidth < 1024){
    
    if (props.uri != 'home')
      bBackHeader = true
  }
  return (
    <>
    <View className="fixed -top-[1px]  z-30 w-full">
      <Redirect ref={redirectdRef} />
      <TouchableOpacity
        className="xl:hidden"
        onPress={hideMenu}
      ></TouchableOpacity>
      <View className="  backdrop-blur h-16 px-4  items-center w-full   border-b  bg-backgroundnavbar dark:bg-backgroundnavbar-dark   border-bordercolornavbar dark:border-bordercolornavbar-dark flex-row space-x-2 sm:space-x-4 ">
        <Row className="flex-row  flex-none items-center">
          {
            !bBackHeader && (
              <><View className="lg:hidden mr-4"><TouchableOpacity  onPress={showMenu}>
                <Button
                  variant="text"
                  startDecorator="List"
                  rounded
                  align="start"
                />
              </TouchableOpacity></View>
              <TouchableOpacity className="" onPress={hideMenu}>
              <Link href="/home" aria-label="Logo">
                <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto">
                  {appStatic('logo', 'mark')}
                  {appStatic('logo', 'text')}
                </View>
              </Link>
            </TouchableOpacity></>
            )
          }
          {
            bBackHeader && (
            <>
              <Pressable className="bg-backgroundnavbar dark:bg-backgroundnavbar-dark  w-10 h-10 rounded-full justify-center items-center" onPress={router.back} >
              <Icon icon="left" width={24} height={24} />
              </Pressable>
              <Text  className="text-lg lg:text-xl mr-8 font-bold text-neutral-800 dark:text-neutral-200 ">{props.title}</Text>
            </>
            )
          }
          
        </Row>

        <Row className="flex-row  flex-auto justify-end lg:justify-between ">
          <Row className="hidden lg:flex flex-row flex-none  grow mx-auto px-12">
            <Slider offset={300}>
              {menuItemsByName('main_menu', menu_top).map(
                (item, index) =>
                  !item.link.includes('javascript') && (
                    <Link href={item.link} key={`menu-${index}`}>
                      <Button
                        variant="text"
                        startDecorator={
                          item.icon.indexOf(' ') == -1
                            ? item.icon
                            : item.icon.split(' ')[0]
                        }
                        align="start"
                        title={item.title}
                      />
                    </Link>
                  )
              )}
            </Slider>
          </Row>
          <Row>
            {!!currentUser && (
              <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
                <View className="hidden sm:flex flex-row ">
                  <DropdownPopup
                    open={ntfsOpen}
                    onOpenChange={(bOpen) => {
                      bOpen && handleClickNotifications()
                      setNtfsOpen(bOpen)
                    }}
                    title={sTxtNtfsTitle}
                  >
                    {[
                      <Button
                        key="ddp-trigger"
                        variant="text"
                        rounded
                        startDecorator="notifications"
                        id="m1"
                      />,
                      ntfsContent,
                    ]}
                  </DropdownPopup>
                  <Button
                    variant="text"
                    rounded
                    startDecorator="messages"
                    id="m2"
                    aria-label="Messages"
                    onPress={() => {
                      handleClick('/messenger')
                    }}
                  />
                </View>
                <DropdownMenu
                  items={menuItemsByName('add_menu', props.menu_add.items).map(
                    (item, index) => {
                      return (
                        !item.link.includes('javascript') && {
                          id: 'menu-' + index,
                          link: item.link,
                          title: item.title,
                          icon:
                            item.icon.indexOf(' ') == -1
                              ? item.icon
                              : item.icon.split(' ')[0],
                        }
                      )
                    }
                  )}
                >
                  <Button
                    variant="text"
                    rounded
                    startDecorator="plus"
                    id="m3"
                    aria-label="Create"
                    onPress={() => {}}
                  />
                </DropdownMenu>
                <Search />
                {profile ? (
                  <View className="hidden sm:flex flex-row justify-center">
                    <Button
                      variant="text"
                      rounded
                      padding={1}
                      startDecorator={profile}
                      id="m3"
                      aria-label="Create"
                      onPress={() => {}}
                    />
                  </View>
                ) : (
                  <></>
                )}
              </Row>
            )}

            {!currentUser && (
              <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
                <Search />
                <Button
                  variant="text"
                  rounded
                  startDecorator="account"
                  onPress={() => {
                    handleClick('/login')
                  }}
                />
              </Row>
            )}
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
   
    </>
  )
}
// <View className='h-16 lg:h-0 w-full'></View>
