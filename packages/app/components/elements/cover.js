import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Badges from 'app/ui/atoms/badges'
import { Text } from 'app/design/typography'
import { getBackButtonWeb } from 'app/lib/common-helpers'
import { Button } from 'app/design/controls'
import { appSetting, formatDateInterval } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, md5, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { genRnd } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { manipulateAsync } from 'expo-image-manipulator'
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
import { useRouter, useNavigation } from 'app/lib/hooks/router'
import { useWindowDimensions } from 'react-native';

const conductorTheme = appSetting('theme', 'conductor')
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');


const BackButton = ({ isPerson }) => {
    const router = useRouter()
    const navigation = useNavigation();



    return isPerson && navigation.getState().index == 0 ? (
        <Link href={appSetting("cover", "back_button_url_for_profile")}>
            <Button
                variant="default"
                size="base"
                rounded={true}
                startDecorator="ArrowLeft"
            />
        </Link>
    ) : (
        <Button
            variant="default"
            size="base"
            rounded={true}
            startDecorator="ArrowLeft"
            onPress={() => { goBack(navigation, router) }}
        />
    );
};


function getCoverBackButton(is_person) {
    const isWeb = Platform.OS === 'web'
    if (!isWeb) return <BackButton isPerson={is_person} />
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-1">
                <Button
                    rounded={true}
                    size="base"
                    variant="default"
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
                        variant="default"
                        startDecorator="ArrowLeft"
                    />
                </Link>
            </View>
        )
    }
}

export function CoverSmall({ data, context, showMoreMenu, uri, mode }) {

    const bPerson = data.profile.module == 'bx_persons' || appSetting('cover', 'show_pic_by_module', data?.profile?.module) ? true : false
    const isSplitMenu = appSetting('cover', 'split_action_menu') && data.actions_menu.persistent == 0
    const coverMode = appSetting('cover', 'view_by_module', data?.profile?.module) || mode

    if (coverMode === 'none') {
        return null
    }

    return (
        <View className={`px-[12px] sm:px-[16px] py-[10px]  ${conductorTheme.content_max_width} mx-auto w-full flex-row gap-2`} >
            <Row className=" gap-x-2 items-center justify-between flex-auto">
                <View className={` flex-auto flex-row gap-x-[8px] items-center `}>
                    {getCoverBackButton(bPerson)}
                    <Row className={` ${context?.current?.id == data.profile.id ? TABLET_MODE_FROM + ':flex gap-x-[8px]' : 'gap-x-[8px] flex-auto'}`}>
                        {bPerson && (
                            <Profile
                                {...data.profile}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                        )}
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_image"
                            displaySize="xl"
                        />
                    </Row>
                </View>
                <View className=" items-end">
                    {isSplitMenu ? <Row className='w-full justify-between'>
                        {showMoreMenu && <View className='w-[44px]'>
                            <CoverMenuMore
                                {...data.actions_menu}
                                uri={uri}
                                isSplitMenu={false}

                            />
                        </View>}
                        {!showMoreMenu && <CoverMenu
                            {...data.actions_menu}
                            uri={uri}
                            isSplitMenu={isSplitMenu}
                        />
                        }
                    </Row> : <CoverMenu
                        {...data.actions_menu}
                        uri={uri}
                    />
                    }
                </View>
            </Row>
        </View>
    )
}

