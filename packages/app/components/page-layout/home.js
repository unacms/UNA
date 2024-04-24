import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import {
    appSetting,
    filterContent,
    storageSet,
    storageGet,
    getLayout,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { Conductor } from 'app/ui/molecules/conductor'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile'
import Link from 'app/ui/atoms/link'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'

import Image from 'app/ui/atoms/image'

export default function PageLayout(props) {
    const { t } = useTranslation()

    const isWeb = Platform.OS == 'web'
    const [isDesktop, setIsDesktop] = useState(false)
    const [renderBlock, setRenderBlock] = useState(false)
    let { currentUser, setCurrentUser } = useCurrentUser()
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

    useEffect(() => {
        if (isWeb) {
            const handleResize = () => {
                setIsDesktop(window.innerWidth > 768)
            }

            window.addEventListener('resize', handleResize)
            handleResize()

            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!currentUser) setRenderBlock(true)
        }, 100)

        return () => clearTimeout(timer) // This will clear the timer when the component is unmounted.
    }, [])

    function SplashBlock(props) {
        if (appSetting('layout', 'block') == 'image') {
            let url = '/splash.webp'
            return (
                <Image
                    sizes="1024px"
                    view="cover"
                    className="u-cover"
                    src={url}
                />
            )
        }

        if (appSetting('layout', 'block') == 'login') {
            return <BlockByName name={props.blocks.login} data={props.data} />
        }

        if (appSetting('layout', 'block') == 'signup') {
            return <BlockByName name={props.blocks.signup} data={props.data} />
        }

        return <></>
    }

    let sideBarBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].sidebar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    let topBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].topbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    let navBarBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].leftbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

    if (isWeb) {
        if (currentUser === null && renderBlock) {
            let p = {
                blocks: props.blocks,
                data: props.data,
                block: SplashBlock(props),
            }
            return (
                <View
                    className={
                        appSetting('layout', 'max_width') +
                        ' mx-auto w-full'
                    }
                >
                    {appStatic('components_splash', p)}
                    {getLayout(currentUser) == 'ver ' &&
                        appStatic('components_fullfooter', p)}
                </View>
            )
        }
        if (currentUser) {
            let dUser = Object.assign({}, currentUser)
            dUser.url_avatar = dUser.avatar
            dUser.url = appSetting('layout', 'dashboard')
            const profile = (
                <Profile
                    {...dUser}
                    displayType="unit_wo_info"
                    displaySize="sm"
                />
            )

            return (
                <View
                    className={
                        appSetting('layout', 'max_width') + ' mx-auto w-full'
                    }
                >
                    <View className="flex-auto  relative w-full flex-row mx-auto ">
                        {getLayout(currentUser) == 'hor' && (
                            <View className="hidden xl:block w-80 duration-200   ">
                                <View className="fixed fixed-process w-80">
                                    {appSetting(
                                        'layout',
                                        'show_profile_info'
                                    ) && (
                                        <View className="">
                                            {!!currentUser && (
                                            <Link href={appSetting('layout', 'dashboard')}>
                                                <Row className="items-center justify-between mx-2 my-3 px-3 py-1 rounded-xl hover:border-transparent border border-bdritem dark:border-bdritem-d cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50">
                                                    <Row className='flex-row gap-x-3 items-center'>
                                                            {profile}
                                                        
                                                        <Text className="text-base flex-auto my-auto font-semibold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                                            {currentUser.display_name}
                                                        </Text>
                                                    </Row><View className='flex-none '>
                                                        <Button
                                                        variant="text"
                                                        size="sm"
                                                        tooltip={t('Switch profile')}
                                                        startDecorator="UserSwitch"
                                                        fullWidth
                                                        align="right"
                                                    /></View></Row>
                                            </Link>
                                        )}
                                        </View>
                                        


                                    )}
                                    <View className="flex-auto px-2 w-full">
                                        {navBarBlocks.map((item, index) => {
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
                        )}

                        <View className="flex-auto w-full lg:w-auto flex-row  duration-200">
                            <View className="flex-auto  xl:mx-2">
                                <View className="flex-auto  w-full mx-auto">
                                    <Row className="px-3 sm:px-4 pt-2 sm:pt-4 max-w-3xl mx-auto gap-x-2  w-full">
                                        {feedList.length > 1 &&
                                            feedList.map((item, index) => {
                                                return (
                                                    <Row  key={'row_' + index} className="flex-none items-start justify-start  gap-x-1 pb-2 sm:pb-4 ">

                                                    <Pressable
                                                        key={'selector' + index}
                                                        className=" my-auto items-center"
                                                        onPress={() => {
                                                            setFeedTypeEx(
                                                                item.name
                                                            )
                                                        }}
                                                    >
                                                        <Button
                                                            fullWidth={true}
                                                            tooltip={t(
                                                                item.title
                                                            )}
                                                            startDecorator={
                                                                item.icon
                                                            }
                                                            variant={
                                                                feedType ==
                                                                item.name
                                                                    ? 'link'
                                                                    : 'text'
                                                            }
                                                            rounded
                                                            size="sm"
                                                        />
                                                    </Pressable>
                                                    </Row>
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
                                    <View className="relative w-full mx-auto max-w-3xl">
                                        {feedList.map((item, index) => {
                                            if (feedType == item.name) {
                                                return (
                                                    <View key={'view' + index}>
                                                        {topBlocks.map(
                                                            (item, index) => {
                                                                return (
                                                                    <BlockByName
                                                                        key={
                                                                            'block_' +
                                                                            index
                                                                        }
                                                                        name={
                                                                            item.block
                                                                        }
                                                                        data={
                                                                            props.data
                                                                        }
                                                                        {...item
                                                                            .block
                                                                            .props}
                                                                    />
                                                                )
                                                            }
                                                        )}
                                                        <BlockByName
                                                            data={props.data}
                                                            name={
                                                                props.blocks[
                                                                    item.name +
                                                                        '_feed_form'
                                                                ]
                                                            }
                                                        />
                                                        <BlockByName
                                                            data={props.data}
                                                            name={
                                                                props.blocks[
                                                                    item.name +
                                                                        '_feed'
                                                                ]
                                                            }
                                                            unitMode={unitMode}
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
                        </View>
                        <View className="hidden lg:block w-80 xl:w-96 ">
                            <View className="fixed-process w-80 xl:w-96 max-w-md  p-4 flex-col space-y-4 duration-200">
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
                </View>
            )
        }
    }

    let sect = [{ name: '', title: 'Top' }]

    const menuItems = sect.map((obj, index) => {
        const key = Object.keys(obj)[0]
        return {
            id: index + 1,
            name: obj.name,
            title: obj.title,
            link: 'home',
            icon: '',
        }
    })
    let blocks = appSetting('layouts', 'home').blocks
    let blocksForAdd = []
    if (blocks[feedType + '_feed_form']) {
        blocksForAdd.push(blocks[feedType + '_feed_form'].name)
    }
    if (blocks[feedType + '_feed']) {
        blocksForAdd.push(blocks[feedType + '_feed'].name)
    }
    topBlocks.map((item, index) => {
        blocksForAdd.push(item.block.name)
    })

    let dataForFeed = filterContent(props.data, blocksForAdd)

    let menu = {
        object: 'search',
        items: menuItems,
    }

    let p = {
        blocks: props.blocks,
        data: props.data,
        block: SplashBlock(props),
    }

    return (
        <View className="w-full ">
            {!currentUser && renderBlock && (
                <ScrollView>
                    <View
                        className={
                            appSetting('layout', 'theme') +
                            ' mx-auto w-full'
                        }
                    >
                        {appStatic('components_splash', p)}
                    </View>
                </ScrollView>
            )}
            {!!currentUser && (
                <>
                    <Row className="px-auto justify-center gap-x-1 bg-bgrtabbar dark:bg-bgrtabbar-d pl-2 pr-4">
                        {feedList.length > 1 &&
                            feedList.map((item, index) => {
                                return (
                                    <Pressable
                                        key={'selector' + index}
                                        className="items-center justify-center py-2.5 "
                                        onPress={() => {
                                            setFeedTypeEx(item.name)
                                        }}
                                    >
                                        <Button
                                            fullWidth={false}
                                            id="tab"
                                            startDecorator={item.icon}
                                            variant={
                                                feedType == item.name
                                                    ? 'outline'
                                                    : 'text'
                                            }
                                            size="sm"
                                        />
                                    </Pressable>
                                )
                            })}
                        {appSetting('feed', 'show_selector_view') && (
                            <Row className="flex-auto flex-auto justify-end">
                                <Pressable
                                    className="items-center justify-center py-2.5  "
                                    onPress={() => {
                                        setUnitModeEx('')
                                    }}
                                >
                                    <Button
                                        startDecorator="Rows"
                                        fullWidth={false}
                                        rounded
                                        variant={
                                            unitMode == '' ? 'link' : 'text'
                                        }
                                        size="sm"
                                    />
                                </Pressable>
                                <Pressable
                                    className="items-center justify-center py-2.5  "
                                    onPress={() => {
                                        setUnitModeEx('small')
                                    }}
                                >
                                    <Button
                                        startDecorator="ListBullets"
                                        fullWidth={false}
                                        rounded
                                        variant={
                                            unitMode == 'small'
                                                ? 'link'
                                                : 'text'
                                        }
                                        size="sm"
                                    />
                                </Pressable>
                            </Row>
                        )}
                    </Row>
                    {feedList.map((item, index) => {
                        if (feedType == item.name) {
                            return (
                                <View
                                    key={'view' + index}
                                    className="w-full h-full"
                                >
                                    <Conductor
                                        minHeaderHeight={0}
                                        isHideDefaultHeader={false}
                                        menu={menu}
                                        unitMode={unitMode}
                                        data={dataForFeed}
                                        blocks={props.blocks}
                                        skeleton="feed"
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
                </>
            )}
        </View>
    )
}
