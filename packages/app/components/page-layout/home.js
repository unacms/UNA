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

import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native';
import Image from 'app/ui/atoms/image'
import { Theme } from 'app/design/theme';


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

export default function PageLayout(props) {
    const { t } = useTranslation()

    const [renderBlock, setRenderBlock] = useState(false)
    let { currentUser, setCurrentUser } = useCurrentUser()
    const feedMode = storageGet('feed:mode', '', true)
    const feedTypeD = storageGet('feed:type', '', true)
    const [feedType, setFeedType] = useState(
        feedTypeD ? feedTypeD : appSetting('feed', 'default_feed')
    )

    const {height: windowHeight} = useWindowDimensions();
    const { colors } = Theme();

    const feedList = appSetting('feed', 'list');
    const [feedHeight, setFeedHeight] = useState(windowHeight - 64 -64 - (feedList.length > 1 ? 40 : 0));

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
        }, 100)

        return () => clearTimeout(timer) // This will clear the timer when the component is unmounted.
    }, [])

    
    let topBlocks = Object.keys(props.blocks)
        .filter((key) => props.blocks[key].topbar)
        .map((key) => {
            return { name: key, block: props.blocks[key] }
        })

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
    

    useEffect(() => {
        setFeedHeight(windowHeight - 64 -64 - (feedList.length > 1 ? 40 : 0));
    }, [windowHeight]);

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
                 <View style={{ backgroundColor: colors.barsBackground }} className=' border-b border-bdr dark:border-bdr-d  min-w-full'>
                 <ScrollView horizontal={true} className="w-full ">
                    <Row className=" px-1.5  justify-center  ">
                        {feedList.length > 1 &&
                            feedList.map((item, index) => {
                                return (
                                    <Pressable
                                        key={'selector' + index}
                                        className="py-2 px-1 items-center justify-center "
                                        onPress={() => {
                                            setFeedTypeEx(item.name)
                                        }}
                                    >
                                        <Button
                                            fullWidth={false}
                                            id="tab"
                                            startDecorator={item.icon}
                                            title={item.showTitle ? t(item.title) : ''}
                                            rounded
                                            variant={
                                                feedType == item.name
                                                    ? 'primary'
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
                    </ScrollView>
                    </View>
                    {feedList.map((item, index) => {
                        if (feedType == item.name) {
                            return (
                                <View
                                    key={'view' + index}
                                    style={{ height: feedHeight}}
                                    className="w-full  "
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
