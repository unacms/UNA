import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Platform } from 'react-native'
import { useState, useEffect } from 'react'
import { appSetting, filterContent, storageSet, storageGet } from 'app/lib/util'
import LayoutDataContext from 'app/context/layout'
import { useCurrentUser } from 'app/context/user'
import { BlackBox } from 'app/ui/molecules/blackbox'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile'
import Link from 'app/ui/atoms/link'
import { Modal } from 'app/design/controls'
import Splash from 'app/ui/molecules/splash'
import Image from 'app/ui/atoms/image'

export default function PageLayout(props) {

    const [showImage, setShowImage] = useState(false);

    const isWeb = Platform.OS == 'web'
    const [isDesktop, setIsDesktop] = useState(false)
    const [renderBlock, setRenderBlock] = useState(false)
    let { currentUser, setCurrentUser } = useCurrentUser()
    const feedMode = storageGet('feed:mode', '', true)
    const feedTypeD = storageGet('feed:type', '', true)
    const [feedType, setFeedType] = useState(
        feedTypeD ? feedTypeD : appSetting('feed', 'default_feed')
    )
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
   

    if (isWeb) {
        if (currentUser === null && renderBlock)
            return (
                <View className={appSetting('layout', 'max_width') + ' mx-auto w-full pt-4'} >
                    <Splash {...props}/>
                </View>
            )
        if (currentUser) {
            let dUser = Object.assign({}, currentUser)
            dUser.url_avatar = dUser.avatar
            dUser.url = '/dashboard'
            const profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="sm" />

        return (
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <Modal id='file-preview' title="Your Profiles" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                    <BlockByName name={props.blocks.profile_switcher} data={props.data} hideTitle={true} />
                </Modal>
                <View className="flex-auto relative w-full flex-row mx-auto  ">
                    <View className="hidden lg:block  w-1/4 pt-4 top-0 sticky duration-200  ">
                        <Row className="items-center justify-between mx-4 px-3 py-2 rounded-xl border border-transparent cursor-pointer hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50">
                            <Link href={currentUser.url}>
                                <Row>
                                    <View className="mx-1 mr-4 bg-bgritem dark:bg-bgritem-d rounded-full flex-none ">
                                        {profile}
                                    </View>
                                    <Text className="text-lg flex-auto my-auto font-bold truncate text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900  dark:group-hover:text-neutral-100">
                                        {currentUser.display_name}
                                    </Text>
                                </Row>
                            </Link>
                            {appSetting('account', 'allow_switch_profile') && <View><Button
                            variant="outline"
                            size="sm"
                            startDecorator="UserSwitch"
                            fullWidth
                            onClick = {() => setShowImage(true)}
                            align="right"
                        /></View>}
                    </Row>
                    <BlockByName data={props.data} name={props.blocks.menu} />
                </View>
                <View className="flex-auto w-2/4  flex-row  duration-200">
                    <View className="flex-auto xl:px-4  border-x border-dashed border-neutral-500/10 w-2/3">
                    {appSetting('feed', 'show_multi') ? (
                        <>
                        <Row className="p-4  gap-x-2  w-full">
                            <Pressable className=" my-auto items-center" onPress={() => { setFeedTypeEx('account') }} >
                                <Button fullWidth={true} id="tab" startDecorator="Users" variant={feedType == 'account' ? 'outline' : 'text'} rounded size="sm" title="Following"/>
                            </Pressable>
                            <Pressable className=" my-auto items-center" onPress={() => { setFeedTypeEx('public') }} >
                                <Button
                                    fullWidth={true}
                                    id="tab"
                                    startDecorator="MagicWand"
                                    variant={feedType == 'public' ? 'outline' : 'text'}
                                    rounded
                                    size="sm"
                                    title="For You"
                                />
                            </Pressable>
                            <Pressable
                                className=" hidden my-auto items-center"
                                onPress={() => {
                                    setFeedTypeEx('hot')
                                }}
                            >
                                <Button
                                    fullWidth={true}
                                    id="tab"
                                    startDecorator="Fire"
                                    variant={feedType == 'hot' ? 'outline' : 'text'}
                                    rounded
                                    size="sm"
                                    title="Hot"
                                />
                            </Pressable>
                            {appSetting('feed', 'show_selector_view') && (
                                <Row className="flex-auto gap-x-1 flex-auto items-end justify-end">
                                    <Button
                                        startDecorator="Rows"
                                        variant={unitMode == '' ? 'outline' : 'text'}
                                        size="sm"
                                        onPress={() => {
                                            setUnitModeEx('')
                                        }}
                                    />
                                    <Button
                                        startDecorator="ListBullets"
                                        variant={unitMode == 'small' ? 'outline' : 'text'}
                                        size="sm"
                                        onPress={() => {
                                            setUnitModeEx('small')
                                        }}
                                    />
                                </Row>
                            )}
                        </Row>
                        {feedType == 'account' && (
                            <View className={ feedType == 'account' ? '' : 'w-full absolute z-0 invisible top-full' } >
                                <LayoutDataContext>
                                    <BlockByName data={props.data} name={props.blocks.account_feed_form} />
                                    <BlockByName data={props.data} name={props.blocks.account_feed} unitMode={unitMode} />
                                </LayoutDataContext>
                            </View>
                        )}
                        {feedType == 'public' && (
                            <View className={feedType == 'public' ? '' : 'w-full absolute z-0 invisible top-full'}>
                                <LayoutDataContext>
                                    <BlockByName data={props.data} name={props.blocks.public_feed_form} />
                                    <BlockByName data={props.data} name={props.blocks.public_feed} unitMode={unitMode} />
                                </LayoutDataContext>
                            </View>
                        )}
                        {feedType == 'hot' && (
                            <View className={feedType == 'hot' ? '' : 'w-full absolute z-0 invisible top-full' } >
                                <LayoutDataContext>
                                    <BlockByName data={props.data} name={props.blocks.hot_feed} unitMode={unitMode} />
                                </LayoutDataContext>
                            </View>
                        )}
                        </>
                    ) : (
                        <View className="pt-4">
                            <LayoutDataContext>
                                <BlockByName data={props.data} name={ props.blocks[appSetting('feed', 'default_feed') + '_feed_form'] }/>
                                <BlockByName data={props.data} name={ props.blocks[ appSetting('feed', 'default_feed') + '_feed' ] } />
                            </LayoutDataContext>
                        </View>
                    )}
                    </View>
                </View>
                <View className="hidden xl:block w-1/4 px-4 flex-col space-y-4 sticky top-0 duration-200 ">
                    <BlockByName name={props.blocks.intro} />
                    <BlockByName no_scroll={true} data={props.data} name={props.blocks.friends} skeleton="one_column_browse" />
                    <BlockByName no_scroll={true} data={props.data} name={props.blocks.subscriptions} skeleton="one_column_browse" />
                    <BlockByName name={props.blocks.footer} />
                </View>
            </View>
        </View>
        
    )}
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

    let dataHome = filterContent(props.data, [
        'bx_timeline:get_block_post_home',
        'bx_timeline:get_block_view_home',
    ])
    let dataAccount = filterContent(props.data, [
        'bx_timeline:get_block_post_account',
        'bx_timeline:get_block_view_account',
    ])
    let dataHot = filterContent(props.data, ['bx_timeline:get_block_view_hot'])
    let dataSingle = dataHome
    if (appSetting('feed', 'default_feed') == 'account') {
        dataSingle = dataAccount
    }
    if (appSetting('feed', 'default_feed') == 'hot') {
        dataSingle = dataHot
    }

    let menu = {
        object: 'search',
        items: menuItems,
    }

    return (
        <View className="w-full ">
            {!currentUser && renderBlock && (
                <ScrollView>
                    <BlockByName name={props.blocks.home} />
                </ScrollView>
            )}
            {!!currentUser && (
                <>
                    {appSetting('feed', 'show_multi') ? (
                        <>
                            <Row className="px-auto justify-center gap-x-1 ">
                            <Pressable
                                className="items-center justify-center py-2.5  "
                                onPress={() => {
                                setFeedTypeEx('account')
                                }}
                            >
                                <Button
                                    fullWidth={false}
                                    id="tab"
                                    startDecorator="Users"
                                    variant={feedType == 'account' ? 'outline' : 'text'}
                                    rounded
                                    size="sm"
                                    title="Following"
                                />
                            </Pressable>
                            <Pressable
                                className=" items-center justify-center py-2.5  "
                                onPress={() => {
                                setFeedTypeEx('public')
                                }}
                            >
                                <Button
                                    fullWidth={false}
                                    id="tab"
                                    startDecorator="MagicWand"
                                    variant={feedType == 'public' ? 'outline' : 'text'}
                                    rounded
                                    size="sm"
                                    title="For You"
                                />
                            </Pressable>
                            <Pressable
                                className="items-center hidden justify-center py-2.5 "
                                onPress={() => {
                                setFeedTypeEx('hot')
                                }}
                            >
                                <Button
                                fullWidth={false}
                                id="tab"
                                startDecorator="Fire"
                                variant={feedType == 'hot' ? 'outline' : 'text'}
                                rounded
                                size="sm"
                                title="Hot"
                                />
                            </Pressable>
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
                                            variant={unitMode == '' ? 'outline' : 'text'}
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
                                            variant={unitMode == 'small' ? 'outline' : 'text'}
                                            size="sm"
                                        />
                                    </Pressable>
                                </Row>
                            )}
                        </Row>
                        {feedType == 'public' && (
                            <View className={feedType == 'public' ? '' : ' h-full'}>
                                <LayoutDataContext>
                                    <BlackBox
                                        minHeaderHeight={0}
                                        isHideDefaultHeader={false}
                                        menu={menu}
                                        unitMode={unitMode}
                                        data={dataHome}
                                        blocks={props.blocks}
                                    />
                                </LayoutDataContext>
                            </View>
                        )}
                        {feedType == 'account' && (
                            <View className={feedType == 'account' ? '' : ' h-full'}>
                                <LayoutDataContext>
                                    <BlackBox
                                        minHeaderHeight={0}
                                        isHideDefaultHeader={false}
                                        menu={menu}
                                        unitMode={unitMode}
                                        data={dataAccount}
                                        blocks={props.blocks}
                                    />
                                </LayoutDataContext>
                            </View>
                        )}
                        {feedType == 'hot' && (
                        <View className={feedType == 'hot' ? '' : ' h-full'}>
                            <LayoutDataContext>
                                <BlackBox
                                    minHeaderHeight={0}
                                    isHideDefaultHeader={false}
                                    menu={menu}
                                    data={dataHot}
                                    unitMode={unitMode}
                                    blocks={props.blocks}
                                />
                            </LayoutDataContext>
                        </View>
                    )}
                </>
            ) : (
                <LayoutDataContext>
                    <BlackBox
                        minHeaderHeight={0}
                        isHideDefaultHeader={false}
                        menu={menu}
                        unitMode={unitMode}
                        data={dataSingle}
                        blocks={props.blocks}
                    />
                </LayoutDataContext>
            )}
            </>
        )}
        </View>
    )
}
