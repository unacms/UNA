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
import ScrollList from 'app/ui/molecules/scroll_list'
import Splash from 'app/ui/molecules/splash'
import { callFn } from 'app/lib/functions/call';
import Map from 'app/components/elements/map';

export default function (props) {

    const isWeb = Platform.OS == 'web'  
    if (appSetting('config', 'show_ui')) {
        return <UI />
    }

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
       return <Splash {...props} />

        return (<ScrollList
            refer={refer}
            content = {content}
            pageData = {props.data}
            headerHeight = {isWeb ? 0 : 70}
            contentType="ScrollList"
        />)
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

            <ScrollView
                horizontal={true}
                className=" px-2 sm:px-3 w-full "
            >
                <Row
                    className={`  ${feedList.length > 1
                        ? 'my-2.5'
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
                                        unitMode == ''
                                            ? 'secondary'
                                            : 'primary'
                                    }
                                    size="sm"
                                    onPress={() => {
                                        setUnitModeEx('')
                                    }}
                                />
                                <Button
                                    startDecorator="List"
                                    rounded
                                    tooltip={t('Short')}
                                    variant={
                                        unitMode == 'small'
                                            ? 'link'
                                            : 'text'
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

        return (
            <View
                className={
                    appSetting('layout', 'max_width') +
                    ' mx-auto w-full flex-auto relative flex-row lg:pt-0 '
                }
            >
                {getLayout(currentUser) == 'hor' && (
                    <View className="hidden relative xl:flex w-80 ">
                        <View className="fixed-process fixed w-80 px-3 py-2  web:duration-200">
                            {/* {appSetting('layout', 'sidebar_search') && (
                                <View className="pb-3 w-full">
                                    <Search type="input" placeholder="Enter search text" />
                                </View>
                            )} */}
                            {appSetting('layout', 'show_profile_info') && (
                                <View className="py-2 mb-2 border-b border-bdr dark:border-bdr-d">
                                <Link href={currentUser.url} emulate={true}>
                                    <Row
                                        className={
                                            ' rounded-xl group items-center px-2 gap-x-3 h-12 hover:bg-bgritem dark:hover:bg-bgritem-d  active:bg-bgritem-h dark:active:bg-bgritem-dh  '
                                        }
                                    >
                                        
                                           
                                                <Profile
                                                    {...currentUser}
                                                    url_avatar={currentUser.avatar}
                                                    displayType="unit_wo_info"
                                                    displaySize="sm"
                                                />
                                                <View className="flex-col">
                                                <Text className=" text-base leading-5  flex-auto my-auto font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white web:duration-200">
                                                    {currentUser.display_name}
                                                </Text>
                                                <Text className=" text-xs leading-4 flex-auto my-auto truncate text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 web:duration-200">
                                                    {
                                                        currentUser.membership_name
                                                    }
                                                </Text>
                                            </View>
                                        
                                    </Row>
                                </Link>
                                </View>
                            )}

                            <View
                                className=' pb-2 mb-2 border-b border-bdr dark:border-bdr-d gap-y-0.5'
                            >
                                {feedList.length > 1 &&
                                    feedList.map((item, index) => {
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
                    </View>
                )}

                
                    
                    <View className="relative flex-auto mx-auto sm:px-3 web:py-3 sm:py-4 max-w-3xl">
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
                                                    scrollProps: { pageData: props.data, headerHeight: isFeedMenuPresent ? 120 : 48, subHeaderComponent: subHeader },
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
                            })}
                    </View>

                    

                

                    <View className="hidden lg:flex w-80 ">
                        <View className="fixed-process p-3 flex-col sm:py-4 gap-y-6  web:duration-300">
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
                        </View>
                    </View>
            </View>
        )
    }
}