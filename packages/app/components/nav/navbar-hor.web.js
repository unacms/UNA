import { useState, useRef, useEffect, memo } from 'react'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import { useTranslation } from 'react-i18next'
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'
import MenuDrawer from 'app/components/nav/menu-drawer'

const HeaderLine = memo(({ headerSettings, currentUser, uri, bSearch, menuPopup, setMenuPopup, showMenu, title }) => {

    const { width } = useWindowDimensions();
    if (width > 1280 && menuPopup)
        setMenuPopup(false)

    const isDrawer = menuItemsByName('main_menu', appSetting('menu_items', 'menu_drawer'), currentUser).length > 0;


    return (
        <View className="flex-row pl-3 sm:pl-6  flex-auto lg:flex-none lg:w-80 my-auto items-center">
            {(headerSettings.menu && isDrawer) && (
                <View className="lg:hidden mr-3 sm:mr-4">
                    <Pressable onPress={showMenu}>
                        <Button
                            variant="outline"
                            startDecorator="List"
                            rounded
                            align="start"
                            aria-label={'Menu'}
                            alt={'Menu'}
                        />
                    </Pressable>
                </View>
            )}
            {(uri == 'home' || width >= 1024) && (
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
                        {title}
                    </Text>
                </View>
            )}
            {bSearch && (
                <View className=" w-full flex-auto max-w-sm hidden lg:flex ">
                    <Search
                        type="input"
                        placeholder="Enter search text"
                    />
                </View>
            )}
        </View>
    )
});

export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation()

    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }

    const bSearch = appSetting('layout', 'search') == true
    const bMessenger = appSetting('layout', 'messenger') ? true : false
    const bNotifs = appSetting('layout', 'notifications') ? true : false

    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    const headerSettings = props.headerSettings;

    let sTitle = props.title
    const menuSettings = appSetting('menu_items', props?.menu?.object)
    if (menuSettings && menuSettings.name)
        sTitle = t(menuSettings.name)

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
                        <HeaderLine headerSettings={headerSettings} title={sTitle} currentUser={currentUser} uri={props.uri} bSearch={bSearch} showMenu={showMenu} menuPopup={menuPopup} setMenuPopup={setMenuPopup} />
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
                                                (item.link == '/' + props.uri || (item.link == '/' && props.uri == 'home'))
                                                    ? true
                                                    : false
                                            }
                                            variant="text"
                                            size="lg"
                                            tooltip={t(item.title)}
                                            title={item.showTitle ? t(item.title) : ''}
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
                                        <View className="sm:block">
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
