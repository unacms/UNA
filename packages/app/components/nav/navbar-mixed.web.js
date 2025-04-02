import { memo, useState, useRef, useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { Button, ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/common-helpers';
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

const HeaderLine = memo(({headerSettings, currentUser, uri, title, menuPopup, setMenuPopup, showMenu}) => {
    
    const { width } = useWindowDimensions();
    if (width > LAYOUT_BREAKPOINTS.xl && menuPopup)
        setMenuPopup(false)

    const isDrawer = menuItemsByName('main_menu', appSetting('menu_items', 'menu_drawer'), currentUser).length > 0;

    return (
        <View className="flex-row xl:w-80 px-3 sm:px-4 my-auto items-center">
            {(headerSettings.menu && isDrawer) && (
                <View className="lg:hidden mr-3 sm:mr-4">
                    <Pressable onPress={showMenu}>
                        <Button
                            variant="secondary"
                            startDecorator="List"
                            rounded
                            align="start"
                            aria-label="Menu"
                            alt="Menu"
                        />
                    </Pressable>
                    
                </View>
            )}
            {(uri === 'home' || width >= LAYOUT_BREAKPOINTS.lg) && (
                 <Link className=" flex flex-row group gap-x-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-primary/50 rounded-lg " href="/home" aria-label="Logo">
                            
                           
                 <View className=" items-center justify-center">
                 {appStatic('logo_mark')}
                 </View>
                 <View className=" items-center justify-center">
                 {appStatic('logo_text')}
                 </View>
                 {/*{appStatic('logo_text')}*/}
             
         </Link>
            )}
            {headerSettings.backButton && getBackButtonWeb()}
            {headerSettings.title && <View className='flex-auto overflow-hidden'>
                <Text numberOfLines={1} ellipsizeMode='tail' className="text-2xl lg:hidden font-bold text-neutral-800 dark:text-neutral-200 ">
                    {title}
                </Text>
            </View>}
                       
        </View>
    )
});

export default function (props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [menuPopup, setMenuPopup] = useState(false)
    const { t } = useTranslation();
    const bSearch = appSetting('layout', 'search') == true;
    const bMessenger = appSetting('messenger', 'url') ? true : false;
    const bNotifs = appSetting('notifications', 'url') ? true : false;

    const menu_sidebar_items = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);

    const headerSettings = props.headerSettings;

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
                    {(menu_sidebar_items.length > 0 && (props.uri != 'home' || (props.uri == 'home' && currentUser))) && <View className='hidden lg:block w-full lg:w-80 '>
                        <View className=' pt-16 fixed-process w-80 max-h-screen overflow-scroll	'>
                            <View className='px-4 py-3 '>
                                <ProfileSwitcher hideTitle={true} useDefault={true} />
                                {menu_sidebar_items.map(
                                    (item, index) =>
                                        <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                            <Button
                                                pressed={
                                                    (item.link == '/' + props.uri || (item.link == '/' && props.uri == 'home'))
                                                        ? true
                                                        : false
                                                }
                                                variant="secondary"
                                                size="base"
                                                fullWidth
                                                startDecorator={item.icon}
                                                align="start"
                                                title={item.title}
                                            />
                                        </Link>
                                )}
                            </View>

                        </View>

                    </View>}
                    <View className='flex-auto border-x border-bdr dark:border-bdr-d'>
                        {props.children}
                    </View>
                </Row>
            </View>
            {!bIsHideHeader && <View className={(props.layoutName == 'profile' || props.layoutName == 'messenger' || props.layoutName == 'post' ? 'hidden lg:flex ' : '') + " fixed w-full"}>
                <View className=" h-16  items-center w-full border-b border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d  ">
                    <View className={appSetting('layout', 'max_width') + "  w-full flex-row flex-auto  items-center "}>
                        <HeaderLine headerSettings={headerSettings} currentUser={currentUser} uri={props.uri} title={sTitle} showMenu={showMenu} menuPopup={menuPopup} setMenuPopup={setMenuPopup} />

                        <Row className="flex-auto  ">
                            <Row className='w-full items-center '>
                                {(bSearch && currentUser) && <View className=' items-end mx-auto flex-auto max-w-2xl hidden lg:block '>
                                    <Search type="input" placeholder="Enter search text" />
                                </View>}
                            </Row>
                        </Row>
                        <Row className="flex-row flex-auto xl:flex-none xl:w-96 px-3 sm:px-4 justify-end  ">
                            {!!currentUser && (
                                <Row className="flex-row justify-end ">
                                    <View className=" flex-row my-auto gap-x-2 ">
                                        <View className="lg:hidden ">
                                            {bSearch && <Search />}
                                        </View>
                                        <View className="hidden">
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
                                                <Link href={appSetting('messenger','url')} alt={t('Messenger')} >
                                                    <ButtonRef
                                                        tooltip={t('Messenger')}
                                                        variant="secondary"
                                                        rounded
                                                        startDecorator="MessageCircleMore"
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
                                    <Link href="/">
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
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} />
            </View>}
        </>
    )
}
