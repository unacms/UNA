import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Badges from 'app/ui/atoms/badges'
import { Text } from 'app/design/typography'
import { stripTags } from 'app/lib/util'
import { getBackButtonWeb } from 'app/lib/conductor-helpers'
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Profile from 'app/ui/molecules/profile'
import Menu from 'app/components/menu'
import { useWindowDimensions } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage, md5 } from 'app/lib/util'
import { genRnd, getLayout } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import * as ImageManipulator from 'expo-image-manipulator'
import { Image as ImageNative } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { FeedbackHaptics } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'

function CoverMenu(props) {
    let { width } = useWindowDimensions()
    let size = 'sm'

    if (width < 1280) size = 'sm'

    const isSplitMenu = appSetting('layout', 'split_action_menu')

    let aMenuManageItems = []

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem?.display_type && aItem.display_type != 'link') {
                return true // Exclude this item from the new array
            } else {
                aMenuManageItems.push({
                    id: aItem.id ? aItem.id : aItem.name,
                    link: '/' + aItem.link,
                    title: aItem.title,
                })

                return false // Include this item in the new array
            }
        })
    } else {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem.name != props.uri) {
                return true // Exclude this item from the new array
            } else {
                return false // Include this item in the new array
            }
        })
    }

    return (
        <>
            <Menu
                {...propsCopy}
                displayType="button"
                autoSize={true}
                params={{
                    show_action: true,
                    show_counter: true,
                    show_combined: true,
                    button_variant: 'default',
                    button_size: size,
                    button_rounded: false,
                    button_full_width: false,
                    button_hide_title_on_small: false,
                }}
            />
            {isSplitMenu && propsCopy.items.length > 0 && (
                <View className="ml-2">
                    <DropdownMenu items={aMenuManageItems}>
                        <Button
                            variant="default"
                            size={size}
                            tooltip="Settings"
                            startDecorator="DotsThreeOutline"
                            onPress={() => {
                                FeedbackHaptics('Medium')
                            }}
                        />
                    </DropdownMenu>
                </View>
            )}
        </>
    )
}

function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false)
    return (
        <DropdownPopup
            open={ntfsOpen}
            onOpenChange={(bOpen) => {
                setNtfsOpen(bOpen)
            }}
            size="small"
        >
            {[
                <Button
                    key="btn"
                    variant="text"
                    rounded
                    startDecorator="DotsThreeOutline"
                />,
                <Menu
                    key="menu"
                    {...props}
                    displayType="button"
                    params={{
                        showVertical: true,
                        button_variant: 'text',
                        button_rounded: false,

                        button_full_width: false,
                        button_hide_title_on_small: false,
                    }}
                />,
            ]}
        </DropdownPopup>
    )
}

function CoverMenuMeta(props) {
    return (
        <Menu
            {...props}
            displayType="mixed"
            params={{
                button_variant: 'text',
                button_size: 'sm',
                button_hide_title_on_small: false,
            }}
        />
    )
}

