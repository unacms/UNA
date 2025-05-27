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
import Splash from 'app/ui/molecules/splash'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import UI from 'app/ui/molecules/ui'
import { MenuItemSidebarWithWrapper } from 'app/components/nav/menu-item-sidebar'
import Search from 'app/ui/molecules/search'
import { Platform } from 'react-native'
import { useRef } from 'react';
import { getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import Animated from 'react-native-reanimated';

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
        console.log('modemode', mode)
    }
    const refer = useRef();

    if (!currentUser) {
        if (!isWeb)
            return <Splash {...props} />
        else {
            const content = (
                <Animated.ScrollView ref={refer} className={getPageWidth(props.uri, props.data.config) + '  mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                   <Splash {...props} />
                </Animated.ScrollView>
            );
        
            return (<ScrollList 
                refer={refer}
                content = {content}
                pageData = {props.data}
                headerHeight = {0}
                contentType="ScrollList"
            />)
        }
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
                className=" w-full border-b border-bdrnavbar dark:border-bdrnavbar-d shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,1)] bg-bgrnavbar dark:bg-bgrnavbar-d overflow-y-visible sm:justify-center "
            >
                <Row
                    className={`  rounded-full mx-3 sm:mx-auto ${feedList.length > 1
                        ? 'my-2 lg:my-4'
                        : ''
                        }  gap-x-1 sm:gap-x-2  `}
                >
                    {feedList.length > 1 &&
                        feedList.map((item, index) => {
                            return (
                                <View key={'row_' + index}>
                                    <Button
                                        key={
                                            'row_' +
                                            index +
                                            (feedType ==
                                                item.name)
                                        }
                                        startDecorator={
                                            item.icon
                                        }
                                        title={
                                            item.showTitle
                                                ? t(item.title)
                                                : ''
                                        }
                                        variant={
                                            feedType ==
                                                item.name
                                                ? 'text'
                                                : 'text'
                                        }
                                        pressed={feedType == item.name}
                                        rounded
                                        size="sm"
                                        onPress={() => {
                                            setFeedTypeEx(
                                                item.name
                                            )
                                        }}
                                    />
                                </View>
                            )
                        })}
                    {appSetting(
                        'feed',
                        'show_selector_view'
                    ) && (
                            <Row className="flex-auto gap-x-1 pb-2 sm:pb-4 flex-auto items-end justify-end">
                                <Button
                                    startDecorator="Rows"
                                    tooltip={t('Full')}
                                    rounded
                                    variant={
                                        unitMode == ''
                                            ? 'link'
                                            : 'text'
                                    }
                                    size="sm"
                                    onPress={() => {
                                        setUnitModeEx('')
                                    }}
                                />
                                <Button
                                    startDecorator="ListBullets"
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
                    ' max-w-[1920px] mx-auto w-full flex-auto relative flex-row lg:pt-0 '
                }
            >
                {getLayout(currentUser) == 'hor' && (
                    <View className="hidden relative xl:flex w-[360px] ">
                        <View className="fixed-process fixed w-[360px] p-[8px] gap-x-[8px] duration-200">
                            {appSetting('layout', 'sidebar_search') && (
                                <View className="p-2">
                                    <Search type="input" placeholder="Enter search text" />
                                </View>
                            )}
                            {appSetting('layout', 'show_profile_info') && (
                                <Link href={currentUser.url} emulate={true}>
                                    <Row
                                        className={
                                            ' rounded-[12px] group items-center p-[6px] mb-[2px] justify-between hover:bg-bgrbutton dark:hover:bg-bgrbutton-d  active:bg-bgrbutton-h dark:active:bg-bgrbutton-dh  '
                                        }
                                    >
                                        <Row className="flex-row items-center">
                                            <View className="px-[2px]">
                                                <Profile
                                                    {...currentUser}
                                                    url_avatar={currentUser.avatar}
                                                    displayType="unit_wo_info"
                                                    displaySize="sm"
                                                /></View>
                                            <View className="flex-col pl-[8px] gap-y-[2px]">
                                                <Text className=" text-sm leading-[18px] flex-auto my-auto font-semibold truncate text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white duration-200">
                                                    {currentUser.display_name}
                                                </Text>
                                                <Text className=" text-xs leading-[16px] leading-none flex-auto my-auto truncate text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 duration-200">
                                                    {
                                                        currentUser.membership_name
                                                    }
                                                </Text>
                                            </View>
                                        </Row>
                                    </Row>
                                </Link>
                            )}

                            <View
                                className=' pb-2 mb-2 border-b border-bdr dark:border-bdr-d gap-y-[2px]'
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

                <View className="flex-auto w-full sm:px-4">
                    <View className=" w-full mx-auto max-w-2xl ">
                        <View className={`relative w-full mx-auto max-w-2xl ${feedList.length > 1 ? '' : 'sm:mt-3'} `}>
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
                                                    scrollProps: { pageData: props.data, headerHeight: isFeedMenuPresent ? 129 : 48, subHeaderComponent: subHeader },
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

                    </View>

                </View>

                <View className="hidden lg:flex w-[360px] ">
                    <View className=" fixed-process w-[360px] py-[16px] flex-col gap-y-[16px] duration-200">
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
