import { useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'

import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import MainMenu from 'app/components/nav/mainmenu'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getHeaderSettings } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'

import Redirect from 'app/ui/atoms/redirect'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Search from 'app/ui/molecules/search'
import Browse from 'app/components/elements/browse'
import Notifications from 'app/components/units/notifications'
import Profile from 'app/ui/molecules/profile'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Tooltip from 'app/ui/atoms/tooltip';

export default function (props) {
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
    const bMessenger = appSetting('layout', 'messenger') ? true : false;
    const bApps = appSetting('layout', 'apps') == true;

    const sTxtNtfsTitle = t("Notifications")
    const sTxtNtfsViewAll = t("View all")
    const [ntfsOpen, setNtfsOpen] = useState(false)
    let data = {request_url : "/api.php?r=bx_notifications/get_data/&params[]=", "type" : "obj_own_and_con", unit:"notifications"}
    const ntfsContent = (
        <View key="ddp-content" className="px-1.5 pb-1.5">
            <View className="items-center mb-1">
                <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">
                    {sTxtNtfsTitle}
                </Text>
                <Button
                    variant="text"
                    size="sm"
                    rounded
                    endDecorator="CaretDoubleRight"
                    title={sTxtNtfsViewAll}
                    onPress={() => {
                    setNtfsOpen(false)
                    handleClick(appSetting('layout', 'notifications'))
                    }}
                />
            </View>
            {true ? (
                <Browse height={400}  data={data} />
            ) : (
                oBlock.data.data.map((a) => <Notifications key={a.id} data={a} />)
            )}
        </View>
    )

    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl)
    }

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

    const windowWidth = useWindowDimensions().width + 17;

    let headerSettings = getHeaderSettings(props.uri, width);

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
            <ScrollView className=" backdrop-blur fixed w-full lg:w-1/5 top-0 px-4 py-[11px] items-start lg:h-screen shadow-sm border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d">
                    <View className=' flex-row lg:flex-col justify-between w-full' >
                        {headerSettings.menu && (
                            <View className="lg:hidden mr-4">
                                <Pressable  onPress={showMenu}>
                                    <Button
                                        variant="outline"
                                        startDecorator="List"
                                        rounded
                                        align="start"
                                    />
                            
                                </Pressable>
                            </View>  )}
                        <Link href="/home" aria-label="Logo">
                            <View className="group  mr-auto flex-row flex-none items-center rounded-lg my-auto lg:mx-2 lg:mb-4">
                                {appStatic('logo_mark')}
                                {appStatic('logo_text')}
                            </View>
                        </Link>
                        <View className='hidden lg:block'>
                            {menuItemsByName('main_menu', menu_top).map(
                                (item, index) =>
                                (currentUser || (!currentUser && item.nonlogged != false)) && (
                                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                        <Tooltip content={item.title} asChildTrigger={true}>
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
                                        </Tooltip>
                                    </Link>
                                )
                            )}
                            {!!currentUser && (
                            <Row className="items-center justify-between mx-4 mb-2 px-2.5 py-2 rounded-xl hover:border-transparent border border-bdritem dark:border-bdritem-d cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50">
                                    <Link href={currentUser.url} className="flex-auto">
                                        <Row className='flex-row gap-x-2 items-center'>
                                            <View className="mx-0.5 bg-bgritem dark:bg-bgritem-d rounded-full flex-none ">
                                                {profile}
                                            </View>
                                            <Text className="text-lg flex-auto my-auto font-bold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                                {currentUser.display_name}
                                            </Text>
                                        </Row>
                                    </Link>
                                    {appSetting('layout', 'allow_switch_profile') && <View className='flex-none'><Button
                                    variant="text"
                                    size="sm"
                                    startDecorator="UserSwitch"
                                    fullWidth
                                    onClick = {() => setShowImage(true)}
                                    align="right"
                                /></View>}
                            </Row>
                            )}
                        </View>
                        <Row className='lg:hidden w-full justify-end'>
                           
                            {bSearch && <View className="xl:hidden ml-2"><Search /></View>}
                            { menuItemsByName('', menu_add).length > 0 && <View className="ml-2">
                                <DropdownMenu
                                    items={menuItemsByName('', menu_add).map(
                                        (item, index) => {
                                        return (
                                            {
                                            id: 'menu-' + index,
                                            link: item.link,
                                            title: item.title,
                                            icon:
                                                item.icon.indexOf(' ') == -1
                                                ? item.icon
                                                : item.icon.split(' ')[0],
                                            }
                                        )
                                        }
                                    )}
                                >
                                    <Tooltip content="Create content" asChildTrigger={true}>
                                        <ButtonRef
                                        variant="outline"
                                        rounded
                                        startDecorator="plus"
                                        id="m3"

                                        onPress={() => {}}
                                        />
                                    </Tooltip>
                                </DropdownMenu>
                            </View>}
                        </Row>
                </View>
                <MainMenu showMenu={showMenu} menuPopup={menuPopup} cssClass="" />
            </ScrollView>
        </>
    )
}
