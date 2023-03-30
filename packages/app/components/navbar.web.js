import { TouchableOpacity } from 'app/design/view'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/components/svg'
import { useState, useRef } from 'react'
import { View,ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import MainMenu from 'app/components/mainmenu'
import { MotiView, AnimatePresence } from 'moti'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user';

import { Slider } from 'app/ui/molecules/slider';

export default function (props) {
  const { currentUser, setCurrentUser } = useCurrentUser();
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
      <View className=" backdrop-blur pt-[1px]  h-16 px-2 sm:px-4  items-center w-full  bg-navbar/90 dark:bg-navbar-dark/90  border-b border-neoborder dark:border-neoborder-dark flex-row space-x-2 sm:space-x-4 ">
      <Row className="flex-row space-x-1 flex-none items-center"> 
        { props.uri == 'home' && <TouchableOpacity className="xl:hidden " onPress={showMenu}>
          <Button variant="text" startDecorator="menu" rounded align="start" />
        </TouchableOpacity>
        }
        <TouchableOpacity className="" onPress={hideMenu}>
          <Link href="/home">
            <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto space-x-2">
              <Icon
                icon="logo-mark"
                className="group-hover:-rotate-45 text-neogray-600 dark:text-neogray-200 group-hover:text-neogray-800 dark:group-hover:text-neogray-50   duration-300 h-10 w-10"
              ></Icon>
              <Icon
                icon="logo-text"
                className="h-10 w-14 hidden sm:block text-brand dark:text-brand-dark  "
              ></Icon>
            </View>
          </Link>
        </TouchableOpacity>
      </Row>
      
      <Row className="flex-row space-x-2 flex-auto justify-end lg:justify-between ">
        <Row className="hidden lg:flex flex-row flex-none  grow mx-auto px-12">
          <Slider offset={300}>
            {props.menu_top.items.map((item, index) => (
                  <Link href={item.link} key={`menu-${index}`}>
                  <Button
                    variant="text"
                    startDecorator={item.icon}
                    align="start"
                    title={item.title}
                  />
                </Link>
              ))}
          </Slider>
        </Row>
        <Row>
        {!!currentUser &&
        <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
          <Link href="/notifications-view">
            <Button variant="text" rounded startDecorator="notifications" />
          </Link>
          <Link href="/messenger">
            <Button variant="text" rounded startDecorator="messages" />
          </Link>
          <Link href="/create-post">
            <Button variant="text" rounded startDecorator="plus" />
          </Link>
          <Link href="/logout">
            <Button variant="text" rounded startDecorator="account" />
          </Link>
        </Row>
        }

        {!currentUser &&
        <Row className="flex-row flex-auto sm:flex-none justify-end  hidden lg:flex">
          <Link href="/login">
            <Button variant="text" rounded startDecorator="account" />
          </Link>
        </Row>
        }

        <Link href="/search">
          <Button variant="text" rounded startDecorator="search" />
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
                <MainMenu {...props} />
              </TouchableOpacity>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  )
}
