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
import ProfileSwitcher from 'app/components/elements/profile_switcher'

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
            <View className="flex-row xl:max-w-80 2xl:max-w-96 px-[12px] flex-auto lg:flex-none xl:flex-auto items-center ">
                {headerSettings.menu && isDrawer && (
                    <View className="lg:hidden ">
                        <Pressable onPress={showMenu}>
                            <Button
                                variant="outline"
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
                {(uri == 'home' || width >= LAYOUT_BREAKPOINTS.lg) && (
                    <Link
                        className=" flex flex-row group gap-x-[8px] focus-visible:outline p-[4px] focus-visible:outline-2 focus-visible:outline-offset-0 focus:outline-primary/50 rounded-full hover:bg-bgrbutton dark:hover:bg-bgrbutton-d "
                        href="/home"
                        aria-label="Logo"
                    >
                        <View className=" items-center w-[44px] h-[44px] justify-center">
                            {appStatic('logo_mark')}
                        </View>
                        {/*<View className=" items-center justify-center">
                            {appStatic('logo_text')}
                        </View>*/}
                        {/*{appStatic('logo_text')}*/}
                    </Link>
                )}
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

    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    let sTitle = props.title
    const menuSettings = appSetting('menu_items', props?.menu?.object)
    if (menuSettings && menuSettings.name) sTitle = t(menuSettings.name)

    const bIsHideHeader = currentUser
        ? false
        : appSetting('layout', 'hide_header_for_nonlogged') //windowWidth < 1024 && (!headerSettings.header); // MAY BE NEEDED

    const showMenu = () => {
        setMenuPopup(!menuPopup)
    }

    return (
        <>
            <View
                className={
                    appSetting('layout', 'max_width') +
                    ' w-full flex-row flex-auto mx-auto'
                }
            >
                <Row className="w-full">
                    <View className="flex-auto">{props.children}</View>
                </Row>
            </View>
            {!bIsHideHeader && (
                <View
                    className={
                        (props.layoutName == 'profile' ||
                        props.layoutName == 'messenger' ||
                        props.layoutName == 'post'
                            ? 'hidden lg:flex'
                            : '') +
                        ' fixed w-full h-16 lg:shadow-sm items-center w-full bg-bgrnavbar dark:bg-bgrnavbar-d '
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
                        />
                        <Row className="hidden lg:flex flex-auto ">
                            <Row className="w-full mx-auto gap-x-0.5 max-w-2xl justify-between">
                                {menu_navbar_items.map((item, index) => (
                                    <View
                                        className="flex-auto"
                                        key={`menu-${index}`}
                                    >
                                        <Link href={item.link} alt={item.title}>
                                            <Button
                                                pressed={
                                                    item.link ==
                                                        '/' + props.url ||
                                                    (item.link == '/' &&
                                                        props.uri == 'home')
                                                        ? true
                                                        : false
                                                }
                                                variant="tab"
                                                size="lg"
                                                tooltip={t(item.title)}
                                                title={
                                                    item.showTitle
                                                        ? t(item.title)
                                                        : ''
                                                }
                                                alt={t(item.title)}
                                                aria-label={t(item.title)}
                                                fullWidth
                                                
                                                startDecorator={item.icon}
                                                align="center"
                                                indicator={
                                                    item.link ==
                                                        '/' + props.url ||
                                                    (item.link == '/' &&
                                                        props.uri == 'home')
                                                        ? true
                                                        : false
                                                }
                                                indicatorPosition="bottom"
                                                indicatorClassName=" animate-appear translate-y-[6px] h-[3px] w-full bg-indicator dark:bg-indicator-d rounded-full"
                                            />
                                        </Link>
                                    </View>
                                ))}
                            </Row>
                        </Row>
                        <Row className="flex-none xl:w-80 2xl:w-96 flex-none px-[12px] justify-end ">
                            {!!currentUser && (
                                <Row className="flex-row justify-end  ">
                                    <View className=" flex-row gap-x-1 ">
                                        <View className=" xl:hidden ">
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
                                                        'messenger',
                                                        'url'
                                                    )}
                                                    alt={t('Messenger')}
                                                >
                                                    <Button
                                                        tooltip={t('Messenger')}
                                                        variant="text"
                                                        size="lg"
                                                        bgrDecorator
                                                        rounded
                                                        startDecorator="MessageSquare"
                                                        id="m2"
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
                                    </View>
                                </Row>
                            )}
                            {!currentUser && (
                                <Row className="flex-row flex-auto sm:flex-none justify-end gap-x-1 my-auto ">
                                    <MenuLauncher />

                                    {bSearch && (
                                        <View>
                                            <Search />
                                        </View>
                                    )}

                                    <Link href="/">
                                        <ButtonRef
                                            variant="text"
                                            size="lg"
                                            bgrDecorator
                                            tooltip="Account"
                                            rounded
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
