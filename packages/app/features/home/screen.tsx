import { A, H1, P, Text, TextLink } from 'app/design/typography'
import Link from '../../components/atoms/link';
import Image from '../../components/atoms/image';
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'


export function HomeScreen() {
  return (
    <View className="w-full h-screen bg-gray-100 dark:bg-gray-900  flex-row ">
      <View className="flex-none flex-col bg-gray-900 border-r border-black/50 space-y-4 hidden sm:block p-4 " >
        <Link href="/" className="">
          <View className="bg-green-500 rounded-lg w-10 h-10 items-center shadow my-auto">
            <View className="bg-green-300 rounded-full w-8 h-8 items-center shadow my-auto"></View>
          </View>
        </Link>
        <Link href="/" className="">
          <View className="bg-blue-500 rounded-lg w-10 h-10 items-center shadow my-auto">
            <View className="bg-blue-300 rounded-full w-8 h-8 items-center shadow my-auto"></View>
          </View>
        </Link>
        <Link href="/" className="">
          <View className="bg-rose-500 rounded-lg w-10 h-10 items-center shadow my-auto">
            <View className="bg-rose-300 rounded-full w-8 h-8 items-center shadow my-auto"></View>
          </View>
        </Link>
      </View>
      <View className="flex-auto h-screen flex-col " >
        <Text className='text-white px-4 py-3 bg-blue-500 text-base text-center'>
          Announcement! Read <TextLink className='text-white font-semibold underline text-base' href="/about">about G-Med</TextLink> or <TextLink className='text-white font-semibold underline text-base' href="/about">contact us</TextLink> for more info.
        </Text>
        <View className="bg-white dark:bg-gray-800 h-16 hidden sm:flex bg-white border-b border-gray-200 dark:border-gray-700/50 flex-row ">
          <View className="p-4 h-full flex-row ">
            <View className="w-8 h-8 bg-blue-500/50 rounded-full">
            </View>
            <View className="hidden w-52 mx-4 md:block flex-auto h-8 bg-blue-500/20 rounded-full">
            </View>
          </View>   
          <Row className="flex-auto items-center flex-row space-x-4">
                    <TextLink className='text-blue-500 font-bold text-base' href="/">
                      Home
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/contact">
                      Contact
                    </TextLink>                
                    <TextLink className='text-blue-500 font-bold text-base' href="/about">
                      About
                    </TextLink>
                    
          </Row> 
        </View>
        <View className=" flex-row flex-1">
          <View className="w-72 flex-none hidden md:flex p-4  bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/50 flex-col space-y-2">
                    <TextLink className='text-blue-500 font-bold text-base' href="/timeline-view-home">
                      Feed
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/posts-home">
                      Posts
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/persons-home">
                      People
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/persons-home">
                      Groups
                    </TextLink>
                    
                    
          
          </View>
          <View className="flex-auto flex flex-col flex-1 ">
                <View className="h-[20vh] bg-blue-500/50   ">
                    
                    
                </View>
                <View className="overflow-scroll px-4 py-3 flex border-b border-gray-200 dark:border-gray-700/50 items-center flex-row space-x-8 justify-center  ">
                    
                  <TextLink className='text-blue-500 font-bold text-base' href="/timeline-view-home">
                      Feed
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/posts-home">
                      Posts
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/contact">
                      Contact
                    </TextLink>                
                    <TextLink className='text-blue-500 font-bold text-base' href="/about">
                      About
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/timeline-view-home">
                      Feed
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/posts-home">
                      Posts
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/contact">
                      Contact
                    </TextLink>                
                    <TextLink className='text-blue-500 font-bold text-base' href="/about">
                      About
                    </TextLink>
                </View>
                <View className="flex-auto relative w-full flex-row overflow-scroll max-w-6xl mx-auto">
                    <View className=" flex-auto  flex-col p-4 space-y-2 max-w-3xl mx-auto ">
                        <View className="bg-white p-[1px] dark:bg-gray-800 overflow-hidden border rounded-lg border-gray-200 dark:border-gray-700/50   ">
                          <View className="bg-blue-500/20 w-full pb-[30%] rounded-t-md "></View>
                          
                          <View className='flex-row px-4 py-3 space-x-2 animate-pulse'>
                            <View className='w-10 h-10  bg-gray-500/40 rounded-full'></View>
                            <View className='w-24 my-auto  flex-col space-y-1'>
                              <View className='w-full h-3  bg-gray-500/40 rounded-full'></View>
                              <View className='w-2/3 h-3  bg-gray-500/20 rounded-full'></View>
                            </View>
                          
                          </View>
                          <View className='w-full px-4 pb-2 flex-col space-y-1'>
                              <View className='w-full h-4  bg-gray-500/40 rounded-full'></View>
                              <View className='w-2/3 h-4  bg-gray-500/40 rounded-full'></View>
                          </View>
                          <View className='w-full px-4 pb-3 flex-col space-y-1'>
                              <View className='w-full h-3  bg-gray-500/20 rounded-full'></View>
                              <View className='w-full h-3  bg-gray-500/20 rounded-full'></View>
                              <View className='w-full h-3  bg-gray-500/20 rounded-full'></View>
                              <View className='w-full h-3  bg-gray-500/20 rounded-full'></View>
                              <View className='w-2/3 h-3  bg-gray-500/20 rounded-full'></View>
                          </View>
                          <View className=" px-4 pb-4 w-full">
                              <View className="bg-green-500/20 pb-[100%] w-full  rounded-md ">
                              </View>
                          </View>
                         
                          
                          
                          
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-80  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-80  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-80  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-80  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-80  ">
                        </View>
                    
                    </View>
                    <View className="hidden sticky top-0 xl:flex flex-none w-2/5  flex-col p-4 pl-0 space-y-2 ">
                        <View className="bg-white dark:bg-gray-800 border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                        <View className="bg-white dark:bg-gray-800  border rounded-lg border-gray-200 dark:border-gray-700/50 h-24  ">
                        </View>
                    
                    </View>
                    
                </View>
          
          </View>
        </View>
        

      </View>
      
      <View className="">
      </View>
    </View>
    
  )
}
