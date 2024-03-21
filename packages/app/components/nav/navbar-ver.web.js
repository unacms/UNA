import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import MenuDrawer from 'app/components/nav/menu-drawer'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Redirect from 'app/ui/atoms/redirect'
import Search from 'app/ui/molecules/search'
import Browse from 'app/components/elements/browse'
import Notifications from 'app/components/units/notifications'
import Profile from 'app/ui/molecules/profile'

import { useTranslation } from 'react-i18next';
import NotificationButton from 'app/ui/molecules/notif'
import MenuAdd from 'app/components/nav/menu-add'

export default function (props) {
    const { t } = useTranslation();
    const redirectdRef = useRef()
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuPopup, setMenuPopup] = useState(false)

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
    const bNotifs = appSetting('layout', 'notifications') ? true : false;  

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="sm" />
    }

    let isUseBg = appSetting('layout', 'use_background');

    const menu_sidebar_items = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);

    const windowWidth = useWindowDimensions().width + 17;
    let headerSettings = getHeaderSettings(props.uri, width, props.layoutName);
    if (windowWidth < 1024)
        isUseBg = true;
    useEffect(() => {
        const handleClick = () => {
            hideMenu();
        }

        document.addEventListener('click', handleClick)

        return () => document.removeEventListener('click', handleClick)
    }, [])

    if (windowWidth < 1024 && (!headerSettings.header))
        return <></>

    return (
        <>
            <Redirect ref={redirectdRef} />
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                }}
                className={(isUseBg ? "dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-b border-bdrnavbar shadow-sm" : " xl:border-r border-dashed border-bdr dark:border-bdr-d") + "  fixed w-full lg:w-80 top-0  items-start lg:h-screen    "}>
                <View className=' flex-row lg:flex-col w-full  w-screen  lg:w-full  h-16 lg:h-auto items-center lg:items-start pr-4 lg:pr-0' >
                    <View className=' justify-between  lg:h-screen lg:w-80 '>
                        <View className='px-4 lg:pt-4 flex-row lg:flex-col'>
                            {headerSettings.menu && (
                                <View className="lg:hidden mr-4">
                                    <Pressable onPress={showMenu}>
                                        <Button
                                            variant="outline"
                                            startDecorator="List"
                                            rounded
                                            align="start"
                                        />
                                    </Pressable>
                                </View>
                            )}
                            <View className='justify-center'>
                                <Link href="/home" aria-label="Logo">
                                    <View className="group  mr-auto flex-row flex-none items-center rounded-lg my-auto lg:mx-2 lg:mb-4">
                                        {appStatic('logo_mark')}
                                        {appStatic('logo_text')}
                                    </View>
                                </Link>
                                <View className='hidden lg:block'>
                                    {menu_sidebar_items.map(
                                        (item, index) =>
                                            <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                                <Button
                                                    variant="text"
                                                    size="lg"
                                                    fullWidth={true}
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
                                    {!!currentUser && (
                                        <>
                                            {bNotifs && <NotificationButton buttonProps={{ variant: "text", size: "lg", fullWidth: true, startDecorator: "Bell", align: "start", title: "Notifications" }}></NotificationButton>}
                                            {bSearch && <Search>
                                                <Button
                                                    variant="text"
                                                    size="lg"
                                                    fullWidth={true}
                                                    startDecorator="MagnifyingGlass"
                                                    align="start"
                                                    title={"Search"}
                                                />
                                            </Search>
                                            }
                                        </>)}
                                </View>
                            </View>
                        </View>
                        <View className='hidden lg:block mt-4'>
                            {!!currentUser && (
                                <Link href={appSetting('layout', 'dashboard')}>
                                    <Row className="items-center justify-between mx-4 mb-2 px-2.5 py-2 rounded-full hover:border-transparent border border-bdritem dark:border-bdritem-d cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50">
                                        <Row className='flex-row gap-x-2 items-center'>
                                            <View className="mx-0.5 bg-bgritem dark:bg-bgritem-d rounded-full flex-none ">
                                                {profile}
                                            </View>
                                            <Text className="text-lg flex-auto my-auto font-bold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                                {currentUser.display_name}
                                            </Text>
                                        </Row><View className='flex-none '><Button
                                            variant="text"
                                            size="sm"
                                            tooltip={t('Switch profile')}
                                            startDecorator="UserSwitch"
                                            fullWidth
                                            align="right"
                                        /></View></Row>
                                </Link>
                            ) } 
                        </View>
                    </View>
                    {!!currentUser && (
                        <Row className='lg:hidden lg:w-full justify-end flex-auto'>
                            {bSearch && <View className="xl:hidden ml-2"><Search /></View>}
                            <MenuAdd />
                        </Row>)
                    }
                </View>
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="" />
            </ScrollView>
        </>
    )
}
