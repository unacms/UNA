import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Badges from 'app/ui/atoms/badges'
import { Text } from 'app/design/typography'
import { getBackButtonWeb } from 'app/lib/common-helpers'
import { Button } from 'app/design/controls'
import { appSetting, formatDateInterval } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import { useWindowDimensions } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, md5, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { genRnd, getLayout } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator'
import { Image as ImageNative } from 'react-native'
import { useCurrentUser } from 'app/context/user'
import {
    CoverMenuMeta,
    CoverMenu,
    CoverMenuMore,
    CoverMenuSmall,
} from 'app/components/nav/menu-cover'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'

const conductorTheme = appSetting('theme', 'conductor')
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');
// Custom back button for cover images with glassy style
function getCoverBackButton() {
    const isWeb = Platform.OS === 'web'
    if (!isWeb) return <></>
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-1">
                <Button
                    rounded={true}
                    size="base"
                    variant="glassy"
                    startDecorator="ArrowLeft"
                    onPress={() => history.back()}
                />
            </View>
        )
    } else {
        return (
            <View className="lg:hidden mr-1">
                <Link href="/">
                    <Button
                        rounded={true}
                        size="base"
                        variant="glassy"
                        startDecorator="ArrowLeft"
                    />
                </Link>
            </View>
        )
    }
}

export function CoverSmall(props) {
    const data = props.data
    const isUseBg = appSetting('cover', 'use_background')
    const bPerson =
        props.data.profile.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', props.data?.profile?.module)
            ? true
            : false

    const isSplitMenu = appSetting('cover', 'split_action_menu') && data.actions_menu.persistent == 0

    return (
        <View

            className={
                (isUseBg
                    ? ' border-b border-bdrtabbar dark:border-bdrtabbar-d'
                    : ' bg-bgrtabbar dark:bg-bgrtabbar-d ') + ' w-full '
            }
        >
            <View
                className={
                    appSetting('layout', 'max_width') + ' w-full mx-auto'
                }
            >
                <View
                    className={`p-[12px] sm:px-[16px] ${conductorTheme.content_max_width} mx-auto w-full flex-row gap-2`}
                >
                    <Row className=" gap-x-2 items-center justify-between flex-auto">
                        <View className={` flex-auto flex-row gap-x-2 items-center`}>
                            {getBackButtonWeb()}
                            <Row className={`${props.context?.current?.id == data.profile.id ? TABLET_MODE_FROM+':hidden':''}`}>
                            {bPerson && (
                                <Profile
                                    {...data.profile}
                                    displayType="unit_wo_info"
                                    displaySize="base"
                                />
                            )}

                            <View className="flex-auto p-[4px] hover:bg-bgritem dark:hover:bg-bgritem-d rounded-[11px] h-[44px]">
                                <Profile
                                    {...data.profile}
                                    displayType="unit_wo_image"
                                    displaySize="xl"
                                /></View>
                                </Row>
                        </View>
                        <View className=" items-end">
                            {isSplitMenu ? <Row className='w-full justify-between'>

                                <View className='w-[44px]'>
                                    <CoverMenuMore
                                        {...data.actions_menu}
                                        uri={props?.uri}
                                        isSplitMenu={false}

                                    />
                                </View>
                            </Row> : <CoverMenu
                                {...data.actions_menu}
                                uri={props?.uri}

                            />
                            }
                        </View>
                    </Row>
                </View>
            </View>
        </View>
    )
}

