import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { useTranslation } from 'react-i18next'
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'
import MenuDrawer from 'app/components/nav/menu-drawer'
export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation()
    let { width } = useWindowDimensions()

    if (width > 1280 && menuPopup) setMenuPopup(false)

    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }

    const hideMenu = (params) => {
        // setMenuPopup(false)
    }

    const bSearch = appSetting('layout', 'search') == true
    const bMessenger = appSetting('layout', 'messenger') ? true : false
    const bNotifs = appSetting('layout', 'notifications') ? true : false

    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    const windowWidth = useWindowDimensions().width
    let headerSettings = getHeaderSettings(props.uri, width, props.layoutName)

    useEffect(() => {
        const handleClick = () => {
            hideMenu()
        }

        document.addEventListener('click', handleClick)

        return () => document.removeEventListener('click', handleClick)
    }, [])

    if (windowWidth < 1024 && !headerSettings.header) return <></>

    let sTitle = props.title
    const menuSettings = appSetting('menu_items', props?.menu?.object)
    if (menuSettings && menuSettings.name) sTitle = t(menuSettings.name)
    return (
        <>
            <View className="fixed w-full">
                <View className="  backdrop-blur h-16  items-center w-full shadow-sm border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d  ">
                    <View
                        className={
                            appSetting('layout', 'max_width') +
                            ' w-full flex-row flex-auto  items-center'
                        }
                    >
                        <View className="flex-row pl-3 sm:pl-4 sm:pr-2 flex-auto lg:flex-none lg:w-80 my-auto items-center">
                            {headerSettings.menu && (
                                <View className="sm:hidden mr-3 sm:mr-4">
                                    <Pressable onPress={showMenu}>
                                        <Button
                                            variant="outline"
                                            startDecorator="List"
                                            rounded
                                            align="start"
                                            aria-label={t('Menu')}
                                            alt={t('Menu')}
                                        />
                                    </Pressable>
                                </View>
                            )}
                            {(props.uri == 'home' || windowWidth >= 1024) && (
                                <Link href="/home" aria-label="Logo">
                                    <View className="group mr-4 flex-row flex-none items-center my-auto">
                                        {appStatic('logo_mark')}
                                        <View className="lg:hidden">
                                            {appStatic('logo_text')}
                                        </View>
                                    </View>
                                </Link>
                            )}
                            {headerSettings.backButton && getBackButtonWeb()}
                            {headerSettings.title && (
                                <View className="flex-auto overflow-hidden">
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        className="text-2xl sm:text-3xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 "
                                    >
                                        {sTitle}
                                    </Text>
                                </View>
                            )}
                            {bSearch && currentUser && (
                                <View className=" w-full flex-auto max-w-sm hidden lg:flex ">
                                    <Search
                                        type="input"
                                        placeholder="Enter search text"
                                    />
                                </View>
                            )}
                        </View>
                        <Row className="hidden lg:flex flex-auto">
                            <Row className="w-full mx-auto gap-x-0.5 max-w-lg justify-between">
                                {menu_navbar_items.map((item, index) => (
                                    <Link
                                        className="flex-auto"
                                        href={item.link}
                                        key={`menu-${index}`}
                                        alt={item.title}
                                    >
                                        <ButtonRef
                                            pressed={
                                                item.link == '/' + props.uri
                                                    ? true
                                                    : false
                                            }
                                            variant="text"
                                            size="lg"
                                            tooltip={t(item.title)}
                                            alt={t(item.title)}
                                            aria-label={t(item.title)}
                                            fullWidth
                                            startDecorator={
                                                item.icon.indexOf(' ') == -1
                                                    ? item.icon
                                                    : item.icon.split(' ')[0]
                                            }
                                            align="center"
                                        />
                                    </Link>
                                ))}
                            </Row>
                        </Row>
                        <Row className="flex-row flex-none xl:w-96 px-3 sm:px-4 justify-end ">
                            {!!currentUser && (
                                <Row className="flex-row justify-end ">
                                    <View className=" flex-row my-auto gap-x-2 ">
                                        <View className="lg:hidden ">
                                            {bSearch && <Search />}
                                        </View>
                                        <View className="hidden sm:block">
                                            <MenuLauncher />
                                        </View>
                                        <View className="">
                                            <MenuAdd />
                                        </View>
                                        <View className="hidden sm:block">
                                            {bNotifs && <NotificationButton />}
                                        </View>
                                        <View className="hidden sm:block">
                                        {bMessenger && (
                                            <Link
                                                href={appSetting(
                                                    'layout',
                                                    'messenger'
                                                )}
                                                alt={t('Messenger')}
                                            >
                                                <ButtonRef
                                                    tooltip={t('Messenger')}
                                                    variant="outline"
                                                    rounded
                                                    startDecorator="ChatTeardropDots"
                                                    id="m2"
                                                />
                                            </Link>
                                        )}                                        
                                        </View>

                                        
                                        <View className="hidden sm:block">
                                            <MenuAccount />
                                        </View>
                                    </View>
                                </Row>
                            )}
                            {!currentUser && (
                                <Row className="flex-row flex-auto sm:flex-none justify-end my-auto gap-x-1.5 sm:gap-x-2">
                                    {bSearch && (
                                        <View>
                                            <Search />
                                        </View>
                                    )}
                                    <MenuLauncher />
                                    <Link href="/login">
                                        <ButtonRef
                                            variant="outline"
                                            tooltip="Account"
                                            rounded
                                            aria-label="Account"
                                            alt={t('Account')}
                                            startDecorator="User"
                                        />
                                    </Link>
                                </Row>
                            )}
                        </Row>
                    </View>
                </View>
                <MenuDrawer
                    showMenu={showMenu}
                    menuPopup={menuPopup}
                    cssClass=""
                />
            </View>
        </>
    )
}
