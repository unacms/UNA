import { A, H1, P, Text, TextLink } from 'app/design/typography'
import Link from '../ui/atoms/link'
import { Icon } from '../components/svg'
import Image from '../ui/atoms/image'
import { View, Row } from 'app/design/view'
import { TouchableOpacity } from 'app/design/view'

export function HomeScreen() {
  return (
    <View className="w-full h-screen bg-screen dark:bg-screen-dark flex-row">
      <View className="flex-none flex-col bg-neo-900 border-r border-black/50 space-y-4 hidden  p-4 ">
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
      <View className="relative w-full h-screen  ">
        <Text className=" text-white px-4 py-3 bg-brand text-base text-center hidden">
          Announcement1! Read{' '}
          <TextLink
            className="text-white font-semibold underline text-base"
            href="/about"
          >
            about us
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

        <View className="absolute z-30 backdrop-blur-sm  h-16 px-2 sm:px-3   w-full  bg-navbar/90 dark:bg-navbar-dark/90  border-b border-neoborder/40 dark:border-neoborder-dark/40 flex-row space-x-1 sm:space-x-2 ">
          <TouchableOpacity>
            <Link
              href="/"
              className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
            >
              <Icon
                icon="menu"
                className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
              ></Icon>
            </Link>
          </TouchableOpacity>
          <TouchableOpacity className="flex-auto">
            <Link
              href="/home"
              className="group hover:scale-110   duration-500 mr-auto flex-row  flex-none  items-center rounded-lg my-auto space-x-1"
            >
              <Icon icon="logo-mark" className="h-14 w-14"></Icon>
              <Icon
                icon="logo-text"
                className="h-14 w-14 hidden sm:block text-brand dark:text-brand-dark  "
              ></Icon>
            </Link>
          </TouchableOpacity>

          <Row className="flex-none lg:flex-auto items-center flex-row sm:space-x-1 md:space-x-2 ">
            <TouchableOpacity className="hidden sm:block">
              <Link
                href="/timeline-view-home"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full md:rounded-lg p-3 md:py-1 lg:p-3 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
              >
                <Icon
                  icon="home"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>

                <Text className="hidden md:block text-sm lg:text-base font-medium duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                  Home
                </Text>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity className="hidden sm:block">
              <Link
                href="/posts-home"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full md:rounded-lg p-3 md:py-1 lg:p-3 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
              >
                <Icon
                  icon="discover"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>

                <Text className="hidden md:block text-sm lg:text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                  Discover
                </Text>
              </Link>
            </TouchableOpacity>

            <TouchableOpacity className="lg:flex-auto md:pr-2">
              <View className="hidden lg:w-full  bg-neo-100/50 dark:bg-neo-900/50 border border-transparent hover:border-neoborder/40 dark:border-neoborder-dark/20 rounded-full w-50 h-full px-3 py-2">
                <Text className="text-neo-400 text-base dark:text-neo-600">
                  Search...
                </Text>
              </View>
              <Link
                href="/search"
                className="lg:w-full group flex-col lg:flex-row lg:bg-hover dark:lg:bg-hover-dark lg:border  
                lg:border-neoborder/40 dark:lg:border-neoborder-dark/20 lg:space-x-3 items-center rounded-full 
                md:rounded-lg p-3 md:py-1 lg:py-2.5 lg:rounded-full bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 
                my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent 
                duration-200 lg:bg-item-hover/50 dark:lg:bg-item-hover-dark/50 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 
                dark:md:hover:bg-item-hover-dark/50"
              >
                <Icon
                  icon="search"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>

                <Text className="hidden md:block text-sm lg:text-base font- lg:font-normal duration-200 group-hover:text-neo-900 text-neo-700 lg:text-neo-400 dark:lg:text-neo-600 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                  Search
                </Text>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity>
              <Link
                href="/notifications"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              >
                <Icon
                  icon="notifications"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity>
              <Link
                href="/messages"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              >
                <Icon
                  icon="messages"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity>
              <Link
                href="/add"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              >
                <Icon
                  icon="plus"
                  className="h-7 w-7 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>
              </Link>
            </TouchableOpacity>
            <TouchableOpacity>
              <Link
                href="/account"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              >
                <Icon
                  icon="account"
                  className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                ></Icon>
              </Link>
            </TouchableOpacity>
          </Row>
        </View>
        { /* content */ }
        <View className=" flex-row flex-1 2xl:mx-auto ">
          <View className="w-72 mt-16 flex-none hidden xl:flex px-3 py-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-neoborder/40 dark:border-neoborder-dark/40 flex-col space-y-2">
            <View className="flex-col space-y-0.5">
              <TouchableOpacity>
                <Link
                  href="/timeline-view-home"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 bg-item-hover/50 dark:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="home"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Home
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/posts-home"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="discover"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Discover
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/posts-home"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="post"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Posts
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/groups-home"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="group"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Groups
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/channels"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="hash"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Channels
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/persons-home"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="people"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    People
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/contact"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="contact"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className=" text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Contact
                  </Text>
                </Link>
              </TouchableOpacity>
              <TouchableOpacity>
                <Link
                  href="/about"
                  className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="about"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="text-sm lg:text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    About
                  </Text>
                </Link>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-auto relative w-full sm:p-4  flex-row space-x-4 lg:space-x-6 overflow-scroll max-w-6xl mx-auto">
            <View className="mt-16 flex-auto  flex-col space-y-2 sm:space-y-4 max-w-2xl mx-auto ">
            <View className="bg-card group duration-200 hover:shadow-lg active:shadow-none dark:bg-card-dark overflow-hidden border sm:rounded-lg hover:border-neoborder/20 border-neoborder/40 dark:border-neoborder-dark/40 dark:hover:border-neoborder-dark/20   ">
                <View className="bg-teal-500/40 w-full aspect-3/1   "></View>

                <View className="flex-row p-4 space-x-2 ">
                  <View className="w-12 h-12  bg-blue-500/50 rounded-full"></View>
                  <View className=" my-auto  flex-col ">
                    <Text className="text-neo-800 hover:text-gray-900 duration-200 dark:hover:text-neo-50 dark:text-neo-200 text-base tracking-tight hover:underline font-bold">
                      Dr Sponge Bob Jr
                    </Text>
                    <Text className="text-neo-600 dark:text-neo-400 text-sm  ">
                      2 min ago
                    </Text>
                  </View>
                </View>
                <View className="w-full px-4 pb-4 flex-col space-y-4">
                  <Text className="text-neo-800  group-hover:text-neo-900 duration-200 dark:group-hover:text-neo-50 dark:text-neo-100  text-2xl  tracking-tight font-bold">
                    From Classroom to Career: Navigating the Modern Challenges
                    of Transitioning into the Workforce
                  </Text>
                  <View className="flex-row space-x-2 h-12 overflow-hidden relative">
                    <Text className="text-neo-700  dark:text-neo-200 text-base">
                      Our app provides an intuitive and easy-to-use interface
                      for users to publish and share content on their social
                      media accounts. Leveraging the power of UNA's community
                      platform, our app allows users to connect and engage with
                      like-minded individuals, creating a vibrant social network
                      that is both fun and functional.
                    </Text>
                    <View className="absolute  flex-row bottom-0  right-0 bg-gradient-to-r ">
                      <View className="  w-10 right-0 bg-gradient-to-r from-transparent to-white dark:to-neo-800"></View>
                      <View className="pl-2  bg-white dark:bg-neo-800">
                        <Text className="text-brand dark:text-brand-dark text-base font-medium">
                          More...
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View className="w-full pb-4 rounded-lg px-4">
                  <View className="w-full aspect-square rounded-lg bg-blue-500/50 "></View>
                </View>
                <View className="flex-row w-full space-x-4">
                  <View className="px-4 mb-3 flex-auto flex-row space-x-4  ">
                    <Text className="text-neo-600 dark:text-neo-400 text-sm">
                      <Text className="font-bold text-neo-700 dark:text-neo-200">
                        16
                      </Text>{' '}
                      comments
                    </Text>
                  </View>
                  <View className="px-4 mb-3  flex-row space-x-4  ">
                  <Text className="text-neo-600 dark:text-neo-400 text-sm">
                      <Text className="font-bold text-neo-700 dark:text-neo-200">
                        12
                      </Text>{' '}
                      views
                    </Text>
                    <Text className="text-neo-600 dark:text-neo-400 text-sm">
                      <Text className="font-bold text-neo-700 dark:text-neo-200">
                        48
                      </Text>{' '}
                      likes
                    </Text>

                    <Text className="text-neo-600 dark:text-neo-400 text-sm">
                      <Text className="font-bold text-neo-700 dark:text-neo-200">
                        32
                      </Text>{' '}
                      reposts
                    </Text>
                  </View>
                </View>

                <View className="px-4 py-3  border-t border-gray-500/20  flex-row space-x-1  ">
                  <View className="flex-row w-full space-x-4">
                    <View className=" flex-row space-x-2  ">
                      <View className="group flex-auto flex py-2.5 px-3 hover:bg-item-hover dark:hover:bg-item-hover-dark rounded-lg">
                        <Text className="group-hover:text-neo-900 text-neo-600 dark:group-hover:text-gray-50 dark:text-gray-400 text-sm font-semibold mx-auto">
                          Like
                        </Text>
                      </View>
                      <View className="group flex-auto flex py-2.5 px-3 hover:bg-item-hover dark:hover:bg-item-hover-dark rounded-lg">
                      <Text className="group-hover:text-neo-900 text-neo-600 dark:group-hover:text-gray-50 dark:text-gray-400 text-sm font-semibold mx-auto">
                          Comment
                        </Text>
                      </View>
                      <View className="group flex-auto flex py-2.5 px-3 hover:bg-item-hover dark:hover:bg-item-hover-dark rounded-lg">
                      <Text className="group-hover:text-neo-900 text-neo-600 dark:group-hover:text-gray-50 dark:text-gray-400 text-sm font-semibold mx-auto">
                          Repost
                        </Text>
                      </View>
                      <View className="group flex-auto flex py-2.5 px-3 hover:bg-item-hover dark:hover:bg-item-hover-dark rounded-lg">
                      <Text className="group-hover:text-neo-900 text-neo-600 dark:group-hover:text-gray-50 dark:text-gray-400 text-sm font-semibold mx-auto">
                          Share
                        </Text>
                      </View>
                    </View>
                    <View className=" flex-auto space-x-2 flex-row justify-end ">
                    <View className="group flex-none flex py-2.5 px-3 hover:bg-item-hover dark:hover:bg-item-hover-dark rounded-lg">
                      <Text className="group-hover:text-neo-900 text-neo-600 dark:group-hover:text-gray-50 dark:text-gray-400 text-sm font-semibold mx-auto">
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
                    Our app provides an intuitive and easy-to-use interface for
                    users to publish and share content on their social media
                    accounts. Leveraging the power of UNA's community platform,
                    our app allows users to connect and engage with like-minded
                    individuals, creating a vibrant social network that is both
                    fun and functional.
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
                    Our app provides an intuitive and easy-to-use interface for
                    users to publish and share content on their social media
                    accounts. Leveraging the power of UNA's community platform,
                    our app allows users to connect and engage with like-minded
                    individuals, creating a vibrant social network that is both
                    fun and functional.
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
                    Our app provides an intuitive and easy-to-use interface for
                    users to publish and share content on their social media
                    accounts. Leveraging the power of UNA's community platform,
                    our app allows users to connect and engage with like-minded
                    individuals, creating a vibrant social network that is both
                    fun and functional.
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
                    Our app provides an intuitive and easy-to-use interface for
                    users to publish and share content on their social media
                    accounts. Leveraging the power of UNA's community platform,
                    our app allows users to connect and engage with like-minded
                    individuals, creating a vibrant social network that is both
                    fun and functional.
                  </Text>
                </View>

                <View className=" px-4 pb-4 w-full">
                  <View className="bg-gray-500/20  aspect-square w-full  rounded-md overflow-hidden items-center">
                    <View className="bg-blue-500/20  w-80 h-[25000px]  "></View>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-16 hidden sticky top-0 lg:flex flex-none w-2/5  flex-col   space-y-2">
              <View className="bg-white  p-[1px]  duration-200 hover:shadow-lg active:shadow-none dark:bg-gray-800 overflow-hidden border sm:rounded-lg hover:border-gray-300 border-gray-200 dark:border-gray-700/50 dark:hover:border-gray-700  ">
                <View className="bg-yellow-500/20  w-full sm:rounded-t-md aspect-video"></View>
                <View className=" overflow-hidden w-full my-3 h-10  ">
                  <Text className="text-gray-800 px-4   dark:text-gray-200 text-base leading-5  tracking-tight font-semibold">
                    Sustainable Fashion: Understanding the Environmental Impact
                    Sustainable Fashion: Understanding the Environmental Impact
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
                    Sustainable Fashion: Understanding the Environmental Impact
                    Sustainable Fashion: Understanding the Environmental Impact
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
        { /* content */ }
      </View>
    </View>
  )
}