import { A, H1, P, Text, TextLink } from 'app/design/typography'
import Link from '../components/atoms/link'
import {IconPlus, IconMessage} from '../components/svg'
import Image from '../components/atoms/image'
//import Svg, { Path } from "react-native-svg";
import { View,Row } from 'app/design/view'
import { TouchableOpacity } from 'app/design/view'

export function HomeScreen() {
  return (
    <View className="w-full h-screen bg-screen dark:bg-screen-dark flex-row">
      
      <View className="flex-none flex-col bg-neo-900 border-r border-black/50 space-y-4 hidden sm:block p-4 ">
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
      <View className="relative  h-screen  ">
        <Text className=" text-white px-4 py-3 bg-brand text-base text-center ">
        <IconPlus className="h-6 w-6"></IconPlus><IconMessage className="h-6 w-6"></IconMessage>Announcement1! Read{' '}
          <TextLink
            className="text-white font-semibold underline text-base"
            href="/about"
          >
            about G-Med
          </TextLink>{' '}
          or{' '}
          <TextLink
            className="text-white font-semibold underline text-base"
            href="/about"
          >
            contact us
          </TextLink>{' '}
          for more info.
        </Text>

        <View className=" w-screen bg-navbar dark:bg-navbar-dark flex border-b border-bordercolor/10 dark:border-bordercolor-dark/10 flex-row ">
          <View className="p-4 h-full flex-row ">
            <View className="w-8 h-8 bg-blue-500/50 rounded-full"></View>
            <View className="hidden w-52 mx-4 md:block flex-auto h-8 bg-blue-500/20 rounded-full"></View>
          </View>

          <Row className="flex-auto items-center flex-row space-x-4 ">
            <TouchableOpacity>
              <Link
                href="/timeline-view-home"
                className="group flex-row items-center rounded-lg p-2   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
              >
                <View className="h-6 w-6 bg-neo-500 rounded-full duration-200 group-hover:bg-neo-900 dark:bg-neo-200 dark:group-hover:bg-white" />
                <Text className="ml-2 mr-1 text-base font-semibold duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">Feed</Text>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity>
              <TextLink
                href="/contact"
                className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text className="ml-2 mr-1 ">Contact</Text>
              </TextLink>
            </TouchableOpacity>
            <TouchableOpacity>
              <TextLink
                href="/about"
                className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text className="ml-2 mr-1 ">About</Text>
              </TextLink>
            </TouchableOpacity>
            <TouchableOpacity>
              <TextLink
                href="/posts-home"
                className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text className="ml-2 mr-1 ">Posts</Text>
              </TextLink>
            </TouchableOpacity>
            <TouchableOpacity>
              <TextLink
                href="/profile"
                className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text className="ml-2 mr-1 ">Profile</Text>
              </TextLink>
            </TouchableOpacity>
          </Row>
        </View>
        


        <View className=" flex-row flex-1">
          <View className="w-72  flex-none hidden xl:flex px-3 py-4  bg-sidebar dark:bg-sidebar-dark border-r border-bordercolor/10 dark:border-bordercolor-dark/10 flex-col space-y-2">
            <View className="flex-col space-y-2">
              <TouchableOpacity>
                <TextLink
                  href="/timeline-view-home"
                  className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                  <Text className="ml-2 mr-1  ">Feed</Text>
                </TextLink>
              </TouchableOpacity>
              <TouchableOpacity>
                <TextLink
                  href="/posts-home"
                  className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                  <Text className="ml-2 mr-1  flex-1 whitespace-nowrap">
                    Posts
                  </Text>
                  <Text className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-200 px-2 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Pro
                  </Text>
                </TextLink>
              </TouchableOpacity>
              <TouchableOpacity>
                <TextLink
                  href="/profile"
                  className="flex items-center rounded-lg p-2 text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                  <Text className="ml-2 mr-1 flex-1 whitespace-nowrap">
                    Profile
                  </Text>
                  <Text className="ml-2 inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 p-3 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    3
                  </Text>
                </TextLink>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-auto flex flex-col flex-1 ">
            <View className="flex-auto relative w-full sm:p-4 lg:p-6 flex-row space-x-4 lg:space-x-6 overflow-scroll max-w-6xl mx-auto">
              <View className=" flex-auto  flex-col space-y-2 sm:space-y-4 max-w-2xl mx-auto ">
                <View className="bg-card group duration-200 hover:shadow-lg active:shadow-none dark:bg-card-dark overflow-hidden border sm:rounded-lg hover:border-bordercolor/20 border-bordercolor/10 dark:border-bordercolor-dark/10 dark:hover:border-bordercolor-dark/20   ">
                  <View className="bg-teal-500/40 w-full aspect-3/1   "></View>

                  <View className="flex-row p-4 space-x-2 ">
                    <View className="w-12 h-12  bg-blue-500/50 rounded-full"></View>
                    <View className=" my-auto  flex-col ">
                      <Text className="text-gray-700 hover:text-gray-900 duration-200 dark:hover:text-white dark:text-gray-300 text-base tracking-tight hover:underline font-bold">
                        Dr Sponge Bob Jr
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-sm  ">
                        2 min ago
                      </Text>
                    </View>
                  </View>
                  <View className="w-full px-4 pb-4 flex-col space-y-4">
                    <Text className="text-gray-800  group-hover:text-gray-900 duration-200 dark:group-hover:text-white dark:text-gray-200  text-2xl  tracking-tight font-bold">
                      From Classroom to Career: Navigating the Modern Challenges
                      of Transitioning into the Workforce
                    </Text>
                    <View className="flex-row space-x-2 h-12 overflow-hidden relative">
                      <Text className="text-gray-700  dark:text-gray-300 text-base">
                        Our app provides an intuitive and easy-to-use interface
                        for users to publish and share content on their social
                        media accounts. Leveraging the power of UNA's community
                        platform, our app allows users to connect and engage with
                        like-minded individuals, creating a vibrant social network
                        that is both fun and functional.
                      </Text>
                      <View className='absolute  flex-row bottom-0  right-0 bg-gradient-to-r '>
                        <View className='  w-10 right-0 bg-gradient-to-r from-transparent to-white dark:to-gray-800'>
                          
                        </View>
                        <View className='pl-2  bg-white dark:bg-gray-800'>
                          <Text className="text-blue-600 dark:text-blue-400 text-base font-semibold">
                          More...
                          </Text>
                        </View>
                        
                      </View>
                    </View>
                  </View>
                  <View className="w-full pb-4 rounded-lg px-4">
                    <View className="w-full aspect-square rounded-lg bg-blue-500/50 "></View>
                  </View>
                  <View className='flex-row w-full space-x-4'>
                      <View className="px-4 mb-3 flex-auto flex-row space-x-4  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">16</Text> comments
                        </Text>
                      </View>
                      <View className="px-4 mb-3  flex-row space-x-4  ">
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">12</Text> views
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">48</Text> likes
                        </Text>
                
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          <Text className="font-bold text-gray-700 dark:text-gray-300">32</Text> reposts
                        </Text>
                      </View>
                  </View>

                  <View className="px-4 py-2  border-t border-gray-500/20  flex-row space-x-1  ">
                    
                  <View className='flex-row w-full space-x-4'>
                      <View className=" flex-row space-x-2  ">
                          <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Like
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Comment
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Repost
                          </Text>
                        </View>
                        <View className="group flex-auto flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            Share
                          </Text>
                        </View>

                      </View>
                      <View className=" flex-auto space-x-2 flex-row justify-end ">
                        <View className="group  flex py-2 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                          <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                            More
                          </Text>
                        </View>
                      </View>
                  </View>
                    
                    
                    
                    
                  </View>
                </View>
                <View className="bg-white animate-pulse p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="flex-row p-4 space-x-2 ">
                    <View className="w-10 h-10  bg-gray-500/20 rounded-full"></View>
                    <View className="w-1/3 my-auto  flex-col space-y-1">
                      <View className="w-full h-3  bg-gray-500/20 rounded-full"></View>
                      <View className="w-2/3 h-3  bg-gray-500/10 rounded-full"></View>
                    </View>
                  </View>

                  <View className="w-full px-4 pb-4 flex-col space-y-1">
                    <View className="w-full h-3  bg-gray-500/10 rounded-full"></View>
                    <View className="w-full h-3  bg-gray-500/10 rounded-full"></View>

                    <View className="w-3/4 h-3  bg-gray-500/10 rounded-full"></View>
                  </View>
                </View>
                <View className="bg-white p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="flex-row p-4 space-x-2 ">
                    <View className="w-10 h-10  bg-blue-500/50 rounded-full"></View>
                    <View className=" my-auto  flex-col ">
                      <Text className="text-gray-800 dark:text-gray-200 text-sm tracking-tight hover:underline font-bold">
                        Fyodor Dusty Esky
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs tracking-tight ">
                        2 min ago
                      </Text>
                    </View>
                  </View>
                  <View className="w-full px-4 pb-4 flex-col space-y-1">
                    <Text className="text-gray-800 dark:text-gray-200 text text-xl leading-6 tracking-tight font-bold">
                      From Classroom to Career: Navigating the Modern Challenges
                      of Transitioning into the Workforce
                    </Text>
                    <Text className="text-gray-700 dark:text-gray-300">
                      Our app provides an intuitive and easy-to-use interface
                      for users to publish and share content on their social
                      media accounts. Leveraging the power of UNA's community
                      platform, our app allows users to connect and engage with
                      like-minded individuals, creating a vibrant social network
                      that is both fun and functional.
                    </Text>
                  </View>
                  <View className="px-4 mb-3  flex-row space-x-3  ">
                    <Text className="text-gray-600 dark:text-gray-400 text-xs">
                      <Text className="font-bold">12</Text> views
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-xs">
                      <Text className="font-bold">48</Text> likes
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-xs">
                      <Text className="font-bold">16</Text> comments
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-xs">
                      <Text className="font-bold">32</Text> reposts
                    </Text>
                  </View>

                  <View className="px-4 py-1  border-t border-gray-500/20  flex-row space-x-1  ">
                    <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                        Like
                      </Text>
                    </View>
                    <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                        Comment
                      </Text>
                    </View>
                    <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                        Repost
                      </Text>
                    </View>
                    <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                        Share
                      </Text>
                    </View>
                    <View className="group flex-auto flex p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Text className="group-hover:text-gray-800 text-gray-600 dark:group-hover:text-gray-200 dark:text-gray-400 text-sm font-semibold mx-auto">
                        More
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="bg-white p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="bg-teal-500/40 w-full pb-[33%] sm:rounded-t-md "></View>

                  <View className="flex-row px-4 py-3 space-x-2 ">
                    <View className="w-10 h-10  bg-blue-500/50 rounded-full"></View>
                    <View className=" my-auto  flex-col ">
                      <Text className="text-gray-800 dark:text-gray-200 text-sm tracking-tight hover:underline font-bold">
                        Dr Sponge Bob Jr
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs tracking-tight ">
                        2 min ago
                      </Text>
                    </View>
                  </View>
                  <View className="w-full px-4 pb-4 flex-col space-y-1">
                    <Text className="text-gray-800 dark:text-gray-200 text text-xl leading-6 tracking-tight font-bold">
                      From Classroom to Career: Navigating the Modern Challenges
                      of Transitioning into the Workforce
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      Our app provides an intuitive and easy-to-use interface
                      for users to publish and share content on their social
                      media accounts. Leveraging the power of UNA's community
                      platform, our app allows users to connect and engage with
                      like-minded individuals, creating a vibrant social network
                      that is both fun and functional.
                    </Text>
                  </View>
                </View>
                <View className="bg-white p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="bg-teal-500/40 w-full pb-[33%] sm:rounded-t-md "></View>

                  <View className="flex-row px-4 py-3 space-x-2 ">
                    <View className="w-10 h-10  bg-blue-500/50 rounded-full"></View>
                    <View className=" my-auto  flex-col ">
                      <Text className="text-gray-800 dark:text-gray-200 text-sm tracking-tight hover:underline font-bold">
                        Dr Sponge Bob Jr11
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs tracking-tight ">
                        2 min ago
                      </Text>
                    </View>
                  </View>
                  <View className="w-full px-4 pb-3 flex-col space-y-1">
                    <Text className="text-gray-800 dark:text-gray-200 text text-xl leading-6 tracking-tight font-bold">
                      From Classroom to Career: Navigating the Modern Challenges
                      of Transitioning into the Workforce
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      Our app provides an intuitive and easy-to-use interface
                      for users to publish and share content on their social
                      media accounts. Leveraging the power of UNA's community
                      platform, our app allows users to connect and engage with
                      like-minded individuals, creating a vibrant social network
                      that is both fun and functional.
                    </Text>
                  </View>

                  <View className=" px-4 pb-4 w-full">
                    <View className="bg-gray-500/10  max-h-[80vh] w-full  rounded-md overflow-hidden items-center flex-row space-x-1">
                      <View className="bg-blue-500/20  flex-1 aspect-square  "></View>
                      <View className="bg-blue-500/20  flex-1 aspect-square  "></View>
                    </View>
                  </View>
                </View>
                <View className="bg-white p-[1px] duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="bg-teal-500/40 w-full pb-[33%] sm:rounded-t-md "></View>

                  <View className="flex-row px-4 py-3 space-x-2 ">
                    <View className="w-10 h-10  bg-blue-500/50 rounded-full"></View>
                    <View className=" my-auto  flex-col ">
                      <Text className="text-gray-800 dark:text-gray-200 text-sm tracking-tight hover:underline font-bold">
                        Dr Sponge Bob Jr
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-xs tracking-tight ">
                        2 min ago
                      </Text>
                    </View>
                  </View>
                  <View className="w-full px-4 pb-3 flex-col space-y-1">
                    <Text className="text-gray-800 dark:text-gray-200 text text-xl leading-6 tracking-tight font-bold">
                      From Classroom to Career: Navigating the Modern Challenges
                      of Transitioning into the Workforce
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      Our app provides an intuitive and easy-to-use interface
                      for users to publish and share content on their social
                      media accounts. Leveraging the power of UNA's community
                      platform, our app allows users to connect and engage with
                      like-minded individuals, creating a vibrant social network
                      that is both fun and functional.
                    </Text>
                  </View>

                  <View className=" px-4 pb-4 w-full">
                    <View className="bg-gray-500/20  aspect-square w-full  rounded-md overflow-hidden items-center">
                      <View className="bg-blue-500/20  w-80 h-[25000px]  "></View>
                    </View>
                  </View>
                </View>
              </View>



              <View className="hidden sticky top-0 lg:flex flex-none w-2/5  flex-col   space-y-2">
                <View className="bg-white  p-[1px]  duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700  ">
                  <View className="bg-yellow-500/20  w-full sm:rounded-t-md aspect-video"></View>
                  <View className=" overflow-hidden w-full my-3 h-10  ">
                    <Text className="text-gray-800 px-4   dark:text-gray-200 text-base leading-5  tracking-tight font-semibold">
                      Sustainable Fashion: Understanding the Environmental
                      Impact Sustainable Fashion: Understanding the
                      Environmental Impact
                    </Text>
                  </View>

                  <View className="flex-none flex-row px-4 pb-3 space-x-2 items-center">
                    <View className="w-6 h-6  bg-teal-500 rounded-full"></View>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm tracking-tight font-medium">
                      Dr Sponge Bob Jr
                    </Text>
                  </View>
                </View>
                <View className="bg-white  p-[1px]  duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700   ">
                  <View className="bg-teal-500/20  w-full pb-[56%] sm:rounded-t-md "></View>
                  <View className=" overflow-hidden w-full my-3 h-10  ">
                    <Text className="text-gray-800 px-4   dark:text-gray-200 text-base leading-5  tracking-tight font-semibold">
                      Sustainable Fashion: Understanding the Environmental
                      Impact Sustainable Fashion: Understanding the
                      Environmental Impact
                    </Text>
                  </View>

                  <View className="flex-none flex-row px-4 pb-3 space-x-2 items-center">
                    <View className="w-6 h-6  bg-teal-500 rounded-full"></View>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm tracking-tight font-medium">
                      Dr Sponge Bob Jr
                    </Text>
                  </View>
                </View>
                <View className="bg-white  p-[1px] animate-pulse duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700  ">
                  <View className="bg-gray-500/10  w-full pb-[56%] sm:rounded-t-md  "></View>
                  <View className=" overflow-hidden w-full px-4 my-3 h-10 space-y-2 ">
                    <View className="w-full h-4  bg-gray-500/20 rounded-full"></View>
                    <View className="w-3/4 h-4  bg-gray-500/20 rounded-full"></View>
                  </View>

                  <View className="flex-row px-4 pb-3 space-x-2 items-center ">
                    <View className="w-6 h-6  bg-gray-500/10 rounded-full"></View>
                    <View className="w-1/3 h-3  bg-gray-500/10 rounded-full"></View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