export function CoverSmall(props) {
    const data = props.data
    const { currentUser, setCurrentUser } = useCurrentUser()
    const isUseBg = appSetting('layout', 'use_background')
    const windowDimen = useWindowDimensions()
    const windowWidth = windowDimen.width
    let bPerson = props.data.profile.module == 'bx_persons' ? true : false

    let styles = {}
    if (windowWidth > 1024 && getLayout(currentUser) != 'hor') {
        styles = { width: 1536 - 20 * 16 }
    }

    return (
        <View
            style={styles}
            className={
                (isUseBg
                    ? ' border-b border-bdr dark:border-bdr-d'
                    : '  bg-white dark:bg-neutral-800 border-b border-bdr dark:border-bdr-d') +
                ' w-full '
            }
        >
            <View
                className={
                    appSetting('layout', 'max_width') + ' w-full mx-auto'
                }
            >
                <View className=" px-3 sm:px-4 py-2 flex-row gap-2">
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
    const { currentUser, setCurrentUser } = useCurrentUser()
    const data = props.data
    const mode = props.mode
    let { width } = useWindowDimensions()
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
                                await ImageManipulator.manipulateAsync(uri, [
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
                        const resizedPhoto =
                            await ImageManipulator.manipulateAsync(uri, acts)
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

    const handleInsertImageFinish = async (result, extraVar) => {
        const sRequest =
            '/api.php?r=' +
            props.data.profile.module +
            '/update_image/&params[]=' +
            extraVar.mode +
            '&params[]=' +
            c +
            '&params[]=' +
            result.data.id
        const sResponse = await fetcher(sRequest)
        if (extraVar.mode == 'cover') setCoverUrl(sResponse.data)
        else setPictureUrl(sResponse.data)
    }

    data.profile.url_avatar = pictureUrl

    const isUseBg = appSetting('layout', 'use_background')

    const bAllowEdit = data.allow_edit && appSetting('layout', 'allow_edit_covers');
    
    const foundItem = currentUser?.informer?.find((item) => { return item.id == 'sys-switch-profile-context'});
    let isAllowSwitch = foundItem ? foundItem.msg : false;
    if (isAllowSwitch){
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/);
        isAllowSwitch = match ? match[1] : null
    }

    const handleSwitch = async (id) => {
        const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);       
        setCurrentUser(result.data);
    };

    
    return (
        <View className=' border-b border-bdrnavbar dark:border-bdr-d bg-bgrnavbar dark:bg-bgrnavbar-d ' >
            <View
                className={
                    appSetting('layout', 'max_width') +
                    ' sm:px-4 mx-auto w-full'
                }
            >
                {mode != 'min' ? (
                    <View
                        className={
                            ' duration-500 bg-primary-200  dark:bg-primary-950 aspect-video sm:' +
                            appSetting('layout', 'cover_aspect') +
                            ' w-auto sm:rounded-b-xl overflow-hidden'
                        }
                    >
                        {!!data.cover && (
                            <Image
                                alt={data.group_name}
                                view="cover"
                                sizes="(max-width:1280px) 100vw, 1280px"
                                className="u-cover "
                                src={coverUrl}
                            />
                        )}
                        
                            <Row className="p-4 justify-end gap-x-4">
                               {isAllowSwitch && <Button
                                    rounded
                                    variant="primary"
                                    startDecorator="UserSwitch" 
                                    tooltip={'Switch to profile'}
                                    onPress={() => handleSwitch(isAllowSwitch)}
                                />

                               }
                                {bAllowEdit && (<Button
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
                    <View
                        className={' h-24 w-auto sm:rounded-xl overflow-hidden'}
                    >
                        <View className="absolute lg:hidden top-4 left-4 z-50">
                            {getBackButtonWeb()}
                        </View>
                    </View>
                )}
                <View className=" flex-col md:flex-row gap-x-2 p-3 sm:p-6  ">
                    {bPerson && (
                        <View className=" w-full h-24 md:h-44 lg:h-28 md:w-52 relative">
                            <View className="rounded-full absolute w-min p-1 z-50 duration-200 bottom-0 flex-none bg-bgrcard-h dark:bg-bgrcard-dh ">
                                <Profile
                                    {...data.profile}
                                    displayType="unit_wo_info"
                                    displaySize="4xl"
                                />
                                {bAllowEdit &&
                                    appSetting(
                                        'layout',
                                        'hide_edit_covers'
                                    ) && (
                                        <View className="p-4 absolute -bottom-2 right-0">
                                            <Button
                                                rounded
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
                    
                    <View className="flex-col flex-auto gap-y-3  ">
                        <View className=" flex-auto flex-col gap-y-4 xl:flex-row  justify-between  ">
                        <Row className=" flex-auto items-center gap-x-2  ">
                            <Text
                                className="tracking-tight text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50"
                                numberOfLines={2}
                            >
                                {data.profile.display_name}
                            </Text>
                            <Badges badges={data.badges} />
                        </Row>
                        <CoverMenuMeta {...data.meta_menu} />
                        </View>

                        <CoverMenu {...data.actions_menu} uri={props?.uri} />

                    </View>
                </View>
            </View>
        </View>
    )
}