function CoverImage({ mode, profileData, coverData, allowEdit, allowSwitch, title, profileDisplaySize, is_person }) {
    const [imageUrl, setImageUrl] = useState(mode == 'cover' ? coverData.src : profileData.url_avatar)

    const uo = profileData.module + '_cover_crop'
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
        return (<View className={`duration-300 bg-primary-200 lg:rounded-lg lg:mt-3 dark:bg-primary-950 w-full ${appSetting('layout', 'max_width_content')} mx-auto overflow-hidden ${isCover
            ? ` h-[30vh] sm:${appSetting(
                'cover',
                'aspect_ratio'
            )}`
            : 'pb-[128px]'
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
            {imageUrl?.includes('data:') && <View className='h-full w-full opacity-50 bg-bgrtabbar dark:bg-bgrtabbar-d w-full opacity-50 justify-center'><Loading /></View>}
            <Row className="p-[8px] sm:px-[16px] justify-end gap-x-[8px] ">
                {allowSwitch && (
                    <Button
                        rounded
                        variant="default"
                        startDecorator="RefreshCw"
                        tooltip={'Switch to profile'}
                        onPress={() => handleSwitch(allowSwitch)}
                    />
                )}
                {allowEdit && (
                    <Button
                        rounded
                        variant="default"
                        startDecorator="Camera"
                        onPress={() => handleUpload(mode)}
                    />
                )}
            </Row>
            <View className="absolute lg:hidden top-[8px] left-[8px] z-50 ">
                {getCoverBackButton(is_person)}
            </View>
        </View>)
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
                    <View className=" bg-white dark:bg-neutral-900 rounded-full absolute bottom-[6px] right-0">
                        <Button
                            rounded
                            size="sm"
                            ring="p-[2px]"
                            variant="default"
                            startDecorator="Camera"
                            onPress={() =>
                                handleUpload(mode)
                            }
                        />
                    </View>
                )}
            </>
        )
    }
}

export default function ({ data, mode, uri, showMoreMenu }) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const isWeb = Platform.OS === 'web'

    const coverMode = appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const bPerson = data.profile.module == 'bx_persons' || appSetting('cover', 'show_pic_by_module', data?.profile?.module) ? true : false
    const bAllowEdit = data.allow_edit && appSetting('cover', 'allow_edit') && isWeb
    const foundItem = currentUser?.informer?.find((item) => {
        return item.id == 'sys-switch-profile-context'
    })
    let isAllowSwitch = foundItem && isWeb ? foundItem.msg : false
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }
    const isSplitMenu = appSetting('cover', 'split_action_menu') && data.actions_menu.persistent == 0
    const isMin = coverMode === 'min';
    const { width: windowWidth } = useWindowDimensions();

    if (coverMode === 'none') {
        return null
    }

    return (

        <View className={`w-full mx-auto ${appSetting('layout', 'max_width')}`}>
            {!isMin && (<CoverImage mode='cover' coverData={data?.cover} profileData={data.profile} allowEdit={bAllowEdit} allowSwitch={isAllowSwitch} />)}
            <View className={` ${appSetting('layout', 'max_width_content')} lg:flex-row gap-y-3 gap-x-3 mx-auto w-full lg:items-end px-3 pt-2.5 sm:px-4 sm:pt-4`} >

                {bPerson && (
                    <View className="hidden lg:flex flex-none h-[96px] justify-end w-min ">
                        <View className=" flex-auto z-50 rounded-full p-[4px] flex-none bg-white dark:bg-neutral-900 translate-y-[4px] -translate-x-[4px]">
                            <CoverImage is_person={bPerson} mode='picture' profileDisplaySize={isMin ? '2xl' : '4xl'} coverData={data?.cover} profileData={data.profile} allowEdit={bAllowEdit} allowSwitch={isAllowSwitch} />
                        </View>
                    </View>
                )}
                <View className="flex-auto lg:flex-row flex-col-reverse gap-y-[8px] sm:gap-y-[12px]">
                    <View className="flex-col flex-auto gap-y-[8px] ">
                        <Row className=" gap-x-[12px] flex-auto items-center min-h-[44px]">
                            <Text
                                className={` tracking-tight text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-50`}
                                numberOfLines={2}
                            >
                                {data.profile.display_name}
                            </Text>
                            <Badges badges={data.badges} />
                        </Row>
                        {isWeb ? <CoverMenuMeta {...data.meta_menu} /> : <ScrollView horizontal={true}><CoverMenuMeta {...data.meta_menu} /></ScrollView>}
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
                    <View className="flex-row flex-wrap items-end justify-between  flex-auto gap-x-[8px] gap-y-[8px]">
                        {isSplitMenu ? (
                            <View className="flex-row sm:items-end  flex-wrap gap-x-[12px] lg:ml-auto sm:gap-x-[16px] gap-y-[8px] sm:gap-y-[12px] ">
                                {bPerson && (
                                    <View className={`${isMin ? 'h-[96px]' : 'h-[44px]'} lg:hidden flex-auto justify-end `}>
                                        <View className=" flex-row flex-auto z-50 rounded-full p-[4px] flex-none bg-white mr-auto dark:bg-neutral-900 translate-y-[4px] -translate-x-[4px] ">
                                            <CoverImage mode='picture' profileDisplaySize={isMin ? '2xl' : '3xl'} coverData={data?.cover} profileData={data.profile} allowEdit={bAllowEdit} allowSwitch={isAllowSwitch} />
                                        </View>
                                    </View>
                                )}
                                <View className="ывапв flex-row flex-wrap gap-x-[8px] gap-y-[8px] sm:gap-y-[12px] items-center">
                                    <CoverMenu
                                        {...data.actions_menu}
                                        uri={uri}
                                        isSplitMenu={isSplitMenu}
                                        containerClasses="gap-x-2"
                                    />
                                </View>
                                {showMoreMenu && <View className="w-[44px] items-end ">
                                    <CoverMenuMore
                                        {...data.actions_menu}
                                        uri={uri}
                                        isSplitMenu={isSplitMenu}
                                    />
                                </View>}
                            </View>
                        ) : (
                            <CoverMenu
                                {...data.actions_menu}
                                uri={uri}
                                persistent={2}
                            />
                        )}
                    </View>

                </View>
            </View>
        </View>

    )
}
