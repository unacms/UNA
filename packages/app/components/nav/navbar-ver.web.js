import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import MenuDrawer from 'app/components/nav/menu-drawer'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Redirect from 'app/ui/atoms/redirect'
import Search from 'app/ui/molecules/search'
import Profile from 'app/ui/molecules/profile'
import { useTranslation } from 'react-i18next';
import MenuAdd from 'app/components/nav/menu-add'
import BlockByUrl from 'app/ui/molecules/block'

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

    const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser)

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

    const buttonProps = {
        startDecorator: "Plus",
        id: "m3",
        tooltip: "Create",
        rounded: 'rounded',
    }

    return (
        <>

            <Redirect ref={redirectdRef} />
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                }}
                className={(isUseBg ? "dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-b border-bdrnavbar shadow-sm" : " ") + "  fixed w-full lg:w-80 top-0  items-start lg:h-screen    "}>
                <View className=' flex-row lg:flex-col  h-16 lg:h-auto items-center lg:items-start ' >
                    <View className=' justify-between  lg:h-screen flex-auto '>
                        <View className='px-3 sm:px-4 lg:px-2 lg:pt-4 flex-row lg:flex-col lg:w-80'>
                            {headerSettings.menu && (
                                <View className="lg:hidden mr-3 sm:mr-4">
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
                            <View className='justify-center px-2'>
                                <Link href="/home" aria-label="Logo">
                                    <View className="group  mr-auto flex-row flex-none items-center my-auto lg:mx-2 lg:mb-4">
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
                                                    size="base"
                                                    fullWidth={true}
                                                    startDecorator={
                                                        item.icon.indexOf(' ') == -1
                                                            ? item.icon
                                                            : item.icon.split(' ')[0]
                                                    }
                                                    rounded
                                                    align="start"
                                                    title={item.title}
                                                />
                                            </Link>
                                    )}
                                    {!!currentUser && (
                                        <>

                                            {bSearch && <Search>
                                                <Button
                                                    variant="text"
                                                    size="base"
                                                    fullWidth={true}
                                                    startDecorator="MagnifyingGlass"
                                                    align="start"
                                                    rounded
                                                    title={"Search"}
                                                />
                                            </Search>
                                            }
                                        </>)}
                                </View>
                            </View>
                        </View>
                        <View className='hidden lg:flex flex-col flex-auto justify-between h-full'>
                            {!!currentUser && (
                                    <Row className='mt-4 justify-center mx-auto w-full px-4 gap-x-4'>
                                        <View className='flex-auto'>
                                            <BlockByUrl url="/api.php?r=bx_timeline/get_block_post_account" exProps={{ "mode": "button" }} />
                                        </View>
                                        {menu_add_items.length > 0 && <MenuAdd typestyle="button" buttonProps={buttonProps} />}
                                    </Row>
                            )}
                            {!!currentUser && (
                                <Link href={appSetting('layout', 'dashboard')}>
                                    <Row className="items-center justify-between mx-4 my-3 p-1 rounded-full hover:border-transparent border border-bdritem dark:border-bdritem-d cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50">
                                        <Row className='flex-row gap-x-3 items-center'>
                                            <View className="mx-0.5 bg-bgritem dark:bg-bgritem-d rounded-full flex-none ">
                                                {profile}
                                            </View>
                                            <Text className="text-base flex-auto my-auto font-semibold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                                {currentUser.display_name}
                                            </Text>
                                        </Row><View className='flex-none '><Button
                                            variant="text"
                                            size="sm"
                                            rounded="rounded"
                                            tooltip={t('Switch profile')}
                                            startDecorator="UserSwitch"
                                            fullWidth
                                            align="right"
                                        /></View></Row>
                                </Link>
                            )}
                        </View>
                    </View>
                    {!!currentUser && (
                        <Row className="flex-row px-3 sm:px-4 justify-end ">
                            <View className=" flex-row my-auto gap-x-2 ">
                                <View className="lg:hidden ">
                                    {bSearch && <Search />}
                                </View>

                                <View className="lg:hidden">
                                    <MenuAdd />
                                </View>
                            </View>
                        </Row>
                    )}
                </View>
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="" />
            </ScrollView>
        </>
    )
}
