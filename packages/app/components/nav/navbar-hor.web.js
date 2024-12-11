import { memo, useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import { useTranslation } from 'react-i18next';
import MenuAdd from 'app/components/nav/menu-add'
import MenuAccount from 'app/components/nav/menu-account'
import MenuLauncher from 'app/components/nav/menu-launcher'
import MenuDrawer from 'app/components/nav/menu-drawer'
import ProfileSwitcher from 'app/components/elements/profile_switcher';

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
            <View className="flex-row xl:w-80 2xl:w-96 pl-3 sm:pl-4 pr-2 flex-auto lg:flex-none my-auto items-center">
                {headerSettings.menu && isDrawer && (
                    <View className="lg:hidden mr-3 sm:mr-4">
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
                    <Link href="/home" aria-label="Logo">
                        <View className="group mr-4 flex-row flex-none items-center my-auto">
                            {appStatic('logo_mark')}
                            {/*{appStatic('logo_text')}*/}
                        </View>
                    </Link>
                )}
                {headerSettings.backButton && getBackButtonWeb()}
                {headerSettings.title && (
                    <View className="flex-auto overflow-hidden">
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className="text-2xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 "
                        >
                            {title}
                        </Text>
                    </View>
                )}
                {bSearch && (
                    <View className=" w-full flex-auto hidden xl:flex ">
                        <Search type="input" placeholder="Enter search text" />
                    </View>
                )}
            </View>
        )
    }
)

export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation();
    const bSearch = appSetting('layout', 'search') == true;
    const bMessenger = appSetting('layout', 'messenger') ? true : false;
    const bNotifs = appSetting('layout', 'notifications') ? true : false;

    const headerSettings = props.headerSettings;
    
    const menu_navbar_items = menuItemsByName(
        'main_menu',
        appSetting('menu_items', 'menu_navbar'),
        currentUser
    )

    let sTitle = props.title;
    const menuSettings = appSetting('menu_items', props?.menu?.object);
    if (menuSettings && menuSettings.name)
        sTitle = t(menuSettings.name);

    const bIsHideHeader = currentUser ? false: appSetting('layout', 'hide_header_for_nonlogged'); //windowWidth < 1024 && (!headerSettings.header); // MAY BE NEEDED

    const showMenu = () => {
        setMenuPopup(!menuPopup)
    }

    return (
        <>
            <View className={appSetting('layout', 'max_width') + " w-full flex-row flex-auto mx-auto"}>
                <Row className='w-full'>
                    <View className='flex-auto'>
                        {props.children}
                    </View>
                </Row>
            </View>
            {!bIsHideHeader && <View className={(props.layoutName == 'profile' || props.layoutName == 'messenger' || props.layoutName == 'post' ? 'hidden lg:flex ' : '') + " fixed w-full"}>
                <View className=" backdrop-blur h-16 border-b border-bdrnavbar dark:border-bdrnavbar-d items-center w-full bg-bgrnavbar dark:bg-bgrnavbar-d sm:shadow-[0_1px_0_0_rgba(0,0,0,0.1)] dark:sm:shadow-[0_1px_0_0_rgba(0,0,0,1)] ">
                <View
                        className={
                            appSetting('layout', 'max_width') +
                            ' w-full flex-row flex-auto gap-x-4 items-center'
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
                                    <Link
                                        className="flex-auto"
                                        href={item.link}
                                        key={`menu-${index}`}
                                        alt={item.title}
                                    >
                                        <ButtonRef
                                            pressed={
                                                item.link == '/' + props.uri ||
                                                (item.link == '/' &&
                                                    props.uri == 'home')
                                                    ? true
                                                    : false
                                            }
                                            variant="text"
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
                        <Row className="flex-none xl:w-80 2xl:w-96  flex-auto pr-3 sm:pr-4 justify-end ">
                            {!!currentUser && (
                                <Row className="flex-row justify-end ">
                                    <View className=" flex-row my-auto gap-x-2 ">
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
                                        <View className="sm:block">
                                            {bMessenger && (
                                                <Link
                                                    href={appSetting(
                                                        'layout',
                                                        'messenger'
                                                    )}
                                                    alt={t('Messenger')}
                                                >
                                                    <Button
                                                        tooltip={t('Messenger')}
                                                        variant="secondary"
                                                        rounded
                                                        startDecorator="ChatTeardropDots"
                                                        id="m2"
                                                        addon={{variant:'primary', text: currentUser?.counters?.bx_messenger_new_messages, hideZero: true}}
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
                                            variant="secondary"
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
                <View className="  border-b border-transparent shadow "></View>
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} />
            </View>}
        </>
    )
}
