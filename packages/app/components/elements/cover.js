import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { appSetting, formatDateInterval, cloneObject, uploadImage, md5, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import * as ImagePicker from 'expo-image-picker'

import { genRnd } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { manipulateAsync } from 'app/lib/image-manipulator'
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
    const buttonVariant = isDesktop ? 'secondary' : 'text'
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

    return (
        <Row className={`${conductorTheme.content_max_width} flex-row items-center justify-between mx-auto h-14`}>
            {!currentUser && !bPerson ? <PageHeaderSmall /> : <><Row className='items-center' >
                {(!appSetting('context_selector', 'show_always') || !isWeb) && <View className='mr-2 lg:hidden'>{getCoverBackButton(bPerson)}</View>}
                {appSetting('context_selector', 'show_always') && !isDesktop ? <View className={`${TABLET_MODE_FROM}:hidden `}>
                    <ContextSelector data={context} mode="compact" />
                </View> : <>                    <Row className='items-center gap-2'>
                    {bPerson && (
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />)}
                    <Profile
                        {...data.profile}
                        displayType="unit_wo_image"
                        displaySize="lg"
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
                        {!showMoreMenu && (
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
        mode == 'cover' ? coverData.src : profileData.url_avatar
    )

    const uo = profileData.module + (mode == 'cover' ? '_cover_crop' : '_picture_crop');
    const so = coverData.storage
    const img_trans = ''
    const c = profileData.info.id

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
                    if (mode == 'cover') {
                        let manipulatedWidth = 2000
                        let manipulatedHeight = 2000

                        if (
                            width > manipulatedWidth ||
                            height > manipulatedHeight
                        ) {
                            if (width > height) {
                                manipulatedHeight = Math.round(
                                    (height * manipulatedWidth) / width
                                )
                            } else {
                                manipulatedWidth = Math.round(
                                    (width * manipulatedHeight) / height
                                )
                            }

                            if (manipulateAsync) {
                                const resizedPhoto = await manipulateAsync(uri, [
                                    {
                                        resize: {
                                            width: manipulatedWidth,
                                            height: manipulatedHeight,
                                        },
                                    },
                                ])
                                uri = resizedPhoto.uri;
                            }
                        }
                    }
                    if (mode == 'picture') {
                        let s = width

                        let originX = 0
                        let originY = 0
                        let acts = []
                        if (width != height) {
                            if (width > height) {
                                s = height
                                originX = (width - height) / 2
                            } else {
                                s = width
                                originY = (height - width) / 2
                            }
                            acts.push({
                                crop: {
                                    width: s,
                                    height: s,
                                    originX: 0,
                                    originY: 0,
                                },
                            })
                        }
                        if (s > 500) {
                            acts.push({ resize: { width: 500, height: 500 } })
                        }
                        if (manipulateAsync) {
                            const resizedPhoto = await manipulateAsync(uri, acts)
                            uri = resizedPhoto.uri
                        }
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
    }

    if (mode == 'cover') {
        const isCover = !!imageUrl
        return (
            <View
                className={`duration-300 bg-primary lg:rounded-b-lg lg:pt-3 lg:px-3 w-full ${appSetting(
                    'layout',
                    'max_width_content'
                )} mx-auto overflow-hidden ${isCover
                    ? ` h-[30vh] sm:${appSetting('cover', 'aspect_ratio')}`
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
                {imageUrl?.includes('data:') && (
                    <View className="h-full w-full opacity-50 bg-card w-full justify-center">
                        <Loading />
                    </View>
                )}
                <Row className="py-2 px-3 justify-end gap-2 ">
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
                <Profile
                    {...profileData}
                    url_avatar={imageUrl}
                    displayType="unit_wo_info"
                    displaySize={profileDisplaySize}
                />
                {allowEdit && (
                    <View className=" bg-card rounded-full absolute bottom-2.5 right-0">
                        <Button
                            rounded
                            size="sm"
                            variant="default"
                            startDecorator="Camera"
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

    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const bPerson =
        data?.profile?.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', data?.profile?.module)
            ? true
            : false
    const bAllowEdit =
        data.allow_edit && appSetting('cover', 'allow_edit') && isWeb
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
       
        return <>{appSetting('context_selector', 'show_always') ? <Row className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2 `} >

        <View className={`bg-card/70 h-14`}>
            <ContextSelector data={context} mode="compact" />
        </View></Row> : <></>}
    </>
    }

    const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

    return (
        <View className={`w-full mx-auto ${appSetting('layout', 'max_width')}`}>
            {appSetting('context_selector', 'show_always') ? <Row className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2 `} >

                <View className={`${TABLET_MODE_FROM}:hidden `}>
                    <View><ContextSelector data={context} mode="compact" /></View>
                </View></Row> : <></>}
            {!isMin && (
                <CoverImage
                    mode="cover"
                    coverData={data?.cover}
                    profileData={data.profile}
                    allowEdit={bAllowEdit}
                    allowSwitch={isAllowSwitch}
                />
            )}
            <View
                className={` ${appSetting(
                    'layout',
                    'max_width_content'
                )} lg:flex-row gap-y-3 gap-x-3 mx-auto w-full lg:items-end p-3  `}
            >
                {bPerson && (
                    <View className="hidden lg:flex flex-none h-24 justify-end w-min ">
                        <View className=" flex-auto z-50 rounded-full p-1 flex-none bg-white dark:bg-neutral-900 translate-y-1 -translate-x-1">
                            <CoverImage
                                is_person={bPerson}
                                mode="picture"
                                profileDisplaySize={isMin ? 'xl' : '3xl'}
                                coverData={data?.cover}
                                profileData={data.profile}
                                allowEdit={bAllowEdit}
                                allowSwitch={isAllowSwitch}
                            />
                        </View>
                    </View>
                )}
                <View className={`flex-auto gap-2 sm:gap-3 ${bPerson ? 'lg:flex-row flex-col-reverse' : 'flex-row'}`}>
                    <View className="flex-col flex-auto gap-2 ">
                        <Row className=" gap-2 flex-auto items-center min-h-12">
                            <Text
                                className={`font-title tracking-tight text-3xl sm:text-4xl font-bold text-foreground`}
                                numberOfLines={2}
                            >
                                {data.profile.display_name}
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
                        {!!data.profile.info?.date_start && (
                            <Text className="  text-muted-foreground text-xs uppercase font-semibold tracking-tight overflow-hidden rounded-md flex-none items-center">
                                {formatDateInterval(
                                    data.profile.info?.date_start,
                                    data.profile.info?.date_end,
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
                                    <View className=" flex-row flex-auto z-50 rounded-full p-1 flex-none bg-white mr-auto dark:bg-neutral-900 translate-y-1 -translate-x-1 ">
                                        <CoverImage
                                            mode="picture"
                                            profileDisplaySize={
                                                isMin ? '2xl' : '3xl'
                                            }
                                            coverData={data?.cover}
                                            profileData={data.profile}
                                            allowEdit={bAllowEdit}
                                            allowSwitch={isAllowSwitch}
                                        />
                                    </View>
                                </View>
                            )}
                            <View
                                className={`gap-2 web:flex-row ${appSetting(
                                    'cover',
                                    'more_menu_in_navbar',
                                    data?.profile?.module
                                ) && 'lg:hidden'
                                    }`}
                            >
                                <CoverMenu
                                    {...data.actions_menu}
                                    uri={uri}
                                    isSplitMenu={true}
                                    containerClasses="gap-2 lg:gap-3"
                                />
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
    )
}
