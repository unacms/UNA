import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { appSetting, formatDateInterval, cloneObject, uploadImage, md5, LAYOUT_BREAKPOINTS, prepareImageForUpload } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import * as ImagePicker from 'expo-image-picker'

import { genRnd } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { Image as ImageNative } from 'react-native'
import { useCurrentUser } from 'app/context/user'
import {
    CoverMenuMeta,
    CoverMenu,
    CoverMenuMore,
} from 'app/components/nav/menu-cover'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Loading from 'app/ui/atoms/loading'
import { Platform } from 'react-native'
import { useRouter, useNavigation, goBack } from 'app/lib/hooks/router'
import { getComponent } from 'app/components/registry'
import { useIsDesktop } from 'app/context/measure';
import { PageHeaderSmall } from 'app/ui/molecules/page_header';
const conductorTheme = appSetting('theme', 'conductor')
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

const BackButton = ({ isPerson }) => {
    const router = useRouter()
    const navigation = useNavigation()

    return isPerson && navigation.getState().index == 0 ? (
        <Link href={appSetting('cover', 'back_button_url_for_profile')}>
            <Button
                variant="default"
                size="sm"
                rounded={true}
                startDecorator="ArrowLeft"
            />
        </Link>
    ) : (
        <Button
            variant="default"
            size="sm"
            rounded={true}
            startDecorator="ArrowLeft"
            onPress={() => {
                goBack(navigation, router)
            }}
        />
    )
}

function GetCoverBackButton({ isPerson }) {
    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop();
    const buttonVariant = isDesktop ? 'secondary' : 'secondary'
    const buttonSize = isDesktop ? 'base' : 'base'
    if (!isWeb) return <BackButton isPerson={isPerson} />
    if (history.length > 2) {
        return (
            <View className="lg:hidden">
                <Button
                    rounded={true}
                    size={buttonSize}
                    variant={buttonVariant}
                    startDecorator="ArrowLeft"
                    onPress={() => history.back()}
                />
            </View>
        )
    } else {
        return (
            <View className="lg:hidden ">
                <Link href="/">
                    <Button
                        rounded={true}
                        size={buttonSize}
                        variant={buttonVariant}
                        startDecorator="ArrowLeft"
                    />
                </Link>
            </View>
        )
    }
}

function getCoverBackButton(is_person) {
    return <GetCoverBackButton isPerson={is_person} />
}

export function CoverSmall({ data, context, showMoreMenu, uri, mode }) {
    const isDesktop = useIsDesktop();
    const { currentUser } = useCurrentUser()
    const isWeb = Platform.OS === 'web'
    if (!data?.profile?.module)
        return null

    const bPerson =
        data?.profile?.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', data?.profile?.module)
            ? true
            : false
    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const isAddSelector =
        context &&
        context.list[0] &&
        data.profile.module == context.list[0].module
    const ContextSelector = getComponent('molecule', 'context_selector')

    if (isDesktop && isAddSelector) {
        return null
    }

    if (coverMode === 'none' && isDesktop) {
        return null
    }

    let menu = cloneObject(data.actions_menu)


    if (!showMoreMenu) {
        menu.items = menu.items.map((item, index) => {
            return { ...item, persistent: 0 }
        })
    }

    const smallCoverAvatarSize =
        appSetting('cover', 'small_cover_avatar_display_size') || 'base'
    const smallCoverNameSize =
        appSetting('cover', 'small_cover_name_display_size') || '2xl'

    return (
        <Row className={`${conductorTheme.content_max_width} flex-auto items-center justify-between mx-auto h-14`}>
            {!currentUser && !bPerson ? <PageHeaderSmall /> : <><Row className='items-center flex-1 overflow-hidden' >
                {(!appSetting('context_selector', 'show_always') || !isWeb) && <View className='mr-2 lg:hidden'>{getCoverBackButton(bPerson)}</View>}
                {appSetting('context_selector', 'show_always') && !isDesktop ? <View className={`${TABLET_MODE_FROM}:hidden `}>
                    <ContextSelector data={context} mode="compact" />
                </View> : <>
                    <Row className='items-center gap-3 flex-1 '>
                        {bPerson && (
                            <Profile
                                {...data.profile}
                                displayType="unit_wo_info"
                                displaySize={smallCoverAvatarSize}
                            />)}
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_image"
                            displaySize={smallCoverNameSize}
                            showLinks={false}
                        />
                    </Row>
                    {isAddSelector && (
                        <View className={`${TABLET_MODE_FROM}:hidden `}>
                            <ContextSelector data={context} mode="min" />
                        </View>
                    )}
                </>
                }
            </Row>
                <View className="flex-none items-end ">
                    <Row className="w-full justify-between">
                        {!showMoreMenu &&
                            (!appSetting('cover', 'hide_cover_menu_on_narrow') ||
                                isDesktop) && (
                                <>
                                    <CoverMenu {...menu} uri={uri} isSplitMenu={true} />
                                </>
                            )}
                        <>
                            <CoverMenuMore
                                {...menu}
                                uri={uri}
                                isSplitMenu={!showMoreMenu}
                            />
                        </>
                    </Row>
                </View></>}
        </Row>
    )
}

