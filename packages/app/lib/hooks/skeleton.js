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

  var skeleton = ''
  console.log("Skeleton URL: " + url);
  if (url) {
    skeleton = url == '/' || url == '' || url == '/home' ? 'home' : skeleton
    skeleton = url == '/posts-home' ? 'posts-home' : skeleton
    skeleton = url == '/groups-home' ? 'groups-home' : skeleton
    skeleton = url == '/persons-home' ? 'persons-home' : skeleton
    skeleton = url.includes('view-post') ? 'view-post' : skeleton
    skeleton = url.includes('view-group-profile') ? 'view-group' : skeleton
    skeleton = url.includes('view-persons-profile') ? 'view-person' : skeleton
  }

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
      <View className="justify-center flex-auto space-x-6 w-full flex-row  mx-auto">
        <View className="flex-auto flex-col space-y-4 max-w-3xl">
          <View className="bg-neo-500/10 rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              <View className="rounded-full bg-neo-500/20 h-12 w-12"></View>
              <View className="flex-col space-y-2 my-auto">
                <View className="h-4 w-32 bg-neo-500/20 rounded-full"></View>
                <View className="h-3 w-24 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
            <View className="flex-1 space-y-4 py-1">
              <View className="space-y-2">
                <View className="h-6 w-full bg-neo-500/30 rounded-full"></View>
                <View className="h-6 w-3/4 bg-neo-500/30 rounded-full"></View>
              </View>
              <View className="space-y-2">
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 w-2/3 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
          </View>
          <View className="bg-neo-500/10 rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              <View className="rounded-full bg-neo-500/20 h-12 w-12"></View>
              <View className="flex-col space-y-2 my-auto">
                <View className="h-4 w-32 bg-neo-500/20 rounded-full"></View>
                <View className="h-3 w-24 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
            <View className="flex-1 space-y-4 py-1">
              <View className="space-y-2">
                <View className="h-6 w-full bg-neo-500/30 rounded-full"></View>
                <View className="h-6 w-3/4 bg-neo-500/30 rounded-full"></View>
              </View>
              <View className="space-y-2">
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 w-2/3 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
          </View>
          <View className="bg-neo-500/10 rounded-lg p-4 flex flex-col space-y-4 animate-pulse">
            <View className="flex-row space-x-2">
              <View className="rounded-full bg-neo-500/20 h-12 w-12"></View>
              <View className="flex-col space-y-2 my-auto">
                <View className="h-4 w-32 bg-neo-500/20 rounded-full"></View>
                <View className="h-3 w-24 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
            <View className="flex-1 space-y-4 py-1">
              <View className="space-y-2">
                <View className="h-6 w-full bg-neo-500/30 rounded-full"></View>
                <View className="h-6 w-3/4 bg-neo-500/30 rounded-full"></View>
              </View>
              <View className="space-y-2">
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 bg-neo-500/20 rounded-full"></View>
                <View className="h-4 w-2/3 bg-neo-500/20 rounded-full"></View>
              </View>
            </View>
          </View>
        </View>
        <View className="hidden lg:flex flex-col flex-none space-y-4 w-2/5">
          <View>
            <View className="space-y-4 flex-col">
                <View className="bg-neo-500/10 rounded-lg overflow-hidden  flex flex-col animate-pulse">
                     <View className="w-full aspect-video bg-neo-500/10">
                        
                    </View>
                    
                    <View className="flex-1 space-y-4 p-4">
                        <View className="space-y-2 ">
                            <View className="h-5 w-full bg-neo-500/30 rounded-full"></View>
                            <View className="h-5 w-3/4 bg-neo-500/30 rounded-full"></View>
                        </View>
                        <View className="flex-row space-x-2">
                        <View className="rounded-full bg-neo-500/20 h-12 w-12"></View>

                        <View className="flex-col space-y-2 my-auto">
                            <View className="h-4 w-32 bg-neo-500/20 rounded-full"></View>
                            <View className="h-3 w-24 bg-neo-500/20 rounded-full"></View>
                        </View>
                        </View>
                    </View>
                    
                </View>
                <View className="bg-neo-500/10 rounded-lg overflow-hidden  flex flex-col animate-pulse">
                     <View className="w-full aspect-video bg-neo-500/10">
                        
                    </View>
                    
                    <View className="flex-1 space-y-4 p-4">
                        <View className="space-y-2 ">
                            <View className="h-5 w-full bg-neo-500/30 rounded-full"></View>
                            <View className="h-5 w-3/4 bg-neo-500/30 rounded-full"></View>
                        </View>
                        <View className="flex-row space-x-2">
                        <View className="rounded-full bg-neo-500/20 h-12 w-12"></View>

                        <View className="flex-col space-y-2 my-auto">
                            <View className="h-4 w-32 bg-neo-500/20 rounded-full"></View>
                            <View className="h-3 w-24 bg-neo-500/20 rounded-full"></View>
                        </View>
                        </View>
                    </View>
                    
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

  return [loading, skeletons[skeleton]]
}
