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
import { CoverMenuMeta, CoverMenu, CoverMenuSmall } from 'app/components/nav/menu-cover'
import { useTranslation } from 'react-i18next';

const conductorTheme = appSetting('theme', 'conductor');

export function CoverSmall(props) {
    const data = props.data
    const { currentUser, setCurrentUser } = useCurrentUser()
    const isUseBg = appSetting('cover', 'use_background')
    const windowDimen = useWindowDimensions()
    const windowWidth = windowDimen.width
    let bPerson = props.data.profile.module == 'bx_persons' ? true : false

    let styles = {}
    if (windowWidth > LAYOUT_BREAKPOINTS.lg && getLayout(currentUser) != 'hor') {
        // styles = { width: 1536 - 20 * 16 }
    }

    return (
        <View
            style={styles}
            className={
                (isUseBg
                    ? ' border-b border-bdrtabbar dark:border-bdrtabbar-d'
                    : ' bg-bgrtabbar dark:bg-bgrtabbar-d ') +
                ' w-full '
            }
        >
            <View
                className={
                    appSetting('layout', 'max_width') + ' w-full mx-auto'
                }
            >
                <View className={`px-3 sm:px-4 py-2  ${conductorTheme.content_max_width} mx-auto w-full flex-row gap-2`}>
                    <Row className=" items-center flex-auto">
                        {getBackButtonWeb()}
                        {bPerson && (
                            <Profile
                                {...data.profile}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                        )}
                        <View className=" flex-auto pl-2">
                            <Text className="text-lg xl:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 whitespace-nowrap text-ellipsis overflow-hidden">
                                {data.profile.display_name}
                            </Text>
                        </View>
                        <View className=" w-auto my-auto ">
                            <CoverMenuSmall {...data.actions_menu} />
                        </View>
                    </Row>
                </View>
            </View>
        </View>
    )
}

export default function (props) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser()
    const data = props.data
    const cover_mode_by_type = appSetting('cover', 'view_by_module', props.data?.profile?.module);
    const mode = cover_mode_by_type || props.mode
    let bPerson = props.data.profile.module == 'bx_persons' ? true : false
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

                            const resizedPhoto =
                                await manipulateAsync(uri, [
                                    {
                                        resize: {
                                            width: manipulatedWidth,
                                            height: manipulatedHeight,
                                        },
                                    },
                                ])
                                //console.log("resizedPhotoresizedPhoto", resizedPhoto, manipulatedWidth,manipulatedHeight)
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
                        const resizedPhoto =
                            await manipulateAsync(uri, acts)
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
        if (uploadInfo.extraVar.mode == 'cover')
            setCoverUrl(sResponse.data)
        else 
            setPictureUrl(sResponse.data)
    }

    data.profile.url_avatar = pictureUrl

    const isUseBg = appSetting('cover', 'use_background')

    const bAllowEdit = data.allow_edit && appSetting('cover', 'allow_edit');

    const foundItem = currentUser?.informer?.find((item) => { return item.id == 'sys-switch-profile-context' });
    let isAllowSwitch = foundItem ? foundItem.msg : false;
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/);
        isAllowSwitch = match ? match[1] : null
    }

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
        location.reload();
    };

    return (
        <View className=' bg-bgrtabbar dark:bg-bgrtabbar-d ' >
            <View
                className={
                    appSetting('layout', 'max_width') +
                    ' mx-auto w-full max-w-7xl  '
                }
            >
                {mode != 'min' ? (
                    <View
                        className={
                            ' duration-300 bg-primary-200 dark:bg-primary-950 aspect-video sm:' +
                            appSetting('cover', 'aspect_ratio') +
                            ' w-auto xl:rounded-b-xl overflow-hidden'
                        }
                    >
                        {!!data.cover && (
                            <Image
                                alt={data.group_name}
                                view="cover"
                                sizes={LAYOUT_BREAKPOINTS.xl}
                                className="u-cover "
                                src={coverUrl}
                            />
                        )}

                        <Row className="p-4 justify-end gap-x-4">
                            {isAllowSwitch && <Button
                                rounded
                                variant="primary"
                                startDecorator="RefreshCw"
                                tooltip={'Switch to profile'}
                                onPress={() => handleSwitch(isAllowSwitch)}
                            />

                            }
                            {(bAllowEdit) && (<Button
                                rounded
                                startDecorator="Camera"
                                onPress={() => handleUpload('cover')}
                            />)}
                        </Row>


                        <View className="absolute lg:hidden top-4 left-4 z-50">
                            {getBackButtonWeb()}
                        </View>
                    </View>
                ) : (
                    <></>
                )}
                <View className="px-4" >
                    <View className={` py-2 flex-col ${mode === 'min' ? 'lg' : 'md'}:flex-row gap-x-4 ${conductorTheme.content_max_width} mx-auto w-full border-b border-bdrtabbar dark:border-bdrtabbar-d items-start lg:items-stretch`}>
                    {bPerson && (
                        <View className="w-full h-24 sm:w-48 relative   ">
                            
                            <View className=" flex-auto absolute w-min  z50 rounded-full w-min p-2 z-50 bottom-0 flex-none bg-bgrcard dark:bg-bgrcard-d ">
                                <Profile
                                    {...data.profile}
                                    displayType="unit_wo_info"
                                    displaySize="4xl"
                                />
                                {bAllowEdit && (
                                        <View className=" p-1 bg-bgrcard dark:bg-bgrcard-d rounded-full absolute bottom-3 right-1">
                                            <Button
                                                rounded
                                                size="sm"
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


                    <View className=" flex-auto flex-col pb-2 ">

                        <Row className=" flex-row flex-auto items-center py-2 gap-x-2">
                            <Text
                                className="tracking-tight text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50"
                                numberOfLines={2}
                            >
                                {data.profile.display_name}
                            </Text>
                            <Badges badges={data.badges} />
                            
                        </Row>
                        {!!data.profile.info?.date_start && (
                                <Text className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase font-semibold tracking-tight overflow-hidden  rounded-md flex-none items-center">
                                    {formatDateInterval(data.profile.info?.date_start, data.profile.info?.date_end, t)}
                                </Text>

                            )}

                        <CoverMenuMeta {...data.meta_menu} />
                    </View>
                    <View className={` flex-auto w-full max-w-[320px] ${mode !== 'min' && ' lg:items-end '}`}>
                        <CoverMenu {...data.actions_menu} uri={props?.uri} />
                        {/*containerClasses={`${mode === 'min' && 'w-full lg:justify-end'}`}*/}
                    </View>
                    </View>
                </View>
            </View>
        </View>
    )
}
