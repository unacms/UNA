import { TouchableOpacity } from 'app/design/view'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/components/svg'
import Toggle from '../ui/atoms/toggle'
import React, { useState, useReducer } from 'react'
import { View, Row } from 'app/design/view'
import { A, Text } from 'app/design/typography'
import ElementMainMenu from 'app/components/elements/mainmenu'
import { MotiView, AnimatePresence } from 'moti'
import { Button } from 'app/design/controls'

export default function () {
  const session = null //const { data: session } = useSession();
  const [menuPopup, setMenuPopup] = useState(false)
  let { width } = useWindowDimensions()

  if (width > 1280 && menuPopup) setMenuPopup(false)

  const showMenu = (params) => {
    setMenuPopup(!menuPopup)
  }

  const hideMenu = (params) => {
    setMenuPopup(false)
  }

  return (
    <View className="fixed -top-[1px]  z-10 w-full mb-16">
      <TouchableOpacity
        className="xl:hidden"
        onPress={hideMenu}
      ></TouchableOpacity>
      <View className=" backdrop-blur pt-[1px]  h-16 px-2 sm:px-4  items-center w-full  bg-navbar/90 dark:bg-navbar-dark/90  border-b border-bordercolor/10 dark:border-bordercolor-dark/10 flex-row space-x-2 sm:space-x-4 ">
      <Row className="  flex-row space-x-1 flex-none items-center "> 
        <TouchableOpacity className="xl:hidden " onPress={showMenu}>
          <Button variant="text" startDecorator="menu" rounded align="start" />
        </TouchableOpacity>
        <TouchableOpacity className="" onPress={hideMenu}>
          <Link href="/home">
            <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto space-x-2">
              <Icon
                icon="logo-mark"
                className="group-hover:-rotate-45 text-neo-600 dark:text-neo-200 group-hover:text-neo-800 dark:group-hover:text-neo-50   duration-300 h-10 w-10"
              ></Icon>
              <Icon
                icon="logo-text"
                className="h-10 w-14 hidden sm:block text-brand dark:text-brand-dark  "
              ></Icon>
            </View>
          </Link>
        </TouchableOpacity>
      </Row>
        <Row className="  flex-row space-x-2 flex-auto ">
        <Row className="hidden lg:flex flex-row xl:hidden  flex-none ">
              <Link href="/">
                <Button
                  variant="text"
                  startDecorator="home"
                  align="start"
                  title="Home"
                />
              </Link>
              <Link href="/timeline-view-home">
                <Button
                  variant="text"
                  startDecorator="discover"
                  align="start"
                  title="Discover"
                />
              </Link>
            </Row>
            <Row className="hidden sm:flex lg:hidden  flex-row  flex-none ">
              <Link href="/">
                <Button
                  variant="text"
                  startDecorator="home"
                  align="start"
                  rounded
                />
              </Link>
              <Link href="/timeline-view-home">
                <Button
                  variant="text"
                  startDecorator="discover"
                  align="start"
                  rounded
                />
              </Link>
            </Row>
          <Row className="hidden sm:block flex-auto flex-col">
            <Button
              solid
              variant="outline"
              rounded
              title="Search"
              fullWidth 
              align="start"
              startDecorator="search"
            />
          </Row>
          
          <Row className="flex-row flex-auto sm:flex-none justify-end  ">
            
            
            <Link href="/about">
              <Button variant="text" rounded startDecorator="notifications" />
            </Link>
            <Link href="/about">
              <Button variant="text" rounded startDecorator="messages" />
            </Link>
            <Link href="/about">
              <Button variant="text" rounded startDecorator="plus" />
            </Link>
            <Link href="/login">
              <Button variant="text" rounded startDecorator="account" />
            </Link>
          </Row>

          <TouchableOpacity className="hidden " onPress={hideMenu}>
            <Link href="/timeline-view-home">
              <Button
                title="Home"
                startDecorator="home"
                variant="custom"
                rounded
                solid
                classTextName="hidden md:block text-xs lg:text-base font-semibold duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 "
                classIconName="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-2 items-center rounded-full md:rounded-lg lg:rounded-full p-2.5 md:py-1.5 lg:px-4 lg:py-2.5 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
              />
            </Link>
          </TouchableOpacity>
          <TouchableOpacity className="hidden " onPress={hideMenu}>
            <Link href="/posts-home">
              <Button
                title="Discover"
                startDecorator="discover"
                variant="custom"
                rounded
                solid
                classTextName="hidden md:block text-xs  lg:text-base font-semibold duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 "
                classIconName="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-2 items-center rounded-full md:rounded-lg lg:rounded-full p-2.5 md:py-1.5 lg:px-4 lg:py-2.5 bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 dark:md:hover:bg-item-hover-dark/50"
              />
            </Link>
          </TouchableOpacity>
          <Row className="flex-row space-x-1 hidden ">
            <TouchableOpacity
              className="hidden lg:flex-auto md:px-2"
              onPress={hideMenu}
            >
              <Link href="/search">
                <View
                  className="lg:w-full group flex-col lg:flex-row lg:bg-hover dark:lg:bg-hover-dark   
                              lg:border-bordercolor/10 dark:lg:border-bordercolor-dark/20 lg:space-x-3 items-center rounded-full 
                              md:rounded-lg p-2.5 md:py-1.5 lg:py-2.5 lg:rounded-full bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 
                              my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark   md:bg-transparent dark:md:bg-transparent 
                              duration-200 lg:bg-item-hover/50 dark:lg:bg-item-hover-dark/50 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover/50 
                              dark:md:hover:bg-item-hover-dark/50"
                >
                  <Icon
                    icon="search"
                    className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
                  ></Icon>

                  <Text className="hidden md:block text-xs lg:text-base font-semibold duration-200 group-hover:text-neo-900 text-neo-700 lg:text-neo-400 dark:lg:text-neo-600 dark:group-hover:text-neo-50 dark:text-neo-200 ">
                    Search
                  </Text>
                </View>
              </Link>
            </TouchableOpacity>
            <Link href="/notifications" onPress={hideMenu}>
              <Button
                startDecorator="notifications"
                variant="custom"
                rounded
                solid
                classTextName="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              />
            </Link>
            <Link href="/messages" onPress={hideMenu}>
              <Button
                startDecorator="messages"
                variant="custom"
                rounded
                solid
                classTextName="group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              />
            </Link>
            <Link href="/add" onPress={hideMenu}>
              <Button
                startDecorator="plus"
                variant="custom"
                rounded
                solid
                classTextName="group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              />
            </Link>
            <Link href="/account" onPress={hideMenu}>
              <Button
                startDecorator="account"
                variant="custom"
                rounded
                solid
                classTextName="group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300"
                className="group flex-col lg:flex-row lg:space-x-3 items-center rounded-full  p-2.5  bg-transparent dark:bg-transparent sm:bg-item-hover/50 dark:sm:bg-item-hover-dark/50 my-auto sm:hover:bg-item-hover dark:sm:hover:bg-item-hover-dark hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 md:hover:bg-item-hover dark:md:hover:bg-item-hover-dark"
              />
            </Link>
          </Row>
        </Row>
      </View>
      <AnimatePresence>
        {menuPopup && (
          <View>
            <MotiView
              from={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0,
              }}
            >
              <TouchableOpacity
                className="bg-white/80 dark:bg-black/80 w-full absolute top-0 h-screen"
                onPress={showMenu}
              ></TouchableOpacity>
            </MotiView>
            <MotiView
              style={{ width: 288 }}
              from={{
                translateX: -300,
                overshootClamping: false,
              }}
              animate={{
                translateX: 0,
                overshootClamping: false,
              }}
              exit={{
                translateX: -300,
                overshootClamping: false,
              }}
              transition={{
                overshootClamping: true,
                /*type: 'timing',
        duration: 1500,
        delay: 100,*/
              }}
            >
              <TouchableOpacity className="w-72 h-screen bg-red-500" onPress={showMenu}>
                <ElementMainMenu />
              </TouchableOpacity>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}
