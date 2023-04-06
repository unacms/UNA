import Router from 'next/router'
import { useEffect, useState } from 'react'
import { View } from 'app/design/view'

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
    }, [])

    var skeletons = {
    '': (
      <View>
        <View className=" p-4 @xl/cell:mx-4 @xl/cell:mt-4 flex flex-col gap-6">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-12 w-12"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="h-3 w-1/3 bg-gray-600/20 rounded"></View>
            </View>
          </View>
          <View className="flex-1 animate-pulse space-y-4 py-1">
            <View className="h-6 w-2/3 bg-gray-600/20 rounded"></View>
            <View className="space-y-2">
              <View className="h-4 bg-gray-600/20 rounded"></View>
              <View className="h-4 bg-gray-600/20 rounded"></View>
              <View className="h-4 bg-gray-600/20 rounded"></View>
            </View>
          </View>
        </View>
      </View>
    ),
    home: (
      <View className="justify-center h-screen lg:p-0 sm:-mt-4 flex-auto  w-full max-w-screen-2xl flex-row  mx-auto">
        <View className='w-2/12 hidden lg:flex bg-neocard 2xl:bg-transparent dark:bg-neocard-dark sm:mr-2'>
          <View className="flex-col flex-auto p-4 animate-pulse space-y-0.5 ">
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 flex-auto my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 w-3/4 my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 flex-auto my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 w-3/4 my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 flex-auto my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            <View className="p-2 border border-transparent flex-row space-x-2 ">
              <View className="h-6 w-6  flex-none  bg-neogray-500/30  rounded-full"></View>
              <View className="h-5 w-3/4 my-0.5  bg-neogray-500/20 rounded-full"></View>
            </View>
            

          </View>
        </View>

        <View className="flex-auto sm:m-4 flex-col max-w-3xl space sm:space-y-1 w-7/12">
          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-3 my-1 w-1/4 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-3 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                
                  <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                
              </View>
            </View>
          
          </View>
          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-3 my-1 w-1/4 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-3 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                
                  <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                
              </View>
            </View>
          
          </View>
          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-3 my-1 w-1/4 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-3 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                
                  <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                
              </View>
            </View>
          
          </View>

          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-2 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-4 my-1 w-1/3 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-4 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-3 my-1  w-1/4 bg-neogray-500/30 rounded-full"></View>
                
                
                
              </View>
              
            </View>
            <View className="h-4 my-1 w-full bg-neogray-500/30 rounded-full"></View>
            <View className="h-4 my-1 w-3/4 bg-neogray-500/30 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>

            <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
          
          </View>
          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-2 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-4 my-1 w-1/3 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-4 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-3 my-1  w-1/4 bg-neogray-500/30 rounded-full"></View>
                
                
                
              </View>
              
            </View>
            <View className="h-4 my-1 w-full bg-neogray-500/30 rounded-full"></View>
            <View className="h-4 my-1 w-3/4 bg-neogray-500/30 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>

            <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
          
          </View>
          <View className="bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark sm:rounded-lg p-4 flex flex-col space-y-2 animate-pulse">
            <View className="flex-row space-x-2">
              
              <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                        <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                      
                  </View>
              </View>
              <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between"> 
                  <View className="h-4 my-1 w-1/3 bg-neogray-500/20 rounded-full"></View>
                  <View className="h-4 my-1 w-6 bg-neogray-500/20 rounded-full"></View>
                </View>
                <View className="h-3 my-1  w-1/4 bg-neogray-500/30 rounded-full"></View>
                
                
                
              </View>
              
            </View>
            <View className="h-4 my-1 w-full bg-neogray-500/30 rounded-full"></View>
            <View className="h-4 my-1 w-3/4 bg-neogray-500/30 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>
            <View className="h-3 my-1 w-full bg-neogray-500/20 rounded-full"></View>

            <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
          
          </View>





         
     

        </View>

        <View className="hidden sm:m-4 lg:flex flex-col flex-none space-y-2 w-3/12">
                  <View className="overflow-hidden bg-neocard dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark sm:rounded-lg  flex flex-col  animate-pulse">
                  <View className="bg-primary/10 w-full aspect-video">
                    
                    
                    
                  </View>
                  <View className="flex-row space-x-2 p-4">
                    
                    <View className="relative flex-row">
                              <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                              <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                              <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                            
                        </View>
                    </View>
                    <View className="flex-col flex-auto my-auto">
                      
                      <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                      
                        <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                      
                    </View>
                  </View>
                
                  </View>

                  <View className="overflow-hidden bg-neocard dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark sm:rounded-lg  flex flex-col  animate-pulse">
                  <View className="bg-primary/10 w-full aspect-video">
                    
                    
                    
                  </View>
                  <View className="flex-row space-x-2 p-4">
                    
                    <View className="relative flex-row">
                              <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                              <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                              <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                            
                        </View>
                    </View>
                    <View className="flex-col flex-auto my-auto">
                      
                      <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                      
                        <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                      
                    </View>
                  </View>
                
                  </View>

                  <View className="overflow-hidden bg-neocard dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark sm:rounded-lg  flex flex-col  animate-pulse">
                  <View className="bg-primary/10 w-full aspect-video">
                    
                    
                    
                  </View>
                  <View className="flex-row space-x-2 p-4">
                    
                    <View className="relative flex-row">
                              <View className="h-12 w-12 aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full">
                              <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
                              <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
                            
                        </View>
                    </View>
                    <View className="flex-col flex-auto my-auto">
                      
                      <View className="h-4 my-1  w-full bg-neogray-500/30 rounded-full"></View>
                      
                        <View className="h-3 my-1 w-3/4 bg-neogray-500/20 rounded-full"></View>
                      
                    </View>
                  </View>
                
                  </View>
        </View>
      </View>
    ),
    'posts-home': (
      <View className="flex flex-col @xl/cell:gap-2">
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
            <View className=" flex-none  flex gap-3">
              <View className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></View>
              <View className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                <View className="h-4 w-1/3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 w-1/4 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>

            <View className="flex-auto flex flex-col gap-y-2.5 ">
              <View className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></View>
              <View className="h-5 w-2/3 bg-gray-600/30 rounded-full"></View>
              <View className="space-y-1.5 ">
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px]">
          <View className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
            <View className=" flex-none  flex gap-3">
              <View className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></View>
              <View className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                <View className="h-4 w-1/3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 w-1/4 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>

            <View className="flex-auto flex flex-col gap-y-2.5 ">
              <View className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></View>
              <View className="h-5 w-2/3 bg-gray-600/30 rounded-full"></View>
              <View className="space-y-1.5 ">
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px]">
          <View className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
            <View className=" flex-none  flex gap-3">
              <View className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></View>
              <View className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                <View className="h-4 w-1/3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 w-1/4 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>

            <View className="flex-auto flex flex-col gap-y-2.5 ">
              <View className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></View>
              <View className="h-5 w-2/3 bg-gray-600/30 rounded-full"></View>
              <View className="space-y-1.5 ">
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
                <View className="h-3 bg-gray-600/20 rounded-full"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    'groups-home': (
      <View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          groups-home
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    'persons-home': (
      <View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          persons-home
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    'view-post': (
      <View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4 mt-[1px] @xl/cell:mx-4 @xl/cell:mt-4 flex flex-col gap-6">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-12 w-12"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded-full"></View>
              <View className="h-3 w-1/3 bg-gray-600/20 rounded-full"></View>
            </View>
          </View>
          <View className="flex-1 animate-pulse space-y-2 py-1">
            <View className="h-6  bg-gray-600/20 rounded-full"></View>
            <View className="h-6 w-2/3 bg-gray-600/20 rounded-full"></View>
            <View className="space-y-2.5 pt-3">
              <View className="h-4 bg-gray-600/20 rounded-full"></View>
              <View className="h-4 bg-gray-600/20 rounded-full"></View>
              <View className="h-4 bg-gray-600/20 rounded-full"></View>
              <View className="h-4 bg-gray-600/20 rounded-full"></View>
              <View className="h-4 bg-gray-600/20 rounded-full"></View>
              <View className="h-4 bg-gray-600/20 rounded-full w-2/3"></View>
            </View>
          </View>
        </View>
      </View>
    ),
    'view-group': (
      <View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          view-group
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
    'view-person': (
      <View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          view-person
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
          <View className="animate-pulse flex gap-3">
            <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
            <View className="flex-1 space-y-2 py-1">
              <View className="h-5 w-1/2 bg-gray-600/20 rounded"></View>
              <View className="space-y-1">
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
                <View className="h-3 bg-gray-600/20 rounded"></View>
              </View>
            </View>
          </View>
        </View>
      </View>
    ),
  }

    var skeleton = ''
    if (url =='' || url =='/')
        url =='/home'
    if (url) {
        let u = url.split('/');
        u = u.filter(Boolean);
        skeleton = skeletons['' + u[0]];
        if (!skeleton)
            skeleton = skeletons[''];
    }  

    return [loading, skeleton]
}
