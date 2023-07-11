import { View, Row, Pressable } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Platform } from 'react-native'
import { useState, useEffect } from 'react'
import { appSetting } from 'app/lib/util'
import LayoutDataContext from 'app/context/layout'
import { useCurrentUser } from 'app/context/user'
import { BlackBox } from 'app/ui/molecules/blackbox'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Story } from 'app/ui/molecules/stories'

export default function PageLayout(props) {
  const isWeb = Platform.OS == 'web'
  const [isDesktop, setIsDesktop] = useState(false)
  const [renderBlock, setRenderBlock] = useState(false)
  let { currentUser, setCurrentUser } = useCurrentUser()
  const [feedType, setFeedType] = useState(0)

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
    if (currentUser)
      return (
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
          <View className="flex-auto relative w-full flex-row mx-auto  ">
            <View className="hidden md:block  w-1/4 xl:w-1/5 mt-4 duration-200  ">
              <BlockByName data={props.data} name={props.blocks.menu} />
            </View>
            <View className="flex-auto  w-3/4 xl:w-4/5 flex-row duration-200">
              <View className="flex-auto w-2/3">
                <Story></Story>
                { appSetting('feed', 'show_multi') ? <>
                <Row className="px-4 mt-4 mr-auto gap-x-2 w-full">
                  <Pressable  className=" py-2 items-center" onPress={() => {setFeedType(0)}}>
                    <Button fullWidth={true} id="tab" variant={feedType == 0 ? 'outline': "text"} rounded size='sm' title='Public'   />
                  </Pressable>
                  <Pressable  className=" py-2 items-center" onPress={() => {setFeedType(1)}}>
                    <Button fullWidth={true} id="tab" variant={feedType == 1 ? 'outline': "text"} rounded size='sm' title='Account'   />
                  </Pressable>
                </Row> 
                <View className={feedType == 0 ? '' : 'w-full absolute z-0 invisible top-full'}>
                  <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.public_feed_form} />
                    <BlockByName data={props.data} name={props.blocks.public_feed} />
                  </LayoutDataContext>
                </View>
                <View className={feedType == 1 ? '' : ' absolute z-0 invisible top-full'}>
                  <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.account_feed_form} />
                    <BlockByName data={props.data} name={props.blocks.account_feed} />
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

              <View className="hidden xl:block w-1/3  flex-none duration-200 sticky ">
                <BlockByName name={props.blocks.home2} />
                <BlockByName no_scroll={true} data={props.data} name={props.blocks.friends} skeleton = 'one_column_browse'/>
                <BlockByName no_scroll={true} data={props.data} name={props.blocks.subscriptions} skeleton = 'one_column_browse'/>
                <BlockByName name={props.blocks.footer} />
              </View>
            </View>
          </View>
        </View>
      )
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
  let data = JSON.parse(JSON.stringify(props.data));
  let data2 = JSON.parse(JSON.stringify(props.data));
  if (!isWeb) {
    for (let cell in data.elements) {
      if (!data.elements[cell].some(obj => obj.source === 'bx_timeline:get_block_view_home')) {
        delete data.elements[cell];
      }
    }

    for (let cell in data2.elements) {
      if (!data2.elements[cell].some(obj => obj.source === 'bx_timeline:get_block_view_account')) {
        delete data2.elements[cell];
      }
    }
    
  }

  let menu = {
    object: 'search',
    items: menuItems,
  }

  /*
   <BlockByName data={props.data} name={props.blocks.posts2} />
           <BlockByName data={props.data} name={props.blocks.feed} />

    */
  return (
    <View className="w-full ">
      
        {!currentUser && renderBlock && (
          <BlockByName name={props.blocks.home} />
        )}
        {!!currentUser && (
          <>
          { appSetting('feed', 'show_multi') ? <>
                <Row className="pl-4 gap-x-1 ">
                  <Pressable  className=" items-center justify-center py-2.5  border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" onPress={() => {setFeedType(0)}}>
                    <View C>
                    <Button fullWidth={false} id="tab" variant={feedType == 0 ? 'outline': "text"} rounded size='sm' title='Public'   />
                    </View>
                  </Pressable>
                  <Pressable  className="items-center justify-center py-2.5  border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" onPress={() => {setFeedType(1)}}>
                  <View>
                    <Button fullWidth={false} id="tab" variant={feedType == 1 ? 'outline': "text"} rounded size='sm' title='Account'   />
                    </View>
                  </Pressable>
                </Row> 
                { feedType == 0 && <View className={feedType == 0 ? '' : ' h-full'}>
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={data} 
                blocks={props.blocks}
            /></LayoutDataContext>
                </View>}
                { feedType == 1 && <View className={feedType == 1 ? '' : ' h-full'}>
                <LayoutDataContext><BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={data2} 
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
