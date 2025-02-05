import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useEffect } from 'react'
import {
    appSetting,
    storageSet,
    storageGet,
    getLayout,
    LAYOUT_BREAKPOINTS,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { Button } from 'app/design/controls'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import Image from 'app/ui/atoms/image'
import ProfileSwitcher from 'app/components/elements/profile_switcher'
import Splash from 'app/ui/molecules/splash'
import { Platform } from 'react-native'

function SplashBlock(props) {
    if (appSetting('layout', 'splash_block') == 'image') {
        let url = '/splash.webp'
        return (
            <Image
                sizes={LAYOUT_BREAKPOINTS.lg}
                view="cover"
                className="u-cover"
                src={url}
            />
        )
    }

    if (appSetting('layout', 'splash_block') == 'login') {
        return <BlockByName name={props.blocks.login} data={props.data} />
    }

    if (appSetting('layout', 'splash_block') == 'signup') {
        return <BlockByName name={props.blocks.signup} data={props.data} />
    }

    return <></>
}

export default function (props) {
    const { t } = useTranslation()
    const isWeb = Platform.OS == 'web';
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
        console.log("modemode", mode)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!currentUser) setRenderBlock(true)
        }, 250)

        return () => clearTimeout(timer) // This will clear the timer when the component is unmounted.
    }, [])

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

    if (!currentUser && renderBlock) {
        const p = {
            blocks: props.blocks,
            data: props.data,
            block: SplashBlock(props),
        }
        return (
            <ScrollView>
                <View
                    className={
                        appSetting('layout', 'theme') + ' mx-auto w-full'
                    }
                >
                    <Splash {...p} />
                </View>
            </ScrollView>
        )
    }
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('dashboard', 'url')

        return (
            <View
                className={
                    appSetting('layout', 'max_width') +
                    ' max-w-[1920px] mx-auto w-full flex-auto relative flex-row '
                }
            >
                {getLayout(currentUser) == 'hor' && (
                    <View className="hidden xl:flex w-96 ">
                        <View className="fixed fixed-process w-96 flex-col p-2 gap-y-0.5">
                            {appSetting('layout', 'show_profile_info') && (
                                <ProfileSwitcher
                                    hideTitle={true}
                                    useDefault={true}
                                />
                            )}

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

                <View className="flex-auto w-full lg:w-auto sm:px-4 xl:px-2 ">
                    
                        <View className=" w-full mx-auto lg:max-w-2xl relative ">
                            <View className="bg-bgrnavbar dark:bg-bgrnavbar-d sm:bg-transparent border-b border-bdrcard dark:border-bdrcard-d shadow-sm sm:shadow-none sm:border-none">
                            <ScrollView
                                horizontal={true}
                                className="  max-w-2xl mx-auto w-full overflow-y-visible  "
                            >
                                <Row
                                    className={`  rounded-full mx-3 sm:mx-4 ${
                                        feedList.length > 1
                                            ? 'my-2 lg:my-4'
                                            : ''
                                    }  gap-x-1 sm:gap-x-2  `}
                                >
                                        {feedList.length > 1 &&
                                            feedList.map((item, index) => {
                                                return (
                                                    <View key={'row_' + index}>
                                                        <Button
                                                            key={'row_' + index+(feedType == item.name)}
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
                                                                    ? 'primary'
                                                                    : 'text'
                                                            }
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
                            </View>
                            <View className={`relative w-full mx-auto max-w-2xl ${ feedList.length > 1 ? '' : 'sm:mt-3'} `}>
                                {feedList.map((item, index) => {
                                    if (feedType == item.name) {
                                        return (
                                            <View key={'view' + index}>
                                                {isWeb && topBlocks.map(
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
                                                                {...item.block
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
                                                            item.name + '_feed'
                                                        ]
                                                    }
                                                    unitMode={unitMode}
                                                    exProps={!isWeb && {addBlocks:topBlocks, addBlocksData:props.data}}
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
                <View className="hidden lg:flex w-96 ">
                    <View className="fixed fixed-process w-full  max-w-96 p-2 flex-col space-y-4 duration-200">
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
