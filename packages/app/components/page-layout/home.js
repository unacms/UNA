import { View, Row, Pressable } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Platform } from 'react-native'
import { useState, useEffect } from 'react'
import { appSetting, filterContent } from 'app/lib/util'
import LayoutDataContext from 'app/context/layout'
import { useCurrentUser } from 'app/context/user'
import { BlackBox } from 'app/ui/molecules/blackbox'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Story } from 'app/ui/molecules/stories'
import Profile from 'app/ui/molecules/profile'
import Link from 'app/ui/atoms/link'
import { ScrollView } from 'dripsy'

export default function PageLayout(props) {
  const isWeb = Platform.OS == 'web'
  const [isDesktop, setIsDesktop] = useState(false)
  const [renderBlock, setRenderBlock] = useState(false)
  let { currentUser, setCurrentUser } = useCurrentUser()
  const [feedType, setFeedType] = useState(appSetting('feed', 'default_feed'))
  const [unitMode, setUnitMode] = useState(appSetting('feed', 'default_view'));

  useEffect(() => {
    if (isWeb) {
      const handleResize = () => {
        setIsDesktop(window.innerWidth > 768)
      }

      window.addEventListener('resize', handleResize)
      handleResize()

      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentUser) setRenderBlock(true)
    }, 100)

    return () => clearTimeout(timer) // This will clear the timer when the component is unmounted.
  }, [])

  if (isWeb) {
    if (currentUser === null && renderBlock)
      return (
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full pt-4'}>
          <BlockByName name={props.blocks.home} />
        </View>
      )
    if (currentUser){
      let dUser = Object.assign({}, currentUser)
      dUser.url_avatar = dUser.avatar
      dUser.url = '/dashboard'
      const profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="sm" />


      return (
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>

          <View className="flex-auto relative w-full flex-row mx-auto  ">
            <View className="hidden md:block   w-1/4 xl:w-1/5 mt-4 sticky duration-200  ">
              <View className="mx-4 mb-1 p-2  flex-row  
                    group duration-200 overflow-hidden rounded-lg  
                    hover:bg-neutral-500/10 active:opacity-50
                     max-w-5xl self-center  gap-x-2  ">
            <View className="w-8 h-8 translate-x-[1px] bg-blue-500/50 rounded-full flex-none ">{profile}</View>
            <Link href={currentUser.url}><Text className='text-base my-auto flex-auto font-medium truncate text-neutral-700 dark:text-neutral-300  dark:text-neutral-100'>{currentUser.display_name}</Text></Link>
            
            
              </View>

              <BlockByName data={props.data} name={props.blocks.menu} />
            </View>
            <View className="flex-auto  w-3/4 xl:w-4/5 flex-row duration-200">
              <View className="flex-auto w-2/3">
                <Story></Story>
                { appSetting('feed', 'show_multi') ? <>
                <Row className="p-4  gap-x-2  w-full">
                  <Pressable  className=" my-auto items-center" onPress={() => {setFeedType('account')}}>
                    <Button fullWidth={true} id="tab" startDecorator="Users"  variant={feedType == 'account' ? 'outline': "text"} rounded size='sm' title='Following'   />
                  </Pressable>
                  <Pressable  className=" my-auto items-center" onPress={() => {setFeedType('public')}}>
                    <Button fullWidth={true} id="tab" startDecorator="MagicWand"  variant={feedType == 'public' ? 'outline': "text"} rounded size='sm' title='For You'   />
                  </Pressable>
                  <Pressable  className=" hidden my-auto items-center" onPress={() => {setFeedType('hot')}}>
                    <Button fullWidth={true} id="tab" startDecorator="Fire" variant={feedType == 'hot' ? 'outline': "text"} rounded size='sm' title='Hot'   />
                  </Pressable>
                  {appSetting('feed', 'show_selector_view') &&
                    <Row className="flex-auto gap-x-1 flex-auto items-end justify-end">
                      <Button startDecorator="Rows" variant={unitMode == '' ? 'outline': "text"} size='sm' onPress={() => {setUnitMode('')}}  />
                      <Button startDecorator="ListBullets" variant={unitMode == 'small' ? 'outline': "text"}  size='sm' onPress={() => {setUnitMode('small')}}  />
                    </Row>
                  }
                </Row> 
                <View className={feedType == 'account' ? '' : 'w-full absolute z-0 invisible top-full'}>
                  <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.account_feed_form} />
                    <BlockByName data={props.data} name={props.blocks.account_feed} unitMode={unitMode} />
                  </LayoutDataContext>
                </View>
                <View className={feedType == 'public' ? '' : 'w-full absolute z-0 invisible top-full'}>
                  <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.public_feed_form} />
                    <BlockByName data={props.data} name={props.blocks.public_feed} unitMode={unitMode} />
                  </LayoutDataContext>
                </View>
               
                <View className={feedType == 'hot' ? '' : 'w-full absolute z-0 invisible top-full'}>
                  <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.hot_feed} unitMode={unitMode}  />
                  </LayoutDataContext>
                </View>
                </> 
                :
                <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks[appSetting('feed', 'default_feed') + '_feed_form']} />
                    <BlockByName data={props.data} name={props.blocks[appSetting('feed', 'default_feed') + '_feed']} />
                </LayoutDataContext>
                }
              </View>

              <View className="hidden xl:block w-1/3 px-2 flex-none duration-200 sticky ">
                <BlockByName name={props.blocks.home2} />
                <BlockByName name={props.blocks.profile_switcher} data={props.data} />
                <BlockByName no_scroll={true} data={props.data} name={props.blocks.friends} skeleton = 'one_column_browse'/>
                <BlockByName no_scroll={true} data={props.data} name={props.blocks.subscriptions} skeleton = 'one_column_browse'/>
                <BlockByName name={props.blocks.footer} />
              </View>
            </View>
          </View>
        </View>
      )
              }
  }

  let sect = [{ name: '', title: 'Top' }]

  const menuItems = sect.map((obj, index) => {
    const key = Object.keys(obj)[0]
    return {
      id: index + 1,
      name: obj.name,
      title: obj.title,
      link: 'home',
      icon: '',
    }
  })

    
    let dataHome = filterContent(props.data, ['bx_timeline:get_block_post_home', 'bx_timeline:get_block_view_home'])
    let dataAccount = filterContent(props.data, ['bx_timeline:get_block_post_account', 'bx_timeline:get_block_view_account'])
    let dataHot = filterContent(props.data, ['bx_timeline:get_block_view_hot'])

  let menu = {
    object: 'search',
    items: menuItems,
  }

  return (
    <View className="w-full ">
      
        {!currentUser && renderBlock && (
          <ScrollView>
          <BlockByName name={props.blocks.home} /></ScrollView>
        )}
        {!!currentUser && (
          <>
          { appSetting('feed', 'show_multi') ? <>
                <Row className="px-auto justify-center gap-x-1 ">
                  <Pressable  className="items-center justify-center py-2.5  " onPress={() => {setFeedType('account')}}>
                    
                      <Button fullWidth={false} id="tab" startDecorator="Users"  variant={feedType == 'account' ? 'outline': "text"} rounded size='sm' title='Following'   />
                    
                  </Pressable>
                  <Pressable  className=" items-center justify-center py-2.5  " onPress={() => {setFeedType('public')}}>
                    <View >
                    <Button fullWidth={false} id="tab" startDecorator="MagicWand"  variant={feedType == 'public' ? 'outline': "text"} rounded size='sm' title='For You'   />
                    </View>
                  </Pressable>
                  <Pressable  className="items-center hidden justify-center py-2.5 " onPress={() => {setFeedType('hot')}}>
                  <View>
                  <Button fullWidth={false} id="tab" startDecorator="Fire" variant={feedType == 'hot' ? 'outline': "text"} rounded size='sm' title='Hot'   />
                    </View>
                  </Pressable>
                </Row> 
                { feedType == 'public' && <View className={feedType == 'public' ? '' : ' h-full'}>
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={dataHome} 
                blocks={props.blocks}
            /></LayoutDataContext>
                </View>}
                { feedType == 'account' && <View className={feedType == 'account' ? '' : ' h-full'}>
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={dataAccount} 
                blocks={props.blocks}
            /></LayoutDataContext>
                </View> }
                { feedType == 'hot' && <View className={feedType == 'hot' ? '' : ' h-full'}>
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={dataHot} 
                blocks={props.blocks}
            /></LayoutDataContext>
                </View> }
                </> 
                :
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={data} 
                blocks={props.blocks}
            /></LayoutDataContext>
                }
           
          </>
        )}
    </View>
  )
}
