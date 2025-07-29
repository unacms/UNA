import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useEffect } from 'react'
import {
    appSetting,
    storageSet,
    storageGet,
    getLayout,
    asyncStorageSet,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { Button } from 'app/design/controls'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import UI from 'app/ui/molecules/ui'
import { MenuItemSidebarWithWrapper } from 'app/components/nav/menu-item-sidebar'
import { Platform } from 'react-native'
import { useRef } from 'react';
import { callFn } from 'app/lib/functions/call';
import { getComponent } from 'app/components/registry'
import { Panel, PanelGroup, PanelHandler, isShowColumn } from "app/ui/molecules/resizable-panels";
import { useWindowDimensions } from 'react-native';
import ThemeCompatibilityTest from 'app/ui/molecules/nativewindui';
import * as SwitchPrimitive from '@rn-primitives/switch';
import * as TabsPrimitive from '@rn-primitives/tabs';
import { Switch } from 'app/design/controls'
import { useLayoutSettings } from 'app/context/layout-settings';

function Example() {
  const [value, setValue] = React.useState('account');
   const [isActive, setIsActive] = useState(false);
   const [checked, setChecked] = React.useState(false);
  return (
    <>
    <Switch
    size=""
                    onValueChange={setChecked}
                    value={checked}
                />
   
    <TabsPrimitive.Root
      value={value}
      onValueChange={setValue}
      className='w-full max-w-[400px] mx-auto flex-col gap-1.5'
    >
      <TabsPrimitive.List  className='flex-row w-full'>
        <TabsPrimitive.Trigger value='account' 
        className="
    px-4 py-2 text-gray-500
    aria-selected:text-blue-600
    aria-selected:border-b-2
    aria-selected:border-blue-600
  "
        >
          <Text>Account</Text>
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger value='password' 
             className="
    px-4 py-2 text-gray-500
    aria-selected:text-blue-600
    aria-selected:border-b-2
    aria-selected:border-blue-600
  "
        >
          <Text>Password</Text>
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>
      <TabsPrimitive.Content value='account'>
        <Text>Account content</Text>
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value='password'>
        <Text>Password content</Text>
      </TabsPrimitive.Content>
    </TabsPrimitive.Root></>
  );
}

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

export default function (props) {
   // return <Example/>
    const { width: windowWidth } = useWindowDimensions();
    const isWeb = Platform.OS == 'web'
    if (appSetting('config', 'show_ui')) {
        return <UI />
    }

    const { layoutName } = useLayoutSettings();
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const feedMode = storageGet('feed:mode', '', true)
    const feedTypeD = storageGet('feed:type', '', true)

    const [feedType, setFeedType] = useState(
        feedTypeD ? feedTypeD : appSetting('feed', 'default_feed')
    )

    const feedList = appSetting('feed', 'list')

    const [unitMode, setUnitMode] = useState(
        feedMode ? feedMode : appSetting('feed', 'default_view')
    )

    function setUnitModeEx(mode) {
        storageSet('feed:mode', '', mode, true)
        setUnitMode(mode)
    }

    function setFeedTypeEx(mode) {
        storageSet('feed:type', '', mode, true)
        setFeedType(mode)
    }
    const refer = useRef();

    if (!currentUser) {
        const Splash = getComponent('molecule', 'splash')
        return <Splash {...props} />
    }

    const sideBarBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].sidebar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    const topBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].topbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    const navBarBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].leftbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    useEffect(() => {
        if (isWeb) {
            window.dispatchEvent(new Event('resize_panel'));
        }
    }, [windowWidth]);

    if (currentUser) {
        asyncStorageSet('layout:visited', 'true')
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')

        const headerBlocks = (
            <>
                {topBlocks?.map((item, index) => {
                    return (
                        <BlockByName
                            key={'block_' + index}
                            name={item.block}
                            data={props.data}
                            {...item.block.props}
                        />
                    )
                })}
            </>
        )

        const subHeader = (
            <ScrollView horizontal={true} className=" px-2 sm:px-3 w-full ">
                <Row
                    className={`  ${feedList.length > 1
                        ? 'my-1'
                        : ''
                        }    `}
                >
                    {feedList.length > 1 &&
                        feedList.map((item, index) => {
                            return (
                                <View key={'row_' + index}>
                                    {callFn('getButtonForConductorHor', [item.icon, item.showTitle ? t(item.title) : '', feedType == item.name, null, () => {
                                        setFeedTypeEx(
                                            item.name
                                        )
                                    }])}
                                </View>
                            )
                        })}
                    {appSetting(
                        'feed',
                        'show_selector_view'
                    ) && (
                            <Row className="flex-auto gap-x-1  flex-auto items-end justify-end">
                                <Button
                                    startDecorator="Rows"
                                    tooltip={t('Full')}
                                    rounded
                                    ring="p-1"
                                    variant={
                                        unitMode !== 'small'
                                            ? 'primary'
                                            : 'secondary'
                                    }
                                    size="sm"
                                    onPress={() => {
                                        setUnitModeEx('')
                                    }}
                                />
                                <Button
                                    startDecorator="List"
                                    rounded
                                    ring="p-1"
                                    tooltip={t('Short')}
                                    variant={
                                        unitMode == 'small'
                                            ? 'primary'
                                            : 'secondary'
                                    }
                                    size="sm"
                                    onPress={() => {
                                        setUnitModeEx('small')
                                    }}
                                />
                            </Row>
                        )}
                </Row>
            </ScrollView>
        )

        const isFeedMenuPresent = feedList.length > 1 || appSetting('feed', 'show_selector_view')

        const FeedContent = <>{layoutName == 'ver' && <View className={`hidden ${TABLET_MODE_FROM}:flex`}>{subHeader}</View>}
            {feedList.map((item, index) => {
                if (feedType == item.name) {
                    return (
                        <View key={'view' + index}>
                            <BlockByName
                                data={props.data}
                                name={
                                    props.blocks[
                                    item.name + '_feed_form'
                                    ]
                                }
                            />
                            <BlockByName
                                data={props.data}
                                name={
                                    props.blocks[
                                    item.name + '_feed'
                                    ]
                                }
                                unitMode={unitMode}
                                exProps={{
                                    headerBlocks: headerBlocks,
                                    scrollProps: { pageData: props.data, headerHeight: isFeedMenuPresent ? 120 : 68, subHeaderComponent: subHeader },
                                }}
                            />
                        </View>
                    )
                }
                return (
                    <React.Fragment
                        key={'empty_' + index}
                    ></React.Fragment>
                )
            })}</>

        const AsideContent = <>{sideBarBlocks.map((item, index) => {
            return (
                <BlockByName
                    key={'block_' + index}
                    name={item.block}
                    data={props.data}
                    {...item.block.props}
                />
            )
        })}</>

        const SideBarContent = <>{/* {appSetting('layout', 'sidebar_search') && (
                                <View className="pb-3 w-full">
                                    <Search type="input" placeholder="Enter search text" />
                                </View>
                            )} */}
            <View className={appSetting('layout', 'sidebar_container')}>
                {appSetting('layout', 'show_profile_info') && (
                    <View className="pb-1 mb-1 border-b border-bdr dark:border-bdr-d">
                        <Link href={currentUser.url} emulate={true}>
                            <Row
                                className={
                                    ' rounded-xl group items-center px-1  hover:bg-bgritem dark:hover:bg-bgritem-d  active:bg-bgritem-h dark:active:bg-bgritem-dh  '
                                }
                            >
                                <View className="p-1.5">

                                    <Profile
                                        {...currentUser}
                                        url_avatar={currentUser.avatar}
                                        displayType="unit_wo_info"
                                        displaySize="sm"
                                    /></View>

                                <View className="flex-col px-1.5">
                                    <Text className=" text-sm leading-tight  flex-auto my-auto font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white web:duration-200">
                                        {currentUser.display_name}
                                    </Text>
                                    <Text className=" text-xs leading-tight flex-auto my-auto truncate text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 web:duration-200">
                                        {
                                            currentUser.membership_name
                                        }
                                    </Text>
                                </View>

                            </Row>
                        </Link>
                    </View>
                )}


                {feedList.length > 1 && <View
                    className=' pb-1 mb-1 border-b border-bdrnavbar dark:border-bdrnavbar-d gap-y-0.5'
                >

                    {feedList.map((item, index) => {
                        return (
                            <MenuItemSidebarWithWrapper
                                key={`menu-${index}`}
                                onPress={() => {
                                    setFeedTypeEx(item.name)
                                }}
                                isActive={feedType == item.name}
                                icon={item.icon}
                                title={t(item.title)}
                                index={index}
                                userUrl={currentUser.url}
                            />
                        )
                    })}
                </View>
                }

                {navBarBlocks.map((item, index) => {
                    return (
                        <View
                            className="mb-3 "
                            key={'block_' + index}
                        >
                            <BlockByName
                                name={item.block}
                                data={props.data}
                                {...item.block.props}
                            />
                        </View>
                    )
                })}
            </View>
        </>



        const cellsCustomConfig = appSetting('layouts', 'home');

        //if (cellsCustomConfig?.adjustable) {
        return (
            <PanelGroup
                autoSaveId={`cells-home`}
                direction="horizontal"
                className={`${appSetting('layout', 'max_width')} mx-auto w-full flex-auto relative sm:px-lg flex-row`}
                onLayout={(e) => {
                    if (isWeb) {
                        window.dispatchEvent(new Event('resize_panel'));
                    }
                }}
            >
                {(layoutName == 'hor' && isWeb) && <>
                    <Panel className={`hidden ${cellsCustomConfig.cells?.left?.breakpoint}:block`} {...cellsCustomConfig.cells?.left} >
                        <View className='fixed-process p-3'>
                            {SideBarContent}
                        </View>
                    </Panel>
                    <PanelHandler gap="w-md" sizable={cellsCustomConfig.sizable} />
                </>}
                <Panel className="mx-auto w-full sm:p-md" {...cellsCustomConfig.cells?.center}>
                    
                        {FeedContent}
                    
                </Panel>

                {isWeb && <><PanelHandler gap="w-md" sizable={cellsCustomConfig.sizable} />
                <Panel className={`hidden ${cellsCustomConfig.cells?.right?.breakpoint}:block`} {...cellsCustomConfig.cells?.right}>
                        <View className='fixed-process py-lg p '>
                        {AsideContent}
                        </View>
                    
                </Panel></>}
            </PanelGroup>
        )
       
    }
}