import { View, Row, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState } from 'react'
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
import { callFn } from 'app/lib/functions/call'
import { getComponent } from 'app/components/registry'
import {
    Panel,
    PanelGroup,
    PanelHandler,
} from 'app/ui/molecules/resizable-panels'
import { useLayoutSettings } from 'app/context/layout-settings'
import Badge from 'app/ui/molecules/badge'
import { useBreakpoint, useWindowSize, useIsDesktop, useWindowHeight, useWindowWidth } from 'app/context/measure';

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

export default function (props) {
    
   /* const wh = useWindowWidth();
    console.log("whwhwh", wh)
    return
   /*   const currentBreakpoint = useBreakpoint();
     const isDesktop = useIsDesktop();
     // const windowSize = useWindowSize();
      //console.log("!!!!!!!useWindowSize ", windowSize )
         console.log("!!!!!!!bucket ", currentBreakpoint )
return;*/
    //  return <Button variant="accent" title="dfsdfsd" startDecorator="Plus"></Button>
    // return <><Text className="text-red-500 text-3xl" >zcxzxc zx</Text><Text fontFamily="font-title" className="text-red-500 text-3xl" >zcxzxc zx</Text></>
    // return <Loading/>
    /*return (
    <Text className="text-red-500">zcxzxc zxc<Icon className="text-red-500 " icon="Plus"></Icon></Text>
    <Button startDecorator="Plus" title="fdfdsf" variant="badge"></Button>
     <Button startDecorator="Plus" variant="badge" title="fdfdsf"></Button>
</>
    )*/
    const isWeb = Platform.OS == 'web'
    if (appSetting('config', 'show_ui')) {
        return <UI />
    }

    const { layoutName, layoutSettings } = useLayoutSettings()
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()

    const feedTypeD = storageGet('feed:type', '', true)

    const [feedType, setFeedType] = useState(
        feedTypeD ? feedTypeD : appSetting('feed', 'default_feed')
    )

    const feedList = appSetting('feed', 'list')

    function setFeedTypeEx(mode) {
        storageSet('feed:type', '', mode, true)
        setFeedType(mode)
    }


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

    const centerBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].center)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    const navBarBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].leftbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    /*useEffect(() => {
        if (isWeb) {
            window.dispatchEvent(new Event('resize_panel'))
        }
    }, [windowWidth])*/

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


        const BlocksCenter = <View className={`${appSetting('layout', 'max_width')} mx-auto w-full`}>
            {centerBlocks?.map((item, index) => {
                return (
                    <BlockByName
                        key={'block_' + index}
                        name={item.block}
                        data={props.data}
                        {...item.block.props}
                    />
                )
            })}</View>

        const subHeader = feedList.length > 1 && (
            <Row className=' items-center h-14 '>
                <ScrollView horizontal={true} className={`${cd('px-lg')} flex w-full scrollbar-hide`} >
                    <Row
                        className={`  ${feedList.length > 1 ? '  gap-2 ' : ''
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
            </Row>
        )

        const isFeedMenuPresent = feedList.length > 1 || appSetting('feed', 'show_selector_view')
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

                                    name={
                                        props.blocks[item.name + '_feed_form']
                                    }
                                />
                                <BlockByName
                                    data={props.data}
                                    name={props.blocks[item.name + '_feed']}
                                    unitMode={layoutSettings.feed_unit}
                                    exProps={{
                                        headerBlocks: headerBlocks,
                                        scrollProps: {
                                            pageData: props.data,
                                            headerHeight: isFeedMenuPresent
                                                ? 122
                                                : 56,
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
                            exProps={item.block}
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

                        <Link href={currentUser.url} emulate={true}>
                            <Row
                                className={
                                    ' rounded-xl group items-center gap-1 px-2 py-1.5 mb-0.5 hover:bg-muted/60 active:opacity-50  '
                                }
                            >
                                
                                    <Profile
                                        {...currentUser}
                                        url_avatar={currentUser.avatar}
                                        displayType="unit_wo_info"
                                        displaySize="sm"
                                    />
                                

                                <View >
                                    <Text className="px-1 text-sm leading-tight font-semibold truncate text-card-foreground web:group-hover:text-foreground ">
                                        {currentUser.display_name}
                                    </Text>
                                    <Badge size="xs" variant="default" iconOnly data={{ text: currentUser.membership_name }} />
                                </View>
                            </Row>
                        </Link>

                    )}

                    {feedList.length > 1 && (
                        <View className=" pb-1 mb-1 border-b border-input gap-y-0.5">
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
                            <View className="mt-3 " key={'block_' + index}>
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
        )

        const cellsCustomConfig = appSetting('layouts', 'home') || appSetting('layouts', 'cols-l-c-r')
        return (
            <>{BlocksCenter}
                <PanelGroup
                    autoSaveId={`cells-home`}
                    direction="horizontal"
                    className={`${appSetting('layout', 'max_width')} mx-auto w-full flex-auto relative flex-row`}
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
                                <View className=" px-2 py-3 fixed-process ">
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
                        <View className={`sm:${cd('p-md')} max-w-3xl mx-auto`}>{FeedContent}</View>
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
                                <View className={`${cd('p-md')} ${cd('gap-lg')} fixed-process`}>
                                    {AsideContent}
                                </View>
                            </Panel>
                        </>
                    )}
                </PanelGroup></>
        )
    }
}
