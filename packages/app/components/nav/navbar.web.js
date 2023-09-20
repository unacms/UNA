import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import { MotiView, AnimatePresence } from 'moti'
import { fetcher } from 'app/lib/fetcher'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import MainMenu from 'app/components/nav/mainmenu'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/blackbox-helpers';
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'

import Redirect from 'app/ui/atoms/redirect'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Search from 'app/ui/molecules/search'
import Browse from 'app/components/elements/browse'
import Notifications from 'app/components/units/notifications'
import Profile from 'app/ui/molecules/profile'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Tooltip from 'app/ui/atoms/tooltip';

export default function (props) {
  const redirectdRef = useRef()
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [menuPopup, setMenuPopup] = useState(false)

  let { width } = useWindowDimensions()

  if (width > 1280 && menuPopup) setMenuPopup(false)

  const showMenu = (params) => {
    setMenuPopup(!menuPopup)
  }

  const hideMenu = (params) => {
   // setMenuPopup(false)
  }

  const bSearch = appSetting('layout', 'search') == true;
  const bMessenger = appSetting('layout', 'messenger') == true;
  const bApps = appSetting('layout', 'apps') == true;

  const sTxtNtfsTitle = appSetting('lang_keys', 'ntfs_popup_title')
  const sTxtNtfsViewAll = appSetting('lang_keys', 'ntfs_popup_view_all')
  const [ntfsOpen, setNtfsOpen] = useState(false)
  let data = {request_url : "/api.php?r=bx_notifications/get_data/&params[]=", "type" : "obj_own_and_con", unit:"notifications"}
  const ntfsContent = (
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
      {true ? (
        <Browse height={400}  data={data} />
      ) : (
        oBlock.data.data.map((a) => <Notifications key={a.id} data={a} />)
      )}
    </View>
  )

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

  const menu_top = appSetting('menu_items', 'menu_top');
  const menu_top_more = appSetting('menu_items', 'menu_top_more');
  const menu_add = appSetting('menu_items', 'menu_add');

  const windowWidth = useWindowDimensions().width + 17;

  let headerSettings = getHeaderSettings(props.uri, width);
  
  useEffect(() => {
      const handleClick = () => {
        hideMenu();
      }

      document.addEventListener('click', handleClick)

      return () => document.removeEventListener('click', handleClick)
  }, [])

  if (windowWidth < 1024 && (!headerSettings.header))
    return <></>
    
  return (
    <>
    <View className="fixed -top-[1px]  w-full">
      <Redirect ref={redirectdRef} />
      <View className="  backdrop-blur h-16 px-4 items-center w-full shadow-sm border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d flex-row  ">
        <View className="flex-row flex-auto lg:w-1/4 gap-x-2 my-auto">
            <Row className="flex-row  flex-none items-center">
              {
                headerSettings.menu && (
                  <View className="lg:hidden mr-4"><Pressable  onPress={showMenu}>
                    <Button
                      variant="outline"
                      startDecorator="List"
                      rounded
                      align="start"
                    />
                  
                  </Pressable></View>  )}
                  { (props.uri == 'home' || windowWidth >= 1024) &&  

                  <Link href="/home" aria-label="Logo">
                    <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto">
                      {appStatic('logo_mark')}
                      {appStatic('logo_text')}
                    </View>
                  </Link>
                }
                  { headerSettings.backButton  && getBackButtonWeb() }
                  { headerSettings.title && <Text  className="text-2xl sm:text-3xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 ">{props.title}</Text> }
            </Row>
            {bSearch && <View className="hidden xl:flex"><Search type="input" /></View>}
            
        </View>
        <Row className="hidden w-1/2 lg:flex flex-auto">
            <Row className='mx-auto gap-x-1'>
              {menuItemsByName('main_menu', menu_top).map(
                (item, index) =>
                (currentUser || (!currentUser && item.nonlogged != false)) && (
                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                      <Tooltip content={item.title} asChildTrigger={true}>
                        <Button
                          variant="text"
                          size="lg"
                          fullWidth
                          startDecorator={
                            item.icon.indexOf(' ') == -1
                              ? item.icon
                              : item.icon.split(' ')[0]
                          }
                          align="start"
                        />
                      </Tooltip>
                    </Link>
                  )
              )}
             
            </Row>
        </Row>
        <Row className="flex-row lg:w-1/4  flex-none justify-end  ">          
            {!!currentUser && (
              <Row className="flex-row   justify-end ">
                <View className=" flex-row my-auto ">
                  {bApps && <View className="relative hidden lg:flex flex-row">
                  <DropdownMenu items={menuItemsByName('', menu_top_more).map(
                        (item, index) => {
                          return (
                          {
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
                      )}>
                    <Tooltip content="Apps" asChildTrigger={true}>
                      <Button
                        variant="outline"
                        size="base"
                        fullWidth
                        rounded
                        alt="All Apps"
                        startDecorator="CirclesFour"
                        aria-label="All Apps"
                        onPress={() => {}}
                      />
                    </Tooltip>
                  </DropdownMenu>
                  </View>}
                  {bSearch && <View className="xl:hidden ml-2">
                    <Search />
                  </View>}
               
                { menuItemsByName('', menu_add).length > 0 && <View className="ml-2">
                  <DropdownMenu
                    items={menuItemsByName('', menu_add).map(
                      (item, index) => {
                        return (
                         {
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
                    <Tooltip content="Create content" asChildTrigger={true}>
                      <Button
                        variant="outline"
                        rounded
                        startDecorator="plus"
                        id="m3"

                        onPress={() => {}}
                      />
                    </Tooltip>
                  </DropdownMenu>
                </View>}
                {bMessenger && <View className="hidden ml-2 sm:flex flex-row gap-x-2 my-auto">
                  <DropdownPopup
                    open={ntfsOpen}
                    onOpenChange={(bOpen) => {
                      bOpen
                      setNtfsOpen(bOpen)
                    }}
                    title={sTxtNtfsTitle}
                  >
                    {[
                      <Button
                        key="ddp-trigger"
                        variant="outline"
                        rounded
                        startDecorator="notifications"
                        id="m1"
                      />,
                      ntfsContent
                    ]}
                  </DropdownPopup>
                  <Tooltip content="Messenger" asChildTrigger={true}>
                    <Button
                      variant="outline"
                      rounded
                      startDecorator="ChatTeardropDots"
                      id="m2"
                      onPress={() => {
                        handleClick('/messenger')
                      }}
                    />
                  </Tooltip>
                </View>}
                
                {profile ? (
                  <View className="hidden sm:flex ml-2 flex-row justify-center">
                    <Button
                      variant="outline"
                      rounded
                      padding={1}
                      startDecorator={profile}
                      id="m3"
                      onPress={() => {}}
                    />
                  </View>
                ) : (
                  <></>
                )}
                </View>
                
           
              </Row>
            )}

            {!currentUser && (
              <Row className="flex-row flex-auto sm:flex-none justify-end   my-auto ml-2 gap-x-2">
                
                <Button
                  variant="outline"
                  rounded

                  startDecorator="account"
                  onPress={() => {
                    handleClick('/login')
                  }}
                />
              </Row>
            )}
          
 
        </Row>
        
      </View>
      <AnimatePresence exitBeforeEnter>
        {menuPopup && (
          <View>
             <MotiView
             style={{ width: '100%' }}
              from={{
                opacity: 1,
                width: '100%'
              }}
              animate={{
                opacity: 1,
                width: '100%'
              }}
              exit={{
                opacity: 0,
                width: '0'
              }}
              transition={{
                duration: 0,
              }}
            >
              <Pressable
                
                onPress={showMenu}
              ><View className="bg-white/80 dark:bg-black/80 w-full absolute top-0 h-screen z-50"></View></Pressable>
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
              <Pressable className="w-72 h-screen m-menu" onPress={showMenu}>
                <MainMenu {...props} />
              </Pressable>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
   
    </>
  )
}
// <View className='h-16 lg:h-0 w-full'></View>
