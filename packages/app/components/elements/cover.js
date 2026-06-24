import { useState } from 'react'
import { View, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import {
    appSetting,
    formatDateInterval,
    cloneObject,
    uploadImage,
    md5,
    LAYOUT_BREAKPOINTS,
    prepareImageForUpload,
} from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import * as ImagePicker from 'expo-image-picker'
import { NeoButton } from 'app/design/controls/neo-button'
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
import { usePathname, useRouter } from 'app/lib/hooks/router'
import { getComponent } from 'app/components/registry'
import { useIsDesktop } from 'app/context/measure'
import { PageHeaderSmall } from 'app/ui/molecules/page_header'
import { canGoBackInTab, getTabKeyFromPathname, navigateBackInTab } from 'app/lib/tab-history'
import { FeedbackHaptics } from 'app/lib/util'
const conductorTheme = appSetting('theme', 'conductor')
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

function isCoverActionsMenuInNavbar(module, isDesktop) {
    return isDesktop && !!appSetting('cover', 'more_menu_in_navbar', module)
}

const BackButton = ({ isPerson }) => {
    const router = useRouter()
    const pathname = usePathname()
    const { currentUser } = useCurrentUser()
    const currentTab = getTabKeyFromPathname(pathname)
    const hasTabBack = canGoBackInTab(currentTab)

    const handleBackPress = () => {
        FeedbackHaptics('Medium')
        navigateBackInTab(router, currentTab, currentUser)
    }

    if (hasTabBack){
        return <Button
            variant="default"
            size="sm"
            rounded={true}
            startDecorator="ArrowLeft"
            onPress={() => {
                handleBackPress()
            }}
        />
    }
}

function GetCoverBackButton({ isPerson }) {
    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop()
    const buttonVariant = isDesktop ? 'glass' : 'glass'
    if (isWeb) return <></>
    if (!isWeb) return <BackButton isPerson={isPerson} />
    if (history.length > 2) {
        return (
            <View className="lg:hidden">
                <NeoButton
                    image="ArrowLeft"
                    style={buttonVariant}
                    controlSize="regular"
                    borderShape="circle"
                    onPress={() => history.back()}
                />
            </View>
        )
    } else {
        return (
            <View className="lg:hidden">
                <Link href="/">
                    <NeoButton
                        image="ArrowLeft"
                        style={buttonVariant}
                        controlSize="regular"
                        borderShape="circle"
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
    const isDesktop = useIsDesktop()
    const { currentUser } = useCurrentUser()
    const isWeb = Platform.OS === 'web'
    if (!data?.profile?.module) return null

    const bPerson =
        data?.profile?.module == 'bx_persons' ||
            appSetting('cover', 'show_pic_by_module', data?.profile?.module)
            ? true
            : false
    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode

    const coverModeSmall =
        appSetting('cover', 'view_by_module_small', data?.profile?.module) || mode


    const isAddSelector =
        context &&
        context.list[0] &&
        data.profile.module == context.list[0].module
    const ContextSelector = getComponent('molecule', 'context_selector')
    /*if (isDesktop && isAddSelector) {
        return null
    }*/

    if ((coverMode === 'none' || coverModeSmall === 'none') && isDesktop) {
        return null
    }

    // Keep the per-item `persistent` flag from the API intact so the small cover's
    // CoverMenu can surface persistent buttons (Option A). Previously this forced
    // persistent:0 on every item, which made the split inert in the small cover.
    let menu = cloneObject(data.actions_menu)
    if (menu.persistent > 1) {
        menu.persistent = 1
    }

    const smallCoverAvatarSize =
        appSetting('cover', 'small_cover_avatar_display_size') || 'base'
    const smallCoverNameSize =
        appSetting('cover', 'small_cover_name_display_size') || (isDesktop ? '2xl' : 'lg')
    const menusInNavbar = isCoverActionsMenuInNavbar(
        data?.profile?.module,
        isDesktop,
    )

    return (
        <View
            className={`${conductorTheme.menu_max_width} flex-row`}
        >
            {!currentUser && !bPerson ? (
                <PageHeaderSmall />
            ) : (
                <>
                    <View className="flex-1 shrink items-center flex-row gap-2 h-14 ">
                        {(!appSetting('context_selector', 'show_always') ||
                            !isWeb) && (
                                <>
                                    {getCoverBackButton(bPerson)}
                                </>
                            )}

                        <>
                            {(bPerson || coverMode !== 'none') && (
                                <View className="items-center flex-row flex-1 shrink gap-2 ">
                                    {bPerson && (
                                        <View className="flex-none shrink-0">
                                            <Profile
                                                {...data.profile}
                                                displayType="unit_wo_info"
                                                displaySize={'base'}
                                            />
                                        </View>
                                    )}
                                    {(coverMode !== 'none') && (
                                        <View className="flex-1 shrink overflow-hidden ">
                                            <Profile
                                                {...data.profile}
                                                displayType="unit_wo_image"
                                                displaySize={smallCoverNameSize}
                                                showLinks={false}
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                            {isAddSelector && (
                                <View
                                    className={`${TABLET_MODE_FROM}:hidden w-full `}
                                >
                                    <ContextSelector
                                        data={context}
                                        mode={coverMode !== 'none' ? "min" : "full"}
                                    />
                                </View>
                            )}
                        </>

                    </View>
                    {!menusInNavbar && (
                        <View className=" items-center justify-center h-14">
                            <Row className="w-full justify-between gap-2">
                                {!showMoreMenu &&
                                    (!appSetting(
                                        'cover',
                                        'hide_cover_menu_on_narrow',
                                    ) ||
                                        isDesktop) && (
                                        <>
                                            <CoverMenu
                                                {...menu}
                                                uri={uri}
                                                isSplitMenu={true}
                                            />
                                        </>
                                    )}
                                <>
                                    <CoverMenuMore
                                        {...menu}
                                        uri={uri}
                                        allowZeroPersistant={!isDesktop}
                                        isSplitMenu={!showMoreMenu}
                                    />
                                </>
                            </Row>
                        </View>
                    )}
                </>
            )}
        </View>
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
        mode == 'cover' ? coverData?.src : profileData?.url_avatar,
    )
    const [isUploading, setIsUploading] = useState(false)

    const uo =
        (profileData?.module || '') +
        (mode == 'cover' ? '_cover_crop' : '_picture_crop')
    const so = coverData?.storage || ''
    const img_trans = ''
    const c = profileData?.info?.id || profileData?.id || 0

    const handleSwitch = async (id) => {
        const result = await fetcher(
            '/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' +
            id,
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
        if (!result.canceled && Array.isArray(result.assets)) {
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
                        { hash: hash, mode: mode },
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
                className={` bg-accent/50 lg:rounded-xl w-full ${appSetting(
                    'layout',
                    'max_width_content',
                )} mx-auto gap-2 flex-1
                  overflow-hidden ${isCover ? `${appSetting('cover', 'aspect_ratio')}` : 'pb-32'
                    }`}
            >
                {isCover && (
                    <Image
                        alt={title}
                        view="cover"
                        sizes={LAYOUT_BREAKPOINTS.xl}
                        className="u-cover"
                        src={imageUrl}
                    />
                )}
                {(imageUrl?.includes('data:') || isUploading) && (
                    <View className="absolute inset-0 h-full w-full opacity-60 bg-card justify-center items-center">
                        <Loading />
                    </View>
                )}
                <Row className=" justify-end gap-2 absolute top-3 right-3  ">
                    {allowSwitch && (
                        <NeoButton
                            image="RefreshCw"
                            style="bordered"
                            controlSize="regular"
                            borderShape="circle"
                            onPress={() => handleSwitch(allowSwitch)}
                        />
                    )}
                    {allowEdit && (
                        <NeoButton
                            image="Camera"
                            label="Edit Cover"
                            style="bordered"
                            controlSize="regular"
                            borderShape="capsule"
                            disabled={isUploading}
                            onPress={() => handleUpload(mode)}
                        />
                    )}
                </Row>
                <View className="absolute lg:hidden top-3 left-3 z-50 ">
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
                    <View className="  absolute bottom-1 rounded-full p-1 bg-card right-1 ">
                        <NeoButton
                            image="Camera"
                            style="glass"
                            controlSize="regular"
                            borderShape="circle"
                            disabled={isUploading}
                            onPress={() => handleUpload(mode)}
                        />
                    </View>
                )}
            </>
        )
    }
}

export default function Cover({
    data,
    mode,
    uri,
    showMoreMenu,
    pageData,
    context,
}) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const isDesktop = useIsDesktop()
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
    let isAllowSwitch =
        appSetting('cover', 'allow_switch') && foundItem && isWeb
            ? foundItem.msg
            : false
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }

    const isMin = coverMode === 'min'
    const menusInNavbar = isCoverActionsMenuInNavbar(
        profileData?.module,
        isDesktop,
    )

    const ContextSelector = getComponent('molecule', 'context_selector')
    const Badges = getComponent('molecule', 'badges')

    if (coverMode === 'none') {
        if (isWeb) return null

        return (
            <>
                {appSetting('context_selector', 'show_always') ? (
                    <Row
                        className={`web:${TABLET_MODE_FROM}:hidden items-center bg-card justify-between w-full px-3 h-14`}
                    >
                        <View className={`flex-1 justify-center`}>
                            <ContextSelector data={context} mode="compact" />
                        </View>
                        {!!data?.actions_menu && !menusInNavbar && (
                            <View className={`bg-card/70`}>
                                <CoverMenuMore
                                    {...data.actions_menu}
                                    uri={uri}
                                    isSplitMenu={true}
                                />
                            </View>
                        )}
                    </Row>
                ) : (
                    <></>
                )}
            </>
        )
    }

    return (
        <View className={`mx-auto ${appSetting('layout', 'max_width')}`}>
            {appSetting('context_selector', 'show_always') ? (
                <Row
                    className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2 `}
                >
                    <View className={`${TABLET_MODE_FROM}:hidden `}>
                        <View>
                            <ContextSelector data={context} mode="compact" />
                        </View>
                    </View>
                </Row>
            ) : (
                <></>
            )}
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
                    'max_width_content',
                )} lg:flex-row mx-auto w-full p-3 gap-3 lg:gap-4 z-50`}
            >
                {bPerson && (
                    <View className="hidden lg:flex flex-none h-24 w-42 justify-end">
                        <View className=" rounded-full p-1 absolute bottom-0 flex-none bg-card ">
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
                <View
                    className={`flex web:flex-1 sm:gap-3 ${bPerson ? 'lg:flex-row flex-col-reverse' : 'lg:flex-row flex-col-reverse'}`}
                >
                    <View className="flex-none ">
                        {isDesktop && <Row className="gap-2 flex-none items-center min-h-12">
                            <Text
                                className={` min-w-0 tracking-tight text-2xl sm:text-3xl font-bold text-foreground`}
                                numberOfLines={2}
                            >
                                {profileData.display_name ||
                                    profileData.title ||
                                    ''}
                            </Text>
                            <Badges badges={data.badges} size="xs" />
                        </Row>}
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
                                    t,
                                )}
                            </Text>
                        )}
                    </View>

                    <View className="flex-row web:flex-1 flex-wrap gap-2 lg:justify-between justify-start">
                        {bPerson && (
                            <View
                                className={`${isMin ? 'h-24' : 'h-11'
                                    } lg:hidden flex-none justify-end `}
                            >
                                <View className=" flex-row  rounded-full p-1 flex-none bg-card mr-auto ">
                                    <CoverImage
                                        mode="picture"
                                        profileDisplaySize={
                                            isMin ? '2xl' : '2xl'
                                        }
                                        coverData={data?.cover}
                                        profileData={profileData}
                                        allowEdit={bAllowEdit}
                                        allowSwitch={isAllowSwitch}
                                    />
                                </View>
                            </View>
                        )}
                        {isDesktop && !menusInNavbar && (
                            <View className="gap-2 flex-row justify-end ml-auto">
                                <CoverMenu
                                    {...data.actions_menu}
                                    uri={uri}
                                    isSplitMenu={true}
                                />
                                <CoverMenuMore
                                    {...data.actions_menu}
                                    uri={uri}
                                    isSplitMenu={true}
                                />
                            </View>
                        )}
                            {!isDesktop && <Row className="gap-2 flex-none min-w-0 items-center min-h-10">
                            <Text
                                className="min-w-0 truncate tracking-tight text-xl sm:text-3xl font-bold text-foreground"
                                numberOfLines={1}
                            >
                                {profileData.display_name ||
                                    profileData.title ||
                                    ''}
                            </Text>
                            <Badges badges={data.badges} size="xs" />
                        </Row>}
                    </View>

                </View>
                {!isDesktop && !menusInNavbar && (
                    <Row className="justify-between items-center">
                        <CoverMenu
                            {...data.actions_menu}
                            uri={uri}
                            isSplitMenu={true}
                        />

                        <CoverMenuMore
                            {...data.actions_menu}
                            uri={uri}
                            isSplitMenu={true}
                        />
                    </Row>
                )}
            </View>
        </View>
    )
}
