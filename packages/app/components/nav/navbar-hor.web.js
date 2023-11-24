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
import Tooltip from 'app/ui/atoms/tooltip';
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
    
    const windowWidth = useWindowDimensions().width;

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
            <View className="fixed -top-[1px]  w-full">
                <View className="   backdrop-blur h-16 px-4 lg:px-6 items-center w-full shadow-sm border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d flex-row  ">
                    <View className="flex-row flex-auto xl:flex-none xl:w-1/4 xl:max-w-xs gap-x-4 my-auto">
                        <Row className="flex-row  flex-none items-center">
                            {
                                headerSettings.menu && (
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
                                    { (props.uri == 'home' || windowWidth >= 1024) &&  
                                    <Link href="/home" aria-label="Logo">
                                        <View className="group  mr-auto flex-row  flex-none  items-center rounded-lg my-auto">
                                            {appStatic('logo_mark')}
                                            {appStatic('logo_text')}
                                        </View>
                                    </Link>
                            }
                            { headerSettings.backButton  && getBackButtonWeb() }
                            { headerSettings.title && <Text  className="text-2xl sm:text-3xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 ">{props.title}</Text> }
                        </Row>
                        {bSearch && <View className="hidden"><Search type="input" /></View>}
                        
                    </View>
                    <Row className="hidden w-1/2  xl:flex flex-auto">
                        <Row className='w-full mx-auto gap-x-0.5 max-w-lg justify-between'>
                            {menuItemsByName('main_menu', menu_top).map(
                            (item, index) =>
                            (currentUser || (!currentUser && item.nonlogged != false)) && (
                                <Link className="flex-auto" href={item.link} key={`menu-${index}`} alt={item.title}>
                                    <Tooltip content={t(item.title)} asChildTrigger={true}>
                                    <ButtonRef
                                        variant="text"
                                        size="lg"
                                        fullWidth
                                        startDecorator={
                                        item.icon.indexOf(' ') == -1
                                            ? item.icon
                                            : item.icon.split(' ')[0]
                                        }
                                        align="center"
                                    />
                                    </Tooltip>
                                </Link>
                                )
                            )}
                            
                        </Row>
                    </Row>
                    <Row className="flex-row xl:w-1/4 max-w-md  flex-none justify-end  ">          
                        {!!currentUser && (
                            <Row className="flex-row   justify-end ">
                            <View className=" flex-row my-auto gap-x-2 ml-2">
                                {bSearch && <View className=""><Search /></View>}
                                {bApps && <View className="relative hidden lg:flex flex-row">
                                <DropdownMenu  items={menuItemsByName('', menu_top_more)
                                        .filter(item => currentUser || (!currentUser && item.nonlogged !== false))
                                        .map((item, index) => ({
                                            id: 'menu-' + index,
                                            link: item.link,
                                            title: t(item.title),
                                            icon: item.icon.includes(' ') ? item.icon.split(' ')[0] : item.icon,
                                        }))
                                    }
                                >
                                    <Tooltip content="Apps" asChildTrigger={true}>
                                        <ButtonRef
                                            variant="outline"
                                            size="base"
                                            fullWidth
                                            rounded
                                            alt={t("All Apps")}
                                            startDecorator="CirclesFour"
                                            aria-label="All Apps"
                                            onPress={() => {}}
                                        />
                                    </Tooltip>
                                </DropdownMenu>
                            </View>}
                            
                            { menuItemsByName('', menu_add).length > 0 && <View>
                                <DropdownMenu
                                    items={menuItemsByName('', menu_add).map(
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
                                    <Tooltip content={t("Create content")} asChildTrigger={true}>
                                        <ButtonRef
                                        variant="outline"
                                        rounded
                                        startDecorator="Plus"
                                        id="m3"

                                        onPress={() => {}}
                                        />
                                    </Tooltip>
                                </DropdownMenu>
                            </View>}
                            <View className="hidden sm:flex flex-row gap-x-2 my-auto">
                                
                                {bNotifs && <NotificationButton />}
                                {bMessenger && <Tooltip content={t("Messenger")} asChildTrigger={true}>
                                    <ButtonRef
                                        variant="outline"
                                        rounded
                                        startDecorator="ChatTeardropDots"
                                        id="m2"
                                        onPress={() => {
                                        handleClick('/messenger')
                                        }}
                                    />
                                </Tooltip> }
                            </View>
                            {profile ? (
                                <View className="hidden sm:flex flex-row justify-center">
                                    <DropdownMenu items={menuItemsByName('', menu_account).map(
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
                                        <Tooltip content={t("Dashboard")} asChildTrigger={true}>
                                            <ButtonRef
                                                variant="outline"
                                                rounded
                                                padding={1}
                                                startDecorator={profile}
                                                id="m3"
                                                onPress={() => {}}
                                            />
                                        </Tooltip>
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
                                <DropdownMenu  items={menuItemsByName('', menu_top_more)
                                        .filter(item => currentUser || (!currentUser && item.nonlogged !== false))
                                        .map((item, index) => ({
                                            id: 'menu-' + index,
                                            link: item.link,
                                            title: t(item.title),
                                            icon: item.icon.includes(' ') ? item.icon.split(' ')[0] : item.icon,
                                        }))
                                    }
                                >
                                    <Tooltip content="Apps" asChildTrigger={true}>
                                        <ButtonRef
                                            variant="outline"
                                            size="base"
                                            fullWidth
                                            rounded
                                            alt={t("All Apps")}
                                            startDecorator="CirclesFour"
                                            aria-label="All Apps"
                                            onPress={() => {}}
                                        />
                                    </Tooltip>
                                </DropdownMenu>
                            </View>}
                            <Link href="/login">
                            <Button
                                variant="outline"
                                rounded

                                startDecorator="User"
                            />
                            </Link>
                        </Row>
                    )}
                    </Row>
                </View>
                <MainMenu showMenu={showMenu} menuPopup={menuPopup} cssClass="" />
            </View>
        </>
    )
}