export default function (props) {
    const { t } = useTranslation()
    const { currentUser, setCurrentUser } = useCurrentUser()
    const data = props.data

    const mode =
        appSetting('cover', 'view_by_module', props.data?.profile?.module) ||
        props.mode
    const bPerson =
        props.data.profile.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', props.data?.profile?.module)
            ? true
            : false
    const [coverUrl, setCoverUrl] = useState(data.cover.src)
    const [pictureUrl, setPictureUrl] = useState(data.profile.url_avatar)

    const uo = props.data.profile.module + '_cover_crop'
    const so = data.cover.storage
    const img_trans = ''
    const c = data.profile.info.id

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

        //alert(mode);
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

                            const resizedPhoto = await manipulateAsync(uri, [
                                {
                                    resize: {
                                        width: manipulatedWidth,
                                        height: manipulatedHeight,
                                    },
                                },
                            ])
                            uri = resizedPhoto.uri
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
                        const resizedPhoto = await manipulateAsync(uri, acts)
                        uri = resizedPhoto.uri
                    }
                    let hash = md5(uri)
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
            props.data.profile.module +
            '/update_image/&params[]=' +
            uploadInfo.extraVar.mode +
            '&params[]=' +
            c +
            '&params[]=' +
            uploadInfo.result.data.id
        const sResponse = await fetcher(sRequest)
        if (uploadInfo.extraVar.mode == 'cover') setCoverUrl(sResponse.data)
        else setPictureUrl(sResponse.data)
    }

    data.profile.url_avatar = pictureUrl

    const isUseBg = appSetting('cover', 'use_background')

    const bAllowEdit = data.allow_edit && appSetting('cover', 'allow_edit')

    const foundItem = currentUser?.informer?.find((item) => {
        return item.id == 'sys-switch-profile-context'
    })
    let isAllowSwitch = foundItem ? foundItem.msg : false
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }

    const handleSwitch = async (id) => {
        const result = await fetcher(
            '/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' +
            id
        )
        location.reload()
    }

    const isCover = data?.cover?.src

    const isSplitMenu = appSetting('cover', 'split_action_menu') && data.actions_menu.persistent == 0

    return (
        <View className=" bg-bgrtabbar dark:bg-bgrtabbar-d border-bdrtabbar dark:border-bdrtabbar-d ">
            <View
                className={`w-full mx-auto ${appSetting(
                    'layout',
                    'max_width'
                )}`}
            >
                {mode != 'min' ? (
                    <View
                        className={`duration-300 bg-primary-200 dark:bg-primary-950 w-full max-w-[1440px] mx-auto xl:rounded-b-xl overflow-hidden ${isCover
                            ? ` h-[30vh] sm:${appSetting(
                                'cover',
                                'aspect_ratio'
                            )}`
                            : 'pt-16'
                            }`}
                    >
                        {isCover && (
                            <Image
                                alt={data.group_name}
                                view="cover"
                                sizes={LAYOUT_BREAKPOINTS.xl}
                                className="u-cover "
                                src={coverUrl}
                            />
                        )}
                        <Row className="p-[8px] sm:p-[12px] justify-end gap-x-2">
                            {isAllowSwitch && (
                                <Button
                                    rounded
                                    variant="glassy"
                                    startDecorator="RefreshCw"
                                    tooltip={'Switch to profile'}
                                    onPress={() => handleSwitch(isAllowSwitch)}
                                />
                            )}
                            {bAllowEdit && (
                                <Button
                                    rounded
                                    variant="glassy"
                                    startDecorator="Camera"
                                    onPress={() => handleUpload('cover')}
                                />
                            )}
                        </Row>
                        <View className="absolute lg:hidden top-[8px] left-[8px] z-50">
                            {getCoverBackButton()}
                        </View>
                    </View>
                ) : (
                    <></>
                )}
                <View className="p-[8px] sm:p-[12px] lg:p-[16px]">
                    <View
                        className={` flex-col lg:flex-row gap-y-4  ${conductorTheme.content_max_width} mx-auto w-full items-start items-stretch`}
                    >
                        {bPerson && (
                            <View className="w-full h-24 sm:w-52 relative">
                                <View className=" flex-auto absolute w-min rounded-full w-min p-[8px] z-50 -bottom-4 flex-none bg-bgrcard dark:bg-bgrcard-d ">
                                    <Profile
                                        {...data.profile}
                                        displayType="unit_wo_info"
                                        displaySize={'4xl'}
                                    />
                                    {bAllowEdit && (
                                        <View className=" p-1 bg-bgrcard dark:bg-bgrcard-d rounded-full absolute bottom-2 right-2">
                                            <Button
                                                rounded
                                                size="base"
                                                variant="default"
                                                startDecorator="Camera"
                                                onPress={() =>
                                                    handleUpload('picture')
                                                }
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                        <View className=" flex-auto flex-col gap-y-4 px-[4px]  ">
                            <Row className="items-center gap-x-4 gap-y-4 justify-between flex-wrap w-full">
                                <Row className="flex-auto flex-wrap gap-y-4 gap-x-0">
                                    <Row className=" gap-x-2 flex-auto ">
                                        <Text
                                            className={`${props.context?.current?.id == data.profile.id ? TABLET_MODE_FROM+':hidden':''} tracking-tight text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50`}
                                            numberOfLines={2}
                                        >
                                            {data.profile.display_name}
                                        </Text>
                                        <Badges badges={data.badges} />
                                    </Row>
                                    <CoverMenuMeta {...data.meta_menu} />
                                </Row>
                                {isSplitMenu ? <Row className='w-full justify-between'>
                                    <View className='flex-auto items-start'><CoverMenu
                                        {...data.actions_menu}
                                        uri={props?.uri}
                                        isSplitMenu={isSplitMenu}

                                    /></View>
                                    <View className='w-[44px] items-end '>
                                        <CoverMenuMore
                                            {...data.actions_menu}
                                            uri={props?.uri}
                                            isSplitMenu={isSplitMenu}

                                        />
                                    </View>
                                </Row> : <CoverMenu
                                    {...data.actions_menu}
                                    uri={props?.uri}

                                />
                                }
                            </Row>

                            {!!data.profile.info?.date_start && (
                                <Text className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase font-semibold tracking-tight overflow-hidden rounded-md flex-none items-center">
                                    {formatDateInterval(
                                        data.profile.info?.date_start,
                                        data.profile.info?.date_end,
                                        t
                                    )}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}
