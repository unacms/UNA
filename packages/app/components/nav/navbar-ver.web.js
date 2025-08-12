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
import MenuAccount from 'app/components/nav/menu-account'
import { getComponent } from 'app/components/registry'
import { MenuItemSidebarWithWrapper } from 'app/components/nav/menu-item-sidebar'

const SidebarBottomToolbar = ({ currentUser, menu_add_items, buttonProps }) => {
    const toolbarConfig = appSetting('header_toolbar', 'ver')?.loggedIn?.sidebar;
    if (!toolbarConfig || !currentUser) return null;

    const components = {
        post_button: (
            <BlockByUrl url="/api.php?r=bx_timeline/get_block_post_account" exProps={{ "mode": "button" }} />
        ),
        account: (
            <MenuAccount>
                <Row className={"rounded-full items-center justify-between p-1 hover:border-transparent cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50"}>
                    <Row className='gap-2 lg:gap-3 items-center'>
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="sm"
                        />
                        <Text className=" text-base flex-auto my-auto font-semibold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                            {currentUser.display_name}
                        </Text>
                    </Row>
                </Row>
            </MenuAccount>
        ),
        add: menu_add_items.length > 0 ? <MenuAdd typestyle="button" buttonProps={buttonProps} /> : null,
    };

    return (
        <View className='py-4'>
            <Row className='flex-row px-4 items-center'>
                {toolbarConfig.map((item, index) => {
                    const Component = components[item.component];
                    if (!Component) return null;
                    return (
                        <View key={index} className={item.className}>
                            {Component}
                        </View>
                    );
                })}
            </Row>
        </View>
    );
};

const SideBar = memo(({ headerSettings, currentUser, uri, bSearch, menuPopup, setMenuPopup, showMenu, context }) => {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    if (width > LAYOUT_BREAKPOINTS.xl && menuPopup)
        setMenuPopup(false)

    const ContextSelector = getComponent('molecule', 'context_selector')
    const menu_sidebar_items = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);
  const blocks = appSetting('layout', 'vertical', 'blocks')

    return (
        <View className=' flex-row lg:flex-col lg:w-90'>
            <View className='justify-center px-4 my-3 gap-y-3 '>
                {(!context ||
                    (!currentUser.confirmed &&
                        appSetting('layout', 'lock_unconfirmed'))) &&
                    (uri == 'home' || width >= LAYOUT_BREAKPOINTS.lg) && (
                        <Link
                            className=" flex items-center  hover:bg-bgritem dark:hover:bg-bgritem-d rounded-xl flex-row active:scale-95 active:opacity-50 text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-neutral-50 web:duration-300 "
                            href="/home"
                        >
                            {appStatic('logo')}
                        </Link>
                    )}
                {context &&
                    (currentUser.confirmed ||
                        !appSetting('layout', 'lock_unconfirmed')) && (
                        <ContextSelector data={context} />
                    )
                }
                <View className='hidden lg:block'>
                    {menu_sidebar_items.map(
                        (item, index) =>
                            <MenuItemSidebarWithWrapper key={`menu-${index}`} icon = {item.icon} link={item.link} title={t(item.title)} index={index} userUrl={currentUser.url}/>  
                    )}
                </View>
            </View>
            {blocks.map((block, index) => {
                                    return <BlockByUrl url={`/api.php?r=${block.name}`} />
                                })}
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

    return (
        <View className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
            <Row className='w-full flex-col lg:flex-row-reverse  lg:min-h-screen '>
                <View className='lg:w-[calc(100%-20rem)] border-x border-bdr dark:border-bdr-d  w-full '>
                    {props.children}
                </View>
                <View className='w-80'>
                    <Redirect ref={redirectdRef} />
                    <ScrollView contentContainerStyle={{ width: '100%' }}
                        className={"dark:border-bdrnavbar-d bg-card border-b border-bdrnavbar lg:bg-transparent lg:border-none lg:shadow-none fixed w-full lg:w-80 top-0 items-start lg:h-screen" + (!headerSettings.header ? ' hidden lg:flex' : '')}>
                        <View className=' flex-row lg:flex-col  h-16 lg:h-auto items-center lg:items-start' >
                            <View className=' justify-between  lg:h-screen flex-auto '>
                                <SideBar headerSettings={headerSettings} context={props.context} currentUser={currentUser} uri={props.uri} bSearch={bSearch} showMenu={showMenu} menuPopup={menuPopup} setMenuPopup={setMenuPopup} />
                                
                                <View className='hidden lg:flex flex-col flex-auto justify-between h-full'>
                                    <SidebarBottomToolbar
                                        currentUser={currentUser}
                                        menu_add_items={menu_add_items}
                                        buttonProps={buttonProps}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Row>
        </View>

    )
}
