import Router from 'next/router'
import { useEffect, useState } from 'react'
import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'


const items = ['', '', '', '', ''];
const maxWidth = appSetting('layout', 'max_width');

var blockSkeletons = {
  'bx_posts': <>
    {items.map((item, index) => (
        <View  key={'bx_persons' + index} className="flex-row w-full ">
        <View className="mt-4  mx-2 flex-auto aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
          <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
        <View className="mt-4  mx-2  flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
        <View className="mt-4  mx-2 hidden md:block flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
        <View className="hidden lg:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
        <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
        <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
        </View> 
        </View>
  </View>
    ))}  
    </>,
  'system': <>
  {items.map((item, index) => (
      <View  key={'bx_persons' + index} className="flex-row w-full ">
      <View className="mt-4  mx-2 flex-auto aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2  flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2 hidden md:block flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden lg:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
</View>
  ))}  
  </>,
  'bx_persons': <>
  {items.map((item, index) => (
      <View  key={'bx_persons' + index} className="flex-row w-full ">
      <View className="mt-4  mx-2 flex-auto aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2  flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2 hidden md:block flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden lg:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
</View>
  ))}  
  </>, 
   
  'bx_groups': <>
  {items.map((item, index) => (
      <View  key={'bx_persons' + index} className="flex-row w-full ">
      <View className="mt-4  mx-2 flex-auto aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
        <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2  flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="mt-4  mx-2 hidden md:block flex-auto  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden lg:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
      <View className="hidden xl:block flex-auto mt-4  mx-2  aspect-square rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark border-4 border-transparent justify-between">
      <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full ">
      </View> 
      </View>
</View>
  ))}  
  </>,  
  'bx_posts:browse': <>
  {items.map((item, index) => (
      <View  key={'home33' + index} className="
      mt-4 mx-2             
      p-1 group duration-200 overflow-hidden sm:rounded-lg  
      bg-backgroundcard dark:bg-backgroundcard-dark dark:active:bg-backgroundcard-darkactive 
      border
      border-bordercolorcard dark:border-bordercolorcard-dark">
     
          <View className='flex-col    '> 
             <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full "></View> 
          
   
              <View className="flex flex-col gap-1 p-3 ">
              <View className="h-6 my-1  w-1/4 bg-neutral-500/20 rounded-full"></View>
        <View className="h-5 my-1 w-full bg-neutral-500/20 rounded-full"></View>
        <View className="h-5 mb-6 w-3/4 bg-neutral-500/20 rounded-full"></View>
        <View className="flex-row gap-2"> 
              <View className="h-6 w-6 rounded-full w-1/4 bg-neutral-500/20 rounded-full"></View>
              <View className="h-4 w-1/2 my-auto bg-neutral-500/20 rounded-full"></View>
        </View>
                      
                  
                 
              </View>

            
          </View>      
  </View>  
 
  ))}  
  </>,
  'feed': <View className="sm:px-4 sm:py-2  sm:gap-2">
    {appSetting('feed', 'default_view') == 'small' && items.map((item, index) => (
        <View  key={'home2' + index} className="bg-backgroundcard dark:bg-backgroundcard-dark mt-[1px] sm:rounded-lg p-2 flex flex-col gap-4 animate-pulse">
        <View className="flex-row gap-2">sadas
          
          <View className="relative flex-row">
                    <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View>
                  
          </View>
          </View>
          <View className="flex-col flex-auto my-auto">
            <View className="w-full flex-row justify-between"> 
              <View className="h-3 my-1 w-1/4 bg-neutral-500/20 rounded-full"></View>
              <View className="h-3 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
            </View>
            <View className="h-5 my-1  w-full bg-neutral-500/30 rounded-full"></View>
            <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>  
          </View>
        </View>
      
      </View>
    ))}
    {appSetting('feed', 'default_view') != 'small' &&  items.map((item, index) => (
      <View  key={'home3' + index}  className="bg-backgroundcard dark:bg-backgroundcard-dark  sm:rounded-lg p-4 flex flex-col  animate-pulse mt-2 sm:m-0">
      <View className="flex-row gap-x-2 mb-2">
        
        <View className="relative flex-row">
                  <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                  <View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
                  <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View>
                
        </View>
        </View>
        <View className="flex-col flex-auto my-auto">
          <View className="w-full flex-row justify-between"> 
            <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
            <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
          </View>
          <View className="h-3 my-1  w-1/4 bg-neutral-500/30 rounded-full"></View>
        </View>
        
      </View>
      <View className="h-4 my-1 w-full bg-neutral-500/30 rounded-full"></View>
      <View className="h-4 my-1 w-3/4 bg-neutral-500/30 rounded-full"></View>
      <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
      <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
      <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>

      <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
    
    </View>
    ))}</View>
}

