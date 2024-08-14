import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useEffect } from 'react'
import {
    appSetting,
    storageSet,
    storageGet,
    getLayout,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { Button } from 'app/design/controls'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import Image from 'app/ui/atoms/image'
import ProfileSwitcher from 'app/components/elements/profile_switcher';

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

export default function (props) {
    const { t } = useTranslation()

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
        let p = {
            blocks: props.blocks,
            data: props.data,
            block: SplashBlock(props),
        }
        return (
        <ScrollView>
            <View
                className={
                    appSetting('layout', 'theme') +
                    ' mx-auto w-full'
                }
            >
                {appStatic('components_splash', p)}
            </View>
        </ScrollView>);

    }
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')


        return (
            <View
                className={
                    appSetting('layout', 'max_width') + ' mx-auto w-full'
                }
            >
                <View className="flex-auto  relative w-full flex-row mx-auto ">
                    {getLayout(currentUser) == 'hor' && (
                        <View className="hidden xl:block w-80 duration-300 border-r border-bdr dark:border-bdr-d  ">
                            <View className="fixed fixed-process w-80">
                                {appSetting(
                                    'layout',
                                    'show_profile_info'
                                ) && (
                                        <View className="px-4 pt-3 pb-1">
                                            <ProfileSwitcher hideTitle={true} useDefault={true} />
                                        </View>
                                    )}
                                <View className="flex-auto px-4 w-full">
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
                            <View className=" w-full mx-auto max-w-3xl">
                                <ScrollView horizontal={true} className="w-full ">
                                <Row className="px-3 sm:px-4 pt-2 sm:pt-4 mx-auto gap-x-2  w-full ">
                                    {feedList.length > 1 &&
                                        feedList.map((item, index) => {
                                            return (
                                                <Row key={'row_' + index} className="flex-none items-start justify-start  gap-x-1 pb-2 sm:pb-4 ">

                                                  
                                                        <Button
                                                            fullWidth={true}
                                                            tooltip={t(
                                                                item.title
                                                            )}
                                                            startDecorator={
                                                                item.icon
                                                            }
                                                            title={item.showTitle ? t(item.title) : ''}
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
                                </ScrollView>
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
