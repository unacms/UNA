import { View, ScrollView, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'

const items = ['', '', '', '', '','']
const maxWidth = appSetting('layout', 'max_width')

export function getBlackBox(windowWidth) {
    return (
      <>
        <View className="w-full h-12 lg:h-12"></View>
        <View
          style={[
            { width: '100%', position: 'fixed', overflow: 'hidden', zIndex: 50 },
            { top: windowWidth > 1024 ? 63 : 0 },
          ]}
        >
          <View className="w-full backdrop-blur border-b items-center justify-center border-bordercolornavbar dark:border-bordercolornavbar-dark bg-backgroundnavbar dark:bg-backgroundnavbar-dark">
            <View
              className={appSetting('layout', 'max_width') + ' mx-auto w-full'}
            >
              <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 border-b border-bordercolornavbar dark:border-bordercolornavbar-dark">
                <Row className="items-center">
                  <View className="ml-4 "></View>
                  <Text className="text-2xl mr-8 font-bold text-neutral-800 dark:text-neutral-200 leading-tight">
                    Page Name
                  </Text>
                </Row>
                <Row className="pr-4"></Row>
              </Row>
              <Row className="items-center ">
                <View className="   hidden lg:flex ">
                  <View className='h-6 w-36 my-auto mx-4 bg-neutral-500/20 rounded-full animate-pulse'></View>
                </View>
                <ScrollView horizontal={true} className="items-center gap-0 ">
                  <Row className="mr-auto ml-4 gap-x-2">
                      <View className="h-[34px] w-24 my-2 border border-neutral-500/10 rounded-full animate-pulse"></View>
                  </Row>
                </ScrollView>
                <Row className="hidden lg:flex px-4"></Row>
              </Row>
            </View>
          </View>
        </View>
        <View className="flex mx-auto w-full justify-center flex-col animate-pulse max-w-screen-2xl">
          {blockSkeletons['browse_item']}
        </View>
      </>
    )
  }
  
  var blockSkeletons = {
    one_column_browse: (
      <>
        {items.map((item, index) => (
          <View key={'one_column_browse' + index}>
            <View className=" p-2 flex-row gap-x-2 w-full animate-pulse ">
              <View className="w-10 h-10 bg-neutral-500/10 rounded-full flex-none "></View>
              <View className="h-4 w-12 flex-auto mr-8 my-auto rounded-full   bg-neutral-500/20"></View>
              <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-neutral-500/10  ">
                <View className="h-4 my-0.5 w-16  rounded-full   bg-neutral-500/20"></View>
              </View>
              <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-neutral-500/10  ">
                <View className="h-4 my-0.5 w-4  rounded-full   bg-neutral-500/20"></View>
              </View>
            </View>
          </View>
        ))}
      </>
    ),
    notifications: (
      <>
        {items.map((item, index) => (
           <View
           key={index}
           className="flex-col p-2 my-[2px] bg-backgroundcard dark:bg-backgroundcard-dark rounded-md"
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
      </>
    ),
    browse_item: (
      <>
        {items.map((item, index) => (
          <View key={'browse_item' + index} className="flex-row w-full animate-pulse">
            <View className="mb-4 mx-4 sm:mx-2 flex-auto aspect-square rounded-xl  overflow-hidden bg-backgroundcard dark:bg-backgroundcard-dark ">
              <View className="relative bg-neutral-500/20  aspect-video  w-full "></View>
            </View>
            <View className="mb-4 mx-4 sm:mx-2  hidden sm:block flex-auto aspect-square rounded-xl overflow-hidden bg-backgroundcard dark:bg-backgroundcard-dark  ">
            <View className="relative bg-neutral-500/20  aspect-video  w-full "></View>
            </View>
            <View className="mb-4 mx-4 sm:mx-2  hidden md:block flex-auto aspect-square rounded-xl overflow-hidden bg-backgroundcard dark:bg-backgroundcard-dark">
            <View className="relative bg-neutral-500/20  aspect-video  w-full "></View>
            </View>
            <View className="hidden lg:block flex-auto mx-4 sm:mx-2 aspect-square rounded-xl overflow-hidden bg-backgroundcard dark:bg-backgroundcard-dark ">
            <View className="relative bg-neutral-500/20  aspect-video  w-full "></View>
            </View>
         
          </View>
        ))}
      </>
    ),
    feed: (
      <View className="sm:px-4 sm:py-2 sm:gap-2">
        {appSetting('feed', 'default_view') == 'small' &&
          items.map((item, index) => (
            <View
              key={'home2' + index}
              className="bg-backgroundcard dark:bg-backgroundcard-dark mt-[1px] sm:rounded-lg p-2 flex flex-col gap-4 animate-pulse"
            >
              <View className="flex-row gap-2">
                <View className="relative flex-row">
                  <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
                  </View>
                </View>
                <View className="flex-col flex-auto my-auto">
                  <View className="w-full flex-row justify-between">
                    <View className="h-3 my-1 w-1/4 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-3 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
                  </View>
                  <View className="h-5 my-1 w-full bg-neutral-500/30 rounded-full"></View>
                  <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
                </View>
              </View>
            </View>
          ))}
        {appSetting('feed', 'default_view') != 'small' &&
          items.map((item, index) => (
            <View
              key={'home3' + index}
              className="bg-backgroundcard dark:bg-backgroundcard-dark sm:rounded-lg p-4 flex flex-col animate-pulse mt-2 sm:m-0"
            >
              <View className="flex-row gap-x-2 mb-2">
                <View className="relative flex-row">
                  <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
                  </View>
                </View>
                <View className="flex-col flex-auto my-auto">
                  <View className="w-full flex-row justify-between">
                    <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
                  </View>
                  <View className="h-3 my-1 w-1/4 bg-neutral-500/30 rounded-full"></View>
                </View>
              </View>
              <View className="h-4 my-1 w-full bg-neutral-500/30 rounded-full"></View>
              <View className="h-4 my-1 w-3/4 bg-neutral-500/30 rounded-full"></View>
              <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
              <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
              <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
              <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
            </View>
          ))}
      </View>
    ),
  }
  
  var pageSkeletons = {
    default: (
      <View className={maxWidth + ' mx-auto w-full animate-pulse '}>
        <View className=" rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark m-4 p-4 flex flex-col gap-6">
          <View className="flex-col gap-y-4 ">
            <View className="h-6 w-2/3 bg-neutral-500/20 rounded-lg"></View>
            <View className="flex-col gap-y-2">
              <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
              <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
              <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
            </View>
          </View>
        </View>
      </View>
    ),
    home: (
      <View className={maxWidth + ' mx-auto w-full '}>
        <View className="flex-auto relative w-full flex-row mx-auto">
          <View className="hidden md:block w-1/4 xl:w-1/5 ">
            <View className="flex-col flex-auto px-4 py-2 animate-pulse gap-y-0.5 ">
              {items.map((item, index) => (
                <View key={'home1' + index}>
                  <View className="p-2 border border-transparent flex-row gap-2 ">
                    <View className="h-6 w-6 flex-none bg-neutral-500/30 rounded-full"></View>
                    <View className="h-5 flex-auto my-0.5 bg-neutral-500/20 rounded-full"></View>
                  </View>
                  <View className="p-2 border border-transparent flex-row gap-2 ">
                    <View className="h-6 w-6 flex-none bg-neutral-500/30 rounded-full"></View>
                    <View className="h-5 w-3/4 my-0.5 bg-neutral-500/20 rounded-full"></View>
                  </View>
                </View>
              ))}
            </View>
          </View>
  
          <View className="flex-auto w-3/4 xl:w-4/5 flex-row">
            <View className="flex-auto w-2/3">{blockSkeletons.feed}</View>
            <View className="hidden xl:flex flex-col top-0 flex-none w-1/3 ">
              {blockSkeletons['bx_posts:browse']}
            </View>
          </View>
        </View>
      </View>
    ),
    post: (
      <View className="flex w-full justify-center sm:p-4 flex-row gap-4">
        <View className="max-w-5xl w-full bg-backgroundcard dark:bg-backgroundcard-dark border-y sm:border border-bordercolorcard dark:border-bordercolorcard-dark sm:rounded-lg p-4 flex flex-col animate-pulse sm:m-0">
          <View className="flex-row gap-x-2 mb-2">
            <View className="relative flex-row">
              <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
              </View>
            </View>
            <View className="flex-col flex-auto my-auto">
              <View className="w-full flex-row justify-between">
                <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
                <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
              </View>
              <View className="h-3 my-1 w-1/4 bg-neutral-500/30 rounded-full"></View>
            </View>
          </View>
          <View className="h-4 my-1 w-full bg-neutral-500/30 rounded-full"></View>
          <View className="h-4 my-1 w-3/4 bg-neutral-500/30 rounded-full"></View>
          <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
          <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
          <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
          <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
        </View>
      </View>
    ),
    blackbox: getBlackBox(),
    profile: (
      <View className='flex-col sm:px-4 relative'>
        
        <View className="bg-neutral-500/5 w-full aspect-video  sm:aspect-3/1 max-w-screen-2xl mx-auto rounded-b-xl"></View>
        <View className="w-full mx-auto px-8 -translate-16 sm:-translate-y-24  max-w-screen-2xl flex-row gap-x-3">
            <View className="rounded-full absolute right-4 sm:relative bg-neutral-200 dark:bg-neutral-800 border-4 sm:border-8 border-neutral-100 dark:border-neutral-950 h-32 w-32 sm:h-48 sm:w-48"></View>
            <View className="flex-auto mt-28 sm:mt-auto mb-4 gap-y-4 ">
              
                <View className="h-6 sm:h-8 w-40 sm:w-48 bg-neutral-500/20 rounded-full"></View>
                <View className="h-4 w-24 bg-neutral-500/10 rounded-full "></View>
              
            </View>
          </View>
      </View>
    ),
  }
  
export function getSkeleton(name, view) {
    if (name != 'feed' && name != 'one_column_browse' && name != 'notifications') name = 'browse_item'
      return blockSkeletons[name];
}

export function getPageSkeleton(name) {
    return pageSkeletons[name]
}