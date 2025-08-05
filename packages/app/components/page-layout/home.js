import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useEffect } from 'react'
import {
    cd,
    appSetting,
    storageSet,
    storageGet,
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
import { useRef } from 'react'
import { callFn } from 'app/lib/functions/call'
import { getComponent } from 'app/components/registry'
import {
    Panel,
    PanelGroup,
    PanelHandler,
} from 'app/ui/molecules/resizable-panels'
import { useWindowDimensions } from 'react-native'
import { useLayoutSettings } from 'app/context/layout-settings'
import { Icon } from 'app/ui/atoms/icon'
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')


export default function (props) {
   // return <><Text className="text-red-500 text-3xl" >zcxzxc zx</Text><Text fontFamily="font-title" className="text-red-500 text-3xl" >zcxzxc zx</Text></>
   // return <Loading/>
    /*return (
    <Text className="text-red-500">zcxzxc zxc<Icon className="text-red-500 " icon="Plus"></Icon></Text>
    <Button startDecorator="Plus" title="fdfdsf" variant="badge"></Button>
     <Button startDecorator="Plus" variant="badge" title="fdfdsf"></Button>
</>
    )*/
    const { width: windowWidth } = useWindowDimensions()
    const isWeb = Platform.OS == 'web'
    if (appSetting('config', 'show_ui')) {
        return <UI />
    }

    const { layoutName } = useLayoutSettings()
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
    const refer = useRef()

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
            window.dispatchEvent(new Event('resize_panel'))
        }
    }, [windowWidth])

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
                            contentOnly={true}
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
            <Row>
            <ScrollView horizontal={true} className=" px-2 w-full  ">
                <Row
                    className={`  ${
                        feedList.length > 1 ? ' mb-2 ' : ''
                    }    `}
                >
                    {feedList.length > 1 &&
                        feedList.map((item, index) => {
                            return (
                                <View key={'row_' + index}>
                                    {callFn('getButtonForConductorHor', [
                                        item.icon,
                                        item.showTitle ? t(item.title) : '',
                                        feedType == item.name,
                                        null,
                                        () => {
                                            setFeedTypeEx(item.name)
                                        },
                                    ])}
                                </View>
                            )
                        })}
                    
                </Row>
              
            </ScrollView>
              {appSetting('feed', 'show_selector_view') && (
                <Row className="flex-auto mb-2 px-2 gap-0.5 flex-none items-end justify-end">
                    <Button
                        startDecorator="Rows"
                        tooltip={t('Full')}
                        ring="p-1"
                        rounded
                        variant={
                            unitMode !== 'small'
                                ? 'default'
                                : 'secondary'
                        }
                        size="base"
                        onPress={() => {
                            setUnitModeEx('')
                        }}
                    />
                    <Button
                        startDecorator="List"
                        
                        ring="p-1"
                        tooltip={t('Short')}
                        rounded
                        variant={
                            unitMode == 'small'
                                ? 'default'
                                : 'secondary'
                        }
                        size="base"
                        onPress={() => {
                            setUnitModeEx('small')
                        }}
                    />
                </Row>
            )}</Row>
        )

        const isFeedMenuPresent =
            feedList.length > 1 || appSetting('feed', 'show_selector_view')

        const FeedContent = (
            <>
                {layoutName == 'ver' && (
                    <View className={`hidden ${TABLET_MODE_FROM}:flex`}>
                        {subHeader}
                    </View>
                )}
                {feedList.map((item, index) => {
                    if (feedType == item.name) {
                        return (
                            <View className='' key={'view' + index}>
                                <BlockByName
                                    data={props.data}
                                    contentOnly={true}
                                    name={
                                        props.blocks[item.name + '_feed_form']
                                    }
                                />
                                <BlockByName
                                    data={props.data}
                                    name={props.blocks[item.name + '_feed']}
                                    contentOnly={true}
                                    unitMode={unitMode}
                                    exProps={{
                                        headerBlocks: headerBlocks,
                                        scrollProps: {
                                            pageData: props.data,
                                            headerHeight: isFeedMenuPresent
                                                ? 120
                                                : 68,
                                            subHeaderComponent: subHeader,
                                        },
                                    }}
                                />
                            </View>
                        )
                    }
                    return (
                        <React.Fragment key={'empty_' + index}></React.Fragment>
                    )
                })}
            </>
        )

        const AsideContent = (
            <>
                {sideBarBlocks.map((item, index) => {
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

        const SideBarContent = (
            <>
                <View>
                    {appSetting('layout', 'show_profile_info') && (
                        <View className="pb-1 mb-1 border-b border-border ">
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
                                        />
                                    </View>

                                    <View className="flex-col px-1.5">
                                        <Text className=" text-sm leading-tight  flex-auto my-auto font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white web:duration-200">
                                            {currentUser.display_name}
                                        </Text>
                                        <Text className=" text-xs leading-tight flex-auto my-auto truncate text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 web:duration-200">
                                            {currentUser.membership_name}
                                        </Text>
                                    </View>
                                </Row>
                            </Link>
                        </View>
                    )}

                    {feedList.length > 1 && (
                        <View className=" pb-1 mb-1 border-b border-border/20 gap-y-0.5">
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
                    )}

                    {navBarBlocks.map((item, index) => {
                        return (
                            <View className="mb-3 " key={'block_' + index}>
                                <BlockByName
                                    contentOnly={true}
                                    name={item.block}
                                    data={props.data}
                                    {...item.block.props}
                                />
                            </View>
                        )
                    })}
                </View>
            </>
        )

        const cellsCustomConfig = appSetting('layouts', 'home')

        //if (cellsCustomConfig?.adjustable) {
        return (
            <PanelGroup
                autoSaveId={`cells-home`}
                direction="horizontal"
                className={`${appSetting(
                    'layout',
                    'max_width'
                )} mx-auto w-full flex-auto relative flex-row`}
                onLayout={(e) => {
                    if (isWeb) {
                        requestAnimationFrame(() => {
                            document.body.offsetHeight
                            window.dispatchEvent(new Event('resize_panel'))
                        })
                    }
                }}
            >
                {layoutName == 'hor' && isWeb && (
                    <>
                        <Panel
                            className={`hidden ${cellsCustomConfig.cells?.left?.breakpoint}:block`}
                            {...cellsCustomConfig.cells?.left}
                        >
                            <View className={`${cd('p-md')} fixed-process`}>
                                {SideBarContent}
                            </View>
                        </Panel>
                        <PanelHandler
                            gap="hidden xl:block"
                            sizable={cellsCustomConfig.sizable}
                        />
                    </>
                )}
                <Panel {...cellsCustomConfig.cells?.center}>
                    <View className={`lg:p-4`}>{FeedContent}</View>
                </Panel>

                {isWeb && (
                    <>
                        <PanelHandler
                            gap="hidden lg:block"
                            sizable={cellsCustomConfig.sizable}
                        />
                        <Panel
                            className={`hidden ${cellsCustomConfig.cells?.right?.breakpoint}:block`}
                            {...cellsCustomConfig.cells?.right}
                        >
                            <View className={`${cd('p-md')} fixed-process`}>
                                {AsideContent}
                            </View>
                        </Panel>
                    </>
                )}
            </PanelGroup>
        )
    }
}
