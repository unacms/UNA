import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Platform } from 'react-native'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    appSetting,
    filterContent,
    storageSet,
    storageGet,
    LAYOUT_BREAKPOINTS,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { ConductorFlat as Conductor} from 'app/ui/molecules/conductor_flat'
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
                sizes={LAYOUT_BREAKPOINTS.lg}
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

    let { currentUser, setCurrentUser } = useCurrentUser();
    const { height: windowHeight } = useWindowDimensions();
    const { colors } = Theme();
    const feedMode = storageGet('feed:mode', '', true)
    const feedTypeDefault = storageGet('feed:type', '', true) || appSetting('feed', 'default_feed');
    const [feedType, setFeedType] = useState(feedTypeDefault);
    const [unitMode, setUnitMode] = useState(feedMode || appSetting('feed', 'default_view'));
    const feedList = appSetting('feed', 'list');
    const feedHeight = windowHeight - 128 - (feedList.length > 1 ? 40 : 0);


    function setUnitModeEx(mode) {
        storageSet('feed:mode', '', mode, true)
        setUnitMode(mode)
    }

    function setFeedTypeEx(mode) {
        storageSet('feed:type', '', mode, true)
        setFeedType(mode)
    }

    const topBlocks = useMemo(() => {
        return Object.keys(props.blocks)
            .filter((key) => props.blocks[key].topbar)
            .map((key) => ({ name: key, block: props.blocks[key] }));
    }, [props.blocks]);

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
    const blocksForAdd = useMemo(() => {
        const blocks = appSetting('layouts', 'home').blocks;
        const addedBlocks = [];
        if (blocks[`${feedType}_feed_form`]) addedBlocks.push(blocks[`${feedType}_feed_form`].name);
        if (blocks[`${feedType}_feed`]) addedBlocks.push(blocks[`${feedType}_feed`].name);
        topBlocks.forEach((item) => addedBlocks.push(item.block.name));
        return addedBlocks;
    }, [feedType, topBlocks]);


    const dataForFeed = useMemo(() => filterContent(props.data, blocksForAdd), [props.data, blocksForAdd]);

    const handleFeedTypeChange = useCallback((type) => {
        storageSet('feed:type', '', type, true);
        setFeedType(type);
    }, []);

    const handleUnitModeChange = useCallback((mode) => {
        storageSet('feed:mode', '', mode, true);
        setUnitMode(mode);
    }, []);


    let menu = {
        object: 'search',
        items: menuItems,
    }

    let p = {
        blocks: props.blocks,
        data: props.data,
        block: SplashBlock(props),
    }

    /*  useEffect(() => {
          setFeedHeight(windowHeight - 64 -64 - (feedList.length > 1 ? 40 : 0));
      }, [windowHeight]);*/

    if (currentUser === null)
        return <></>

    return (
        <View className="w-full ">
            {!currentUser && (
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
                                            <View

                                                className="py-2 px-1 items-center justify-center "
                                                key={'selector' + index}
                                            >
                                                <Button

                                                    fullWidth={false}
                                                    id="tab"
                                                    onPress={() => handleFeedTypeChange(item.name)}
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
                                            </View>
                                        )
                                    })}
                                {appSetting('feed', 'show_selector_view') && (
                                    <Row className="flex-auto flex-auto justify-end">
                                        <View
                                            className="items-center justify-center py-2.5  "

                                        >
                                            <Button
                                                onPress={() => handleUnitModeChange('')}
                                                startDecorator="Rows"
                                                fullWidth={false}
                                                rounded
                                                variant={
                                                    unitMode == '' ? 'link' : 'text'
                                                }
                                                size="sm"
                                            />
                                        </View>
                                        <View
                                            className="items-center justify-center py-2.5  "

                                        >
                                            <Button
                                                onPress={() => handleUnitModeChange('small')}
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
                                        </View>
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
                                    style={{ height: feedHeight }}
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
