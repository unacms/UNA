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
import { getComponent } from 'app/components/registry'

const headerTheme = appSetting('layout', 'header');

const HeaderLine = memo(
    ({
        headerSettings,
        currentUser,
        uri,
        url,
        bSearch,
        menuPopup,
        setMenuPopup,
        showMenu,
        title,
        context,
    }) => {
        const { width } = useWindowDimensions()
        if (width > LAYOUT_BREAKPOINTS.xl && menuPopup) setMenuPopup(false)

        const ContextSelector = getComponent('molecule', 'context_selector')

        const isDrawer =
            menuItemsByName(
                'main_menu',
                appSetting('menu_items', 'menu_drawer'),
                currentUser
            ).length > 0

        return (
            <View className={headerTheme.content_left}>
                {headerSettings.menu && isDrawer && (
                    <View className="lg:hidden pr-2 ">
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
                {(!context ||
                    (!currentUser.confirmed &&
                        appSetting('layout', 'lock_unconfirmed'))) &&
                    (uri == 'home' || width >= LAYOUT_BREAKPOINTS.lg) && (
                        <Link
                            className=" flex items-center  hover:bg-bgritem web:dark:hover:bg-bgritem-d rounded-xl flex-row web:active:scale-95 web:active:opacity-50 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-neutral-50 web:duration-300 "
                            href="/home"
                        >
                            {appStatic('logo')}
                        </Link>
                    )}
                {context &&
                    (currentUser.confirmed ||
                        !appSetting('layout', 'lock_unconfirmed')) && (
                        <ContextSelector data={context} url={url} uri={uri} />
                    )}
                {headerSettings.backButton && getBackButtonWeb()}
                {headerSettings.title && (
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-3xl leading-10 tracking-tight lg:hidden font-bold text-neutral-800 dark:text-neutral-200 "
                    >
                        {title}
                    </Text>
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
    const [isScrolled, setIsScrolled] = useState(false)

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


    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY
            if (offset > 0) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const HeaderElement = getComponent('molecule', 'header_element')  
    
    return (
        <>
            <View className={appSetting('layout', 'screen')}>
                {props.children}
            </View>

            {!bIsHideHeader && (
                <View className={headerTheme.container + (headerTheme.special[props.layoutName] || headerTheme.special.default)
                }  >
                    <View className={(isScrolled ? headerTheme.scrolled : headerTheme.initial)}>
                        <View className={`w-full flex-row flex-auto items-center ${headerTheme.content}`}>
                            <HeaderLine
                                headerSettings={headerSettings}
                                title={sTitle}
                                currentUser={currentUser}
                                uri={props.uri}
                                url={props.url}
                                bSearch={bSearch}
                                showMenu={showMenu}
                                menuPopup={menuPopup}
                                setMenuPopup={setMenuPopup}
                                context={props.context}
                            />
                            <MenuTop url={props.url} uri={props.uri} />
                            <Row className={headerTheme.content_right}>
                                <HeaderElement />
                            </Row>
                        </View>
                    </View>
                    <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} />
                </View>

            )}
        </>
    )
}
