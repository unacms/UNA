import { TouchableOpacity } from 'app/design/view'
import Link from 'app/components/atoms/link'
import { Icon } from 'app/components/svg'
import Toggle  from './atoms/toggle';
import React, { useState, useReducer } from 'react';
import { View, Row } from 'app/design/view'
import { A, Text } from 'app/design/typography'
import ElementMainMenu from 'app/components/elements/mainmenu'
import { MotiView, AnimatePresence } from 'moti'

export default function () {
  const session = null;//const { data: session } = useSession();
  const [menuPopup, setMenuPopup] = useState(false);

  const showMenu =  (params) => {
    setMenuPopup(!menuPopup);
  }

  const hideMenu =  (params) => {
    setMenuPopup(false);
  }

  return (
    <View className="fixed -top-[1px]  z-10 w-full mb-16">
      <TouchableOpacity className="xl:hidden" onPress={hideMenu}></TouchableOpacity>
      <View className=" backdrop-blur pt-[1px]  h-16 px-2 sm:px-3 items-center w-full  bg-navbar/90 dark:bg-navbar-dark/90  border-b border-bordercolor/10 dark:border-bordercolor-dark/10 flex-row space-x-1 sm:space-x-2 ">
    <TouchableOpacity className="xl:hidden" onPress={showMenu}>
      <View
        className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
      >
        <Icon
          icon="menu"
          className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
        ></Icon>
      </View>
    </TouchableOpacity>
    <TouchableOpacity className="flex-auto" onPress={hideMenu}>
      <Link
        href="/home"><View className="group hover:scale-110   duration-500 mr-auto flex-row  flex-none  items-center rounded-lg my-auto space-x-1"
      >
        <Icon icon="logo-mark" className="h-14 w-14"></Icon>
        <Icon
          icon="logo-text"
          className="h-14 w-14 hidden sm:block text-brand dark:text-brand-dark  "
        ></Icon>
        </View>
      </Link>
    </TouchableOpacity>

    <Row className="flex-none lg:flex-auto items-center flex-row sm:space-x-1 md:space-x-2 ">
      <TouchableOpacity className="hidden sm:block" onPress={hideMenu}>
        <Link
          href="/timeline-view-home">
            <View className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full md:rounded-lg p-3 md:py-1 lg:p-3 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
        >
          <Icon
            icon="home"
            className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>

          <Text className="hidden md:block text-sm lg:text-base font-medium duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
            Home
          </Text>
          </View>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity className="hidden sm:block" onPress={hideMenu}>
        <Link
          href="/posts-home">
            <View className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full md:rounded-lg p-3 md:py-1 lg:p-3 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
        >
          <Icon
            icon="discover"
            className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>

          <Text className="hidden md:block text-sm lg:text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
            Discover
          </Text>
          </View>
        </Link>
      </TouchableOpacity>

      <TouchableOpacity className="lg:flex-auto md:pr-2" onPress={hideMenu}>
        <View className="hidden lg:w-full  bg-neo-100/50 dark:bg-neo-900/50 border border-transparent hover:border-bordercolor/10 dark:border-bordercolor-dark/20 rounded-full w-50 h-full px-3 py-2">
          <Text className="text-neo-400 text-base dark:text-neo-600">
            Search...
          </Text>
        </View>
        <Link
          href="/search">
            <View className="lg:w-full group flex-col lg:flex-row lg:bg-hover dark:lg:bg-hover-dark lg:border  
          lg:border-bordercolor/10 dark:lg:border-bordercolor-dark/20 lg:space-x-3 items-center rounded-full 
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
          </View>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity onPress={hideMenu}>
        <Link
          href="/notifications">
            <View className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
        >
          <Icon
            icon="notifications"
            className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>
          </View>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity onPress={hideMenu}>
        <Link
          href="/messages">
            <View className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
        >
          <Icon
            icon="messages"
            className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>
            </View>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity onPress={hideMenu}>
        <Link
          href="/add"><View 
          className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
        >
          <Icon
            icon="plus"
            className="h-7 w-7 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>
          </View>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity onPress={hideMenu}>
        <Link
          href="/account">
            <View className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-3  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark    hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
        >
          <Icon
            icon="account"
            className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
          ></Icon>
          </View>
        </Link>
      </TouchableOpacity>
    </Row>
  </View>
  <AnimatePresence>
  { menuPopup && <View><MotiView 
      from={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
    >
      <TouchableOpacity className='bg-white/80 dark:bg-black/80 w-full absolute top-0 h-screen' onPress={showMenu}>
      <MotiView 
      from={{
        translateX: -72,
        overshootClamping:false
      }}
      animate={{
        translateX: 0,
        overshootClamping:false
      }}
      exit={{
        translateX: -72,
        overshootClamping:false
      }}
      transition={{
        overshootClamping:true
        /*type: 'timing',
        duration: 1500,
        delay: 100,*/
      }}
    >
      <View className='w-72 h-screen' onPress={showMenu}>
        <ElementMainMenu  />
      </View>
    </MotiView>
  </TouchableOpacity>
  </MotiView>
 </View>

    


  }
  </AnimatePresence>
</View>
  );
}
