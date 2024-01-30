import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import MainMenu from 'app/components/nav/mainmenu'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Search from 'app/ui/molecules/search'
import NotificationButton from 'app/ui/molecules/notif'
import Profile from 'app/ui/molecules/profile'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';

export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation();
    let { width } = useWindowDimensions()

    if (width > 1280 && menuPopup)
        setMenuPopup(false)

    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }

    const hideMenu = (params) => {
        // setMenuPopup(false)
    }

    const bSearch = appSetting('layout', 'search') == true;
    const bMessenger = appSetting('layout', 'messenger') ? true : false;
    const bNotifs = appSetting('layout', 'notifications') ? true : false;
    const bApps = appSetting('layout', 'apps') == true;

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="sm" />
    }

    const menu_top = appSetting('menu_items', 'menu_top');
    const menu_top_more = appSetting('menu_items', 'menu_top_more');
    const menu_add = appSetting('menu_items', 'menu_add');
    const menu_account = appSetting('menu_items', 'menu_account');

    const menu_drawer = appSetting('menu_items', 'menu_drawer')
    let menu_drawer_items = menuItemsByName('main_menu', menu_drawer, currentUser);

    const windowWidth = useWindowDimensions().width;
    let headerSettings = getHeaderSettings(props.uri, width, props.layoutName);

    useEffect(() => {
        const handleClick = () => {
            hideMenu();
        }

        document.addEventListener('click', handleClick)

        return () => document.removeEventListener('click', handleClick)
    }, [])

   
    let sTitle = props.title;
    const menuSettings = appSetting('menu_items', props?.menu?.object);
    if (menuSettings && menuSettings.name)
        sTitle = t(menuSettings.name);
    return (
        <>
            <View className={appSetting('layout', 'max_width') + "   w-full flex-row flex-auto  mx-auto lg:border-r  lg:border-l border-dashed border-bdr dark:border-bdr-d"}>
                <Row className='w-full'>
                    <View className='hidden lg:block w-full lg:w-80 lg:border-r border-dashed border-bdr dark:border-bdr-d'>
                        <View className=' pt-16 fixed-process lg:w-80'>
                            <View className='pt-4 pr-4 pl-4'>
                                {menuItemsByName('main_menu', menu_top, currentUser).map(
                                    (item, index) =>
                                        <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                            <ButtonRef
                                                variant="text"
                                                size="lg"
                                                fullWidth
                                                startDecorator={
                                                    item.icon.indexOf(' ') == -1
                                                        ? item.icon
                                                        : item.icon.split(' ')[0]
                                                }
                                                align="start"
                                                title={item.title}
                                            />
                                        </Link>
                                )}
                            </View>

                        </View>

                    </View>
                    <View className='flex-auto'>
                        {props.children}
                    </View>
                </Row>
            </View>
            <View className={(props.layoutName== 'profile' ? 'hidden lg:flex ': '' ) + " fixed -top-[1px] w-full "}>
                <View className=" backdrop-blur h-16  items-center w-full shadow-sm border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d  ">
                    <View className={appSetting('layout', 'max_width') + " px-3 sm:px-4 lg:px-6  w-full flex-row flex-auto  items-center"}>
                        <View className="flex-row flex-auto xl:flex-none flex-auto my-auto items-center">
                            {
                                headerSettings.menu && menu_drawer_items.length > 0 && (
                                    <View className="lg:hidden mr-4">
                                        <Pressable onPress={showMenu}>
                                            <Button
                                                variant="outline"
                                                startDecorator="List"
                                                rounded
                                                align="start"
                                                aria-label={t("Menu")}
                                                alt={t("Menu")}
                                            />

                                        </Pressable>
                                    </View>)}
                            {(props.uri == 'home' || windowWidth >= 1024) &&
                                <Link href="/home" aria-label="Logo">
                                    <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto">
                                        {appStatic('logo_mark')}
                                        {appStatic('logo_text')}
                                    </View>
                                </Link>
                            }
                            {headerSettings.backButton && getBackButtonWeb()}
                            {headerSettings.title && <View className='flex-auto overflow-hidden'><Text numberOfLines={1} ellipsizeMode='tail' className="text-2xl sm:text-3xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 ">{sTitle}</Text></View>}

                            {bSearch && <View className="hidden"><Search type="input" /></View>}

                        </View>
                        <Row className="hidden xl:flex flex-auto">

                        </Row>
                        <Row className="flex-row xl:flex-none justify-end">
                            {!!currentUser && (
                                <Row className="flex-row justify-end">
                                    <View className=" flex-row my-auto gap-x-2 ml-2">
                                        {bSearch && <View className=""><Search /></View>}
                                        {bApps && <View className="relative hidden lg:flex flex-row">
                                            <DropdownMenu items={menuItemsByName('', menu_top_more, currentUser)

                                                .map((item, index) => ({
                                                    id: 'menu-' + index,
                                                    link: item.link,
                                                    title: t(item.title),
                                                    icon: item.icon.includes(' ') ? item.icon.split(' ')[0] : item.icon,
                                                }))
                                            }
                                            >
                                                <ButtonRef
                                                    tooltip="All Apps"
                                                    variant="outline"
                                                    size="base"
                                                    fullWidth
                                                    rounded
                                                    alt={t("All Apps")}
                                                    startDecorator="CirclesFour"
                                                    aria-label="All Apps"
                                                    onPress={() => { }}
                                                />
                                            </DropdownMenu>
                                        </View>}

                                        {menuItemsByName('', menu_add, currentUser).length > 0 && <View>
                                            <DropdownMenu
                                                items={menuItemsByName('', menu_add, currentUser).map(
                                                    (item, index) => {
                                                        return (
                                                            {
                                                                id: 'menu-' + index,
                                                                link: item.link,
                                                                title: t(item.title),
                                                                icon:
                                                                    item.icon.indexOf(' ') == -1
                                                                        ? item.icon
                                                                        : item.icon.split(' ')[0],
                                                            }
                                                        )
                                                    }
                                                )}
                                            >

                                                <ButtonRef
                                                    variant="outline"
                                                    rounded
                                                    startDecorator="Plus"
                                                    id="m3"
                                                    tooltip="Create content"
                                                    aria-label="Create new content"
                                                    onPress={() => { }}
                                                />
                                            </DropdownMenu>
                                        </View>}
                                        <View className="hidden sm:flex flex-row gap-x-2 my-auto">
                                            {bNotifs && <NotificationButton />}
                                            {bMessenger &&
                                                <Link href='/messenger' alt={t("Messenger")}>
                                                    <ButtonRef
                                                        tooltip={t("Messenger")}
                                                        variant="outline"
                                                        rounded
                                                        startDecorator="ChatTeardropDots"
                                                        id="m2"
                                                    />
                                                </Link>
                                            }
                                        </View>
                                        {profile ? (
                                            <View className="hidden sm:flex flex-row justify-center">
                                                <DropdownMenu items={menuItemsByName('', menu_account, currentUser).map(
                                                    (item, index) => {
                                                        return (
                                                            {
                                                                id: 'menu-' + index,
                                                                link: item.link,
                                                                title: t(item.title),
                                                                icon:
                                                                    item.icon.indexOf(' ') == -1
                                                                        ? item.icon
                                                                        : item.icon.split(' ')[0],
                                                            }
                                                        )
                                                    }
                                                )}
                                                >
                                                    <ButtonRef
                                                        tooltip={t("Dashboard")}
                                                        variant="outline"
                                                        rounded
                                                        padding={1}
                                                        startDecorator={profile}
                                                        id="m3"
                                                        onPress={() => { }}
                                                        aria-label="Dashboard"
                                                    />
                                                </DropdownMenu>
                                            </View>
                                        ) : (
                                            <></>
                                        )}
                                    </View>
                                </Row>
                            )}
                            {!currentUser && (
                                <Row className="flex-row flex-auto sm:flex-none justify-end   my-auto ml-2 gap-x-2">
                                    {bSearch && <View><Search /></View>}
                                    {bApps && <View className="relative hidden lg:flex flex-row">
                                        <DropdownMenu items={menuItemsByName('', menu_top_more, currentUser)
                                            .map((item, index) => ({
                                                id: 'menu-' + index,
                                                link: item.link,
                                                title: t(item.title),
                                                'aria-label': t(item.title),
                                                icon: item.icon.includes(' ') ? item.icon.split(' ')[0] : item.icon,
                                            }))
                                        }
                                        >
                                            <ButtonRef
                                                tooltip="All Apps"
                                                variant="outline"
                                                size="base"
                                                fullWidth
                                                rounded
                                                alt={t("All Apps")}
                                                startDecorator="CirclesFour"
                                                aria-label={t("All Apps")}
                                                onPress={() => { }}
                                            />
                                        </DropdownMenu>
                                    </View>}
                                    <Link href="/login">
                                        <ButtonRef
                                            variant="outline"
                                            tooltip="Account"
                                            rounded
                                            aria-label="Account"
                                            alt={t("Account")}
                                            startDecorator="User"
                                        />
                                    </Link>
                                </Row>
                            )}
                        </Row>
                    </View>
                </View>
                <MainMenu showMenu={showMenu} menuPopup={menuPopup} items={menu_drawer_items} cssClass="" />
            </View>

        </>
    )
}