function CoverImage({
    mode,
    profileData,
    coverData,
    allowEdit,
    allowSwitch,
    title,
    profileDisplaySize,
    is_person,
}) {
    const [imageUrl, setImageUrl] = useState(
        mode == 'cover' ? coverData?.src : profileData?.url_avatar
    )
    const [isUploading, setIsUploading] = useState(false)

    const uo = (profileData?.module || '') + (mode == 'cover' ? '_cover_crop' : '_picture_crop');
    const so = coverData?.storage || ''
    const img_trans = ''
    const c = profileData?.info?.id || profileData?.id || 0

    const handleSwitch = async (id) => {
        const result = await fetcher(
            '/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' +
            id
        )
        location.reload()
    }

    const handleUpload = async (mode) => {
        const url =
            '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' +
            uo +
            '&so=' +
            so +
            '&uid=' +
            genRnd(8) +
            '&img_trans=' +
            img_trans +
            '&m=0&c=' +
            c +
            '&p=0'

        let mediaTypes = ImagePicker.MediaTypeOptions.Images

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: mediaTypes,
            quality: 1,
            allowsMultipleSelection: false,
        })
        if (!result.cancelled) {
            for (const i of result.assets) {
                let uri = i.uri
                ImageNative.getSize(uri, async (width, height) => {
                    setIsUploading(true)
                    if (mode == 'cover') {
                        uri = await prepareImageForUpload({
                            uri,
                            width,
                            height,
                            fileSizeBytes: i?.fileSize,
                            maxWidth: 2000,
                            maxHeight: 2000,
                            webpOverMb: 4,
                        })
                    }
                    if (mode == 'picture') {
                        uri = await prepareImageForUpload({
                            uri,
                            width,
                            height,
                            fileSizeBytes: i?.fileSize,
                            cropToSquare: true,
                            squareSize: 500,
                            webpOverMb: 4,
                        })

                    }
                    const hash = md5(uri)
                    setImageUrl(uri)
                    uploadImage(
                        uri,
                        url + '&a=upload',
                        handleInsertImageFinish,
                        { hash: hash, mode: mode }
                    )
                })
            }
        }
    }

    const handleInsertImageFinish = async (uploadInfo) => {
        try {
            if (!profileData?.module || !uploadInfo?.result?.data?.id) return
            const sRequest =
                '/api.php?r=' +
                profileData.module +
                '/update_image/&params[]=' +
                uploadInfo.extraVar.mode +
                '&params[]=' +
                c +
                '&params[]=' +
                uploadInfo.result.data.id
            const sResponse = await fetcher(sRequest)
            setImageUrl(sResponse.data)
        } finally {
            setIsUploading(false)
        }
    }

    if (mode == 'cover') {
        const isCover = !!imageUrl
        return (
            <View
                className={`web:duration-300 bg-accent/50 lg:rounded-b-xl p-3 w-full ${appSetting(
                    'layout',
                    'max_width_content'
                )} mx-auto overflow-hidden ${isCover
                    ? ` h-[36vh] sm:${appSetting('cover', 'aspect_ratio')}`
                    : 'pb-32'
                    }`}
            >
                {isCover && (
                    <Image
                        alt={title}
                        view="cover"
                        sizes={LAYOUT_BREAKPOINTS.xl}
                        className="u-cover opacity-50"
                        src={imageUrl}
                    />
                )}
                {(imageUrl?.includes('data:') || isUploading) && (
                    <View className="absolute inset-0 h-full w-full opacity-60 bg-card justify-center items-center">
                        <Loading />
                    </View>
                )}
                <Row className=" justify-end gap-2 ">
                    {allowSwitch && (
                        <Button
                            rounded
                            size="sm"
                            variant="secondary"
                            startDecorator="RefreshCw"
                            tooltip={'Switch to profile'}
                            onPress={() => handleSwitch(allowSwitch)}
                        />
                    )}
                    {allowEdit && (
                        <Button
                            rounded
                            variant="secondary"
                            size="sm"
                            startDecorator="Camera"
                            disabled={isUploading}
                            onPress={() => handleUpload(mode)}
                        />
                    )}
                </Row>
                <View className="absolute lg:hidden top-2 left-3 z-50 ">
                    {getCoverBackButton(is_person)}
                </View>
            </View>
        )
    }
    if (mode == 'picture') {
        return (
            <>
                <View>
                    <Profile
                        {...profileData}
                        url_avatar={imageUrl}
                        displayType="unit_wo_info"
                        displaySize={profileDisplaySize}
                    />
                    {isUploading && (
                        <View className="absolute inset-0 rounded-full bg-card/80 items-center justify-center">
                            <Loading />
                        </View>
                    )}
                </View>
                {allowEdit && (
                    <View className=" bg-card rounded-full absolute bottom-0 right-0 p-1">
                        <Button
                            rounded
                            size="sm"
                            variant="default"
                            startDecorator="Camera"
                            disabled={isUploading}
                            onPress={() => handleUpload(mode)}
                        />
                    </View>
                )}
            </>
        )
    }
}

