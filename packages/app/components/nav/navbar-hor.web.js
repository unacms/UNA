import { memo, useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/common-helpers'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import { useTranslation } from 'react-i18next'
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'
import MenuDrawer from 'app/components/nav/menu-drawer'
import MenuTop from 'app/components/nav/menu-top'
import ContextSelector from 'app/ui/molecules/context-selector'
import HeaderElement from 'app/ui/molecules/header_element'

const HeaderLine = memo(
    ({
        headerSettings,
        currentUser,
        uri,
        bSearch,
        menuPopup,
        setMenuPopup,
        showMenu,
        title,
        context
    }) => {
        const { width } = useWindowDimensions()
        if (width > LAYOUT_BREAKPOINTS.xl && menuPopup) setMenuPopup(false)

        const isDrawer =
            menuItemsByName(
                'main_menu',
                appSetting('menu_items', 'menu_drawer'),
                currentUser
            ).length > 0

        return (
            <View className=" flex-row w-[360px] gap-x-[12px] px-[8px] sm:px-[16px] items-center ">
                
                {headerSettings.menu && isDrawer && (
                    <View className="lg:hidden pr-[8px] ">
                        <Pressable onPress={showMenu}>
                            <Button
                                variant="text"
                                startDecorator="List"
                                rounded
                                align="start"
                                aria-label={'Menu'}
                                alt={'Menu'}
                                role="button"
                            />
                        </Pressable>
                    </View>
                )}
                {!context && (uri == 'home' || width >= LAYOUT_BREAKPOINTS.lg) && (
                    <Link
                        className=" flex items-center flex-row active:scale-95 active:opacity-50 px-[8px] py-[4px] gap-x-3 rounded-xl text-neutral-700 hover:bg-bgrbutton dark:hover:bg-bgrbutton-d dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 duration-300  "
                        href="/home"
                        aria-label="Logo"
                    >
                        <View className=" items-center h-10 justify-center text-neutral-900 dark:text-neutral-100">
                            {appStatic('logo_mark')}
                        </View>
                        <View className=" flex-row  items-center  h-10 my-auto align-middle justify-center text-neutral-700 dark:text-neutral-300">
                            {appStatic('logo_text')}
                        </View>
                    </Link>
                )}
                {context && <ContextSelector data={context}/>}
                {headerSettings.backButton && getBackButtonWeb()}
                {headerSettings.title && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className="text-3xl leading-[40px] tracking-tight lg:hidden font-bold text-neutral-800 dark:text-neutral-200 "
                        >
                            {title}
                        </Text>
                )}
                {bSearch && (
                    <View className="flex-auto hidden xl:flex pl-[8px]">
                        <Search type="input" placeholder="Enter search text" />
                    </View>
                )}
            </View>
        )
    }
)

export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation()
    const bSearch = appSetting('layout', 'search') == true
    const bMessenger = appSetting('messenger', 'url') ? true : false
    const bNotifs = appSetting('notifications', 'url') ? true : false

    const headerSettings = props.headerSettings

    let sTitle = props.title
    const menuSettings = appSetting('menu_items', props?.menu?.object)
    if (menuSettings && menuSettings.name) sTitle = t(menuSettings.name)

    const bIsHideHeader = currentUser
        ? false
        : appSetting('layout', 'hide_header_for_nonlogged') //windowWidth < 1024 && (!headerSettings.header); // MAY BE NEEDED

    const showMenu = () => {
        setMenuPopup(!menuPopup)
    }

    const isCustomHeaderElement = appSetting('layout', 'custom_header_element')
    
    return (
        <>
            <Row className="w-full flex-auto mx-auto">
                <View className="flex-auto">{props.children}</View>
            </Row>
            
            {!bIsHideHeader && (
                <View
                    className={
                        (props.layoutName == 'profile' ||
                        props.layoutName == 'messenger' ||
                        props.layoutName == 'post'
                            ? 'hidden lg:flex'
                            : '') +
                        ' fixed w-full h-16 items-center w-full border-b border-bdrnavbar dark:border-bdrnavbar-d shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,1)] bg-bgrnavbar dark:bg-bgrnavbar-d '
                    }
                >
                    <View
                        className={
                            appSetting('layout', 'max_width_header_content') +
                            ' w-full flex-row flex-auto items-center '
                        }
                    >
                        <HeaderLine
                            headerSettings={headerSettings}
                            title={sTitle}
                            currentUser={currentUser}
                            uri={props.uri}
                            bSearch={bSearch}
                            showMenu={showMenu}
                            menuPopup={menuPopup}
                            setMenuPopup={setMenuPopup}
                            context={props.context}
                        />
                        <MenuTop url={props.url} uri={props.uri}/>
                        <Row className=" w-[360px] px-[8px] sm:px-[16px] gap-x-2 items-center justify-end ">
                            {!!currentUser && (
                                <Row className="justify-end gap-x-2">
                                    
                                        <View className=" ">
                                            {bSearch && <Search />}
                                        </View>
                                        {isCustomHeaderElement && <View className=" "><HeaderElement/></View>}
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
                                                        'messenger',
                                                        'url'
                                                    )}
                                                    alt={t('Messenger')}
                                                >
                                                    <Button
                                                        tooltip={t('Messenger')}
                                                        variant="secondary"
                                                        rounded
                                                        startDecorator="MessageSquare"
                                                        id="m2"
                                                        size="base"
                                                        hitSlop={4}
                                                        addon={{
                                                            variant: 'primary',
                                                            text: currentUser
                                                                ?.counters
                                                                ?.bx_messenger_new_messages,
                                                            hideZero: true,
                                                        }}
                                                    />
                                                </Link>
                                            )}
                                        </View>

                                        <View className="hidden sm:block">
                                            <MenuAccount />
                                        </View>
                                    
                                </Row>
                            )}
                            {!currentUser && (
                                <Row className="justify-end gap-x-2 ">
                                    <MenuLauncher />

                                    {bSearch && (
                                        <View>
                                            <Search />
                                        </View>
                                    )}

                                    <Link href="/login">
                                        <ButtonRef
                                            variant="secondary"
                                            tooltip="Account"
                                            rounded
                                            size="base"
                                            hitSlop={4}
                                            aria-label="Account"
                                            alt={t('Account')}
                                            startDecorator="UserRound"
                                        />
                                    </Link>
                                </Row>
                            )}
                        </Row>
                    </View>

                    <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} />
                </View>
            )}
        </>
    )
}
