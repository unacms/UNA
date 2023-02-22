import { A, H1, P, Text, TextLink } from 'app/design/typography'
import Link from '../../components/atoms/link';
import Image from '../../components/atoms/image';
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'


export function HomeScreen() {
  return (
    <View className="w-full h-screen flex-row bg-gray-900">
      <View className="flex-none flex-col  space-y-4 hidden sm:block p-4" >
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
      <View className="flex-auto h-screen bg-gray-100 flex-col " >
        <Text className='text-white px-4 py-3 bg-blue-500 text-base text-center'>
          Announcement! Read <TextLink className='text-white font-semibold underline text-base' href="/about">about G-Med</TextLink> or <TextLink className='text-white font-semibold underline text-base' href="/about">contact us</TextLink> for more info.
        </Text>
        <View className="bg-white h-16  bg-white border-b border-gray-200 flex-row ">
          <View className=" p-4 h-full flex-row ">
            <View className="w-8 h-8 bg-blue-200 rounded-full">
            </View>
            <View className="hidden w-52 mx-4 md:block flex-auto h-8 bg-blue-200 rounded-full">
            </View>
          </View>   
          <View className="flex-auto items-center flex-row space-x-4">
                    <TextLink className='text-blue-500 font-bold text-base' href="/">
                      Home
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/contact">
                      Contact
                    </TextLink>                
                    <TextLink className='text-blue-500 font-bold text-base' href="/about">
                      About
                    </TextLink>
                    
          </View> 
                    
                    

                    
                    
                   
                  

        </View>
        <View className=" flex-row flex-1">
          <View className="w-72 flex-none hidden md:flex p-4  bg-white border-r border-gray-200 flex-col space-y-2">
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
                <View className="px-4 py-3 flex border-b border-gray-200 items-center flex-row space-x-4  ">
                    
                  <TextLink className='text-blue-500 font-bold text-base' href="/timeline-view-home">
                      Feed
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/posts-home">
                      Posts
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/persons-home">
                      Tab 3
                    </TextLink>
                    <TextLink className='text-blue-500 font-bold text-base' href="/persons-home">
                      Tab 4
                    </TextLink>
                </View>
                <View className="flex-auto  w-full flex-row">
                    <View className=" flex-auto ">
                    
                    
                    </View>
                    <View className="hidden xl:flex border-l border-gray-200 flex-none w-96 ">
                    
                    
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