var skeletons = {
  '': (
    <View className={maxWidth + ' mx-auto w-full animate-pulse  '}>
      <View className=" rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark m-4  p-4 flex flex-col gap-6">
        
        <View className="flex-col  gap-y-4 ">
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
      <View className="hidden md:block  w-1/4 xl:w-1/5 ">
        <View className="flex-col flex-auto px-4 py-2 animate-pulse gap-y-0.5 ">
          {items.map((item, index) => (
              <View key={'home1' + index}>
                  <View className="p-2 border border-transparent flex-row gap-2 ">
                      <View className="h-6 w-6  flex-none  bg-neutral-500/30  rounded-full"></View>
                      <View className="h-5 flex-auto my-0.5  bg-neutral-500/20 rounded-full"></View>
                  </View>
                  <View className="p-2 border border-transparent flex-row gap-2 ">
                      <View className="h-6 w-6  flex-none  bg-neutral-500/30  rounded-full"></View>
                      <View className="h-5 w-3/4 my-0.5  bg-neutral-500/20 rounded-full"></View>
                  </View>
            </View>
          ))}
        </View>
      </View>

      <View className="flex-auto  w-3/4 xl:w-4/5 flex-row">
            <View className="flex-auto w-2/3">
              {blockSkeletons.feed}
            </View>
          <View className="hidden  xl:flex flex-col  top-0 flex-none w-1/3 ">
              {blockSkeletons['bx_posts:browse']}
          </View>
      </View>
    </View>


  
    </View>
  ),
  'view-post': (
       <View className="flex w-full justify-center sm:p-4 flex-row gap-4">
        <View className="max-w-5xl  w-full bg-backgroundcard dark:bg-backgroundcard-dark border-y sm:border border-bordercolorcard dark:border-bordercolorcard-dark sm:rounded-lg p-4 flex flex-col  animate-pulse  sm:m-0">
              <View className="flex-row gap-x-2 mb-2">
                
                <View className="relative flex-row">
                          <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                          <View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
                          <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View>
                        
                </View>
                </View>
                <View className="flex-col flex-auto my-auto">
                  <View className="w-full flex-row justify-between"> 
                    <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
                  </View>
                  <View className="h-3 my-1  w-1/4 bg-neutral-500/30 rounded-full"></View>
                  
                  
                  
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
  'item': (
    <View className="flex w-full justify-center sm:p-4 flex-row gap-4">
     <View className="max-w-5xl  w-full bg-neocard dark:bg-neocard-dark border-y sm:border border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col  animate-pulse  sm:m-0">
           <View className="flex-row gap-x-2 mb-2">
             
             <View className="relative flex-row">
                       <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                       <View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
                       <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View>
                     
             </View>
             </View>
             <View className="flex-col flex-auto my-auto">
               <View className="w-full flex-row justify-between"> 
                 <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
                 <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
               </View>
               <View className="h-3 my-1  w-1/4 bg-neutral-500/30 rounded-full"></View>
               
               
               
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
  'posts-home': (
    <View className="flex mx-auto w-full justify-center sm:p-4 flex-col animate-pulse max-w-screen-2xl">
      {blockSkeletons['bx_posts']}
    </View>
  ),
  'persons-home': (
    <View className="flex mx-auto w-full justify-center sm:p-4 flex-col animate-pulse max-w-screen-2xl">
        {blockSkeletons['bx_persons']}
    </View>
  ),
  'friends': (
    <View className="flex mx-auto w-full justify-center sm:p-4 flex-col animate-pulse max-w-screen-2xl">
        {blockSkeletons['bx_persons']}
    </View>
  ),
  'groups-home': (
    <View className="flex mx-auto w-full justify-center sm:p-4 flex-col animate-pulse max-w-screen-2xl">
        {blockSkeletons['bx_groups']}
    </View>
  ),
  'view-group': (
    <View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        view-group
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
    </View>
  ),
  'view-person': (
    <View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        view-person
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
      <View className="bg-neutral-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
        <View className="animate-pulse flex gap-3">
          <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
          <View className="flex-1 gap-y-2 py-1">
            <View className="h-5 w-1/2 bg-neutral-600/20 rounded"></View>
            <View className="gap-y-1">
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
              <View className="h-3 bg-neutral-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
    </View>
  ),
}

export function getSkeleton (name, view) {

  let a = blockSkeletons[name + ':' + view]
  if (a)
    return a;
  return blockSkeletons[name];
}

export default function (props) {
    const [loading, setLoading] = useState(false)
    const [url, setUrl] = useState(false)
    useEffect(() => {
        Router.events.on('routeChangeStart', (url, { shallow }) => {
            setLoading(true)
            setUrl(url)
    })
    Router.events.on('routeChangeComplete', (url, { shallow }) => {
        setLoading(false)
    })
    Router.events.on('routeChangeError', (url, { shallow }) => {
        setLoading(false)
    })
    }, []);

    var skeleton = ''
    let sUrl = url;
    if (sUrl =='' || sUrl =='/')
    sUrl = 'home'

    if (sUrl) {
        let u = sUrl.split('/');
        u = u.filter(Boolean);
        skeleton = skeletons['' + u[0]];
        if (!skeleton)
            skeleton = skeletons[''];
    }  

    return [loading, skeleton]
}