export default function Cover({ data, mode, uri, showMoreMenu, pageData, context }) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const isWeb = Platform.OS === 'web'
    const profileData = data?.profile

    // Cover can render before profile payload arrives on native.
    if (!profileData) return null

    const coverMode =
        appSetting('cover', 'view_by_module', profileData?.module) || mode
    const bPerson =
        profileData?.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', profileData?.module)
            ? true
            : false
    const bAllowEdit =
        data?.allow_edit && appSetting('cover', 'allow_edit') && isWeb
    const foundItem = currentUser?.informer?.find((item) => {
        return item.id == 'sys-switch-profile-context'
    })
    let isAllowSwitch = appSetting('cover', 'allow_switch') && foundItem && isWeb ? foundItem.msg : false
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }

    const isMin = coverMode === 'min'

    const ContextSelector = getComponent('molecule', 'context_selector')
    const Badges = getComponent('molecule', 'badges')

    if (coverMode === 'none') {
        if (isWeb) return null

        return <>{appSetting('context_selector', 'show_always') ? <Row className={`${TABLET_MODE_FROM}:hidden items-center  bg-card  justify-between w-full px-4 h-14`} >

            <View className={`flex-1 justify-center`}>
                <ContextSelector data={context} mode="compact" />

            </View>
            {!!data?.actions_menu && <View className={`bg-card/70`}>
                <CoverMenuMore
                    {...data.actions_menu}
                    uri={uri}
                    isSplitMenu={true}
                /></View>}
        </Row> : <></>}
        </>
    }

    return (
        <View className={` mx-auto ${appSetting('layout', 'max_width')}`}>
            {appSetting('context_selector', 'show_always') ? <Row className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2 `} >

                <View className={`${TABLET_MODE_FROM}:hidden `}>
                    <View><ContextSelector data={context} mode="compact" /></View>
                </View></Row> : <></>}
            {!isMin && (
                <CoverImage
                    mode="cover"
                    coverData={data?.cover}
                    profileData={profileData}
                    allowEdit={bAllowEdit}
                    allowSwitch={isAllowSwitch}
                />
            )}
            <View
                className={` ${appSetting(
                    'layout',
                    'max_width_content'
                )} lg:flex-row gap-3 mx-auto w-full lg:items-end p-2 lg:p-3 items-center `}
            >
                {bPerson && (
                    <View className="hidden lg:flex flex-none h-20 justify-end w-min ">
                        <View className=" flex-auto z-50 rounded-full p-1 flex-none bg-card">
                            <CoverImage
                                is_person={bPerson}
                                mode="picture"
                                profileDisplaySize={isMin ? 'xl' : '3xl'}
                                coverData={data?.cover}
                                profileData={profileData}
                                allowEdit={bAllowEdit}
                                allowSwitch={isAllowSwitch}
                            />
                        </View>
                    </View>
                )}
                <View className={`flex-auto gap-2 w-full sm:gap-3 ${bPerson ? 'lg:flex-row flex-col-reverse' : 'flex-row'}`}>
                    <View className="flex-col flex-auto gap-2 p-1 ">
                        <Row className="gap-2 flex-auto items-center min-h-10 px-0.5">
                            <Text
                                className={`font-title tracking-tight text-3xl font-bold text-foreground`}
                                numberOfLines={2}
                            >
                                {profileData.display_name || profileData.title || ''}
                            </Text>
                            <Badges badges={data.badges} size="2xs" />
                        </Row>
                        {isWeb ? (
                            <CoverMenuMeta {...data.meta_menu} />
                        ) : (
                            <ScrollView horizontal={true}>
                                <CoverMenuMeta {...data.meta_menu} />
                            </ScrollView>
                        )}
                        {!!profileData.info?.date_start && (
                            <Text className="  text-muted-foreground text-xs uppercase font-semibold tracking-tight overflow-hidden rounded-md flex-none items-center">
                                {formatDateInterval(
                                    profileData.info?.date_start,
                                    profileData.info?.date_end,
                                    t
                                )}
                            </Text>
                        )}
                    </View>
                    <View className="flex-row flex-wrap items-end  justify-between gap-x-2 gap-y-2">
                        <View className="flex-row sm:items-end flex-auto flex-wrap gap-3 lg:ml-auto">
                            {bPerson && (
                                <View
                                    className={`${isMin ? 'h-24' : 'h-9'
                                        } lg:hidden flex-auto justify-end `}
                                >
                                    <View className=" flex-row flex-auto z-50 rounded-full p-1 flex-none bg-white mr-auto dark:bg-background translate-y-1 -translate-x-1 ">
                                        <CoverImage
                                            mode="picture"
                                            profileDisplaySize={
                                                isMin ? '2xl' : '3xl'
                                            }
                                            coverData={data?.cover}
                                            profileData={profileData}
                                            allowEdit={bAllowEdit}
                                            allowSwitch={isAllowSwitch}
                                        />
                                    </View>
                                </View>
                            )}
                            <View className="gap-2 web:flex-row">
                                <CoverMenu
                                    {...data.actions_menu}
                                    uri={uri}
                                    isSplitMenu={true}
                                    containerClasses="gap-2 lg:gap-3"
                                />
                                <View
                                    className='lg:hidden'
                                >
                                    <CoverMenuMore
                                        {...data.actions_menu}
                                        uri={uri}
                                        isSplitMenu={true}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}
