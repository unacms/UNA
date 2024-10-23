import { memo, useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import MenuDrawer from 'app/components/nav/menu-drawer'
import { Button } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import Redirect from 'app/ui/atoms/redirect'
import Search from 'app/ui/molecules/search'
import Profile from 'app/ui/molecules/profile'
import { useTranslation } from 'react-i18next';
import MenuAdd from 'app/components/nav/menu-add'
import BlockByUrl from 'app/ui/molecules/block'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';


const HeaderLine = memo(({ headerSettings, currentUser, uri, bSearch, menuPopup, setMenuPopup, showMenu }) => {

    const { width } = useWindowDimensions();
    if (width > LAYOUT_BREAKPOINTS.xl && menuPopup)
        setMenuPopup(false)

    const isDrawer = menuItemsByName('main_menu', appSetting('menu_items', 'menu_drawer'), currentUser).length > 0;

    const menu_sidebar_items = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);

    return (
        <View className=' flex-row lg:flex-col lg:w-80'>
            {(headerSettings.menu && isDrawer) && (
                <View className="lg:hidden ml-4">
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
            <View className='justify-center px-4'>
                <Link href="/home" aria-label="Logo">
                    <View className="group  mr-auto flex-row flex-none items-center my-auto lg:py-2.5 px-1">
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
                                    addon={item.link == '/notifications-view' && { text: currentUser.notifications, variant: 'primary' }}
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
    )
});

export default function (props) {

    const { t } = useTranslation();
    const redirectdRef = useRef()
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuPopup, setMenuPopup] = useState(false)

    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }

    const bSearch = appSetting('layout', 'search') == true;

    const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser)

    const headerSettings = props.headerSettings;

    const buttonProps = {
        id: "m3",
        startDecorator: "Plus",
        tooltip: "Create",
        rounded: 'rounded',
    }

    const menu_account_items = menuItemsByName('', appSetting('menu_items', 'menu_account'), currentUser)

    return (
        <>
            <Redirect ref={redirectdRef} />
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                }}
                className={"dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-b border-bdrnavbar shadow-sm lg:bg-transparent lg:border-none lg:shadow-none" + "  fixed w-full lg:w-80 top-0 items-start lg:h-screen" + (!headerSettings.header ? ' hidden lg:flex' : '')}>
                <View className=' flex-row lg:flex-col  h-16 lg:h-auto items-center lg:items-start ' >
                    <View className=' justify-between  lg:h-screen flex-auto '>
                        <HeaderLine headerSettings={headerSettings} currentUser={currentUser} uri={props.uri} bSearch={bSearch} showMenu={showMenu} menuPopup={menuPopup} setMenuPopup={setMenuPopup} />
                        <View className='hidden lg:flex flex-col flex-auto justify-between h-full'>
                            {!!currentUser && (
                                <>
                                    <Row className='mt-4 justify-center mx-auto w-full px-4 gap-x-4'>
                                        <View className='flex-auto'>
                                            <BlockByUrl url="/api.php?r=bx_timeline/get_block_post_account" exProps={{ "mode": "button" }} />
                                        </View>
                                    </Row>
                                
                                    <View className='py-4'>
                                        <Row className='flex-row px-4 '>
                                            <View className='flex-auto'>
                                                <DropdownMenu items={menu_account_items.map(
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
                                                    <Row className={"rounded-full items-center justify-between  p-1  hover:border-transparent  cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50"}>
                                                        <Row className='flex-row gap-x-3 items-center'>
                                                            <Profile
                                                                {...currentUser}
                                                                url_avatar={currentUser.avatar}
                                                                displayType="unit_wo_info"
                                                                displaySize="sm"
                                                            />
                                                            <Text className="text-base flex-auto my-auto font-semibold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                                                {currentUser.display_name}
                                                            </Text>
                                                        </Row>

                                                    </Row>
                                                </DropdownMenu>
                                            </View>
                                            <View className='ml-2'>
                                                {menu_add_items.length > 0 && <MenuAdd typestyle="button" buttonProps={buttonProps} />}
                                            </View>
                                        </Row>
                                    </View>
                                </>
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
