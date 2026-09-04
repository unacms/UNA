import { View, Row, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import {
    appSetting,
    formatDateInterval,
    cloneObject,
    useDateLocaleTag,
} from 'app/lib/util'
import Profile from 'app/ui/molecules/profile/profile'
import { NeoButtonLink } from 'app/design/controls/neo-button/neo-button'
import { useCurrentUser } from 'app/context/user'
import {
    CoverMenuMeta,
    CoverMenu,
    CoverMenuMore,
} from './menu-cover'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import { getComponent } from 'app/components/registry'
import { useIsDesktop } from 'app/context/measure'
import { PageHeaderSmall } from 'app/ui/molecules/header/page-header'
import {
    CoverImage,
    getCoverBackButton,
    nativeTabsTopPadStyle,
} from './cover-elements'

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

function isCoverActionsMenuInNavbar(module, isDesktop) {
    return isDesktop && !!appSetting('cover', 'more_menu_in_navbar', module)
}

export function CoverSmall({ data, context, showMoreMenu, uri, mode, suppressContextSelector = false, suppressCoverBackButton = false }) {
    const isDesktop = useIsDesktop()
    const { currentUser } = useCurrentUser()
    useDateLocaleTag()
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
        context.list?.[0] &&
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
        appSetting('cover', 'small_cover_avatar_display_size') || 'md'
    const smallCoverNameSize =
        appSetting('cover', 'small_cover_name_display_size') || '2xl'
    const profileTitle = data.profile.display_name || data.profile.title || ''
    const profileUrl = data.profile.url || ''
    const menusInNavbar = isCoverActionsMenuInNavbar(
        data?.profile?.module,
        isDesktop,
    )

    return (
        <Row
            className={`${appSetting('layout', 'page_content_width_default')} ns--cover-small-title-wrapper-- px-3 lg:px-4 mx-auto items-center ne-- `}
            style={nativeTabsTopPadStyle()}
        >
            {!currentUser && !bPerson ? (
                <PageHeaderSmall />
            ) : (
                <>
                    <View className=" ns--cover-small-title-content-- flex-1 shrink items-center flex-row gap-2 h-16 ne-- ">
                        {!suppressCoverBackButton ? (
                                <View className="h-16 justify-center web:lg:hidden">
                                    {getCoverBackButton()}
                                </View>
                            ) : null}

                        <>
                            {(bPerson || coverMode !== 'none') && (
                                <>
                                    <View className="flex-1 shrink min-w-0 h-16 justify-center lg:hidden">
                                        <View className="max-w-full min-w-0 self-start justify-center">
                                            <NeoButtonLink
                                                href={profileUrl}
                                                alt={profileTitle}
                                                style="glass"
                                                controlSize="regular"
                                                borderShape={coverMode !== 'none' ? 'capsule' : 'circle'}
                                                align="start"
                                                contentInsets={coverMode !== 'none' ? 'mediaLeading' : undefined}
                                                accessibilityLabel={profileTitle}
                                                image={bPerson ? (
                                                    <View className="pointer-events-none shrink-0">
                                                        <Profile
                                                            {...data.profile}
                                                            displayType="unit_wo_info"
                                                            displaySize={smallCoverAvatarSize}
                                                            showLinks={false}
                                                        />
                                                    </View>
                                                ) : undefined}
                                                label={coverMode !== 'none' ? profileTitle : undefined}
                                            />
                                        </View>
                                    </View>
                                    <View className="hidden lg:flex flex-row items-center flex-1 shrink gap-2 min-w-0 h-16">
                                        {bPerson ? (
                                            <View className="flex-none shrink-0">
                                                <Profile
                                                    {...data.profile}
                                                    displayType="unit_wo_info"
                                                    displaySize={smallCoverAvatarSize}
                                                />
                                            </View>
                                        ) : null}
                                        {coverMode !== 'none' ? (
                                            <View className="flex-1 shrink overflow-hidden min-w-0">
                                                <Profile
                                                    {...data.profile}
                                                    displayType="unit_wo_image"
                                                    displaySize={smallCoverNameSize}
                                                    showLinks={false}
                                                />
                                            </View>
                                        ) : null}
                                    </View>
                                </>
                            )}
                            {isAddSelector && !suppressContextSelector && (
                                <View
                                    className={`${TABLET_MODE_FROM}:hidden w-full flex-1 `}
                                >
                                    <ContextSelector
                                        data={context}
                                        url={uri}
                                        uri={uri}
                                        mode={coverMode !== 'none' ? "min" : "full"}
                                    />
                                </View>
                            )}
                        </>

                    </View>
                    {!menusInNavbar && (
                        <View className=" ns--cover-small-title-menu-wrapper-- items-center justify-center h-16 ne--">
                            <Row className=" ns--cover-small-title-menu-content-- w-full items-center justify-between ne-- ">
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
                                    <View className="h-16 justify-center">
                                        <CoverMenuMore
                                            {...menu}
                                            uri={uri}
                                            allowZeroPersistant={!isDesktop}
                                            isSplitMenu={!showMoreMenu}
                                        />
                                    </View>
                                </>
                            </Row>
                        </View>
                    )}
                </>
            )}
        </Row>
    )
}

export default function Cover({
    data,
    mode,
    uri,
    showMoreMenu,
    pageData,
    context,
    suppressContextSelector = false,
    suppressCoverBackButton = false,
}) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const isDesktop = useIsDesktop()
    useDateLocaleTag()
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
        data?.allow_edit && appSetting('cover', 'allow_edit')
    const foundItem = currentUser?.informer?.find((item) => {
        return item.id == 'sys-switch-profile-context'
    })
    let isAllowSwitch =
        appSetting('cover', 'allow_switch') && foundItem 
            ? foundItem.msg
            : false
    if (isAllowSwitch) {
        let match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }

    const isMin = coverMode === 'min'
    const hasCoverImage = !isMin && !!data?.cover?.src
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
                {appSetting('context_selector', 'show_always') && !suppressContextSelector ? (
                    <View style={nativeTabsTopPadStyle()}>
                        <Row
                            className={`web:${TABLET_MODE_FROM}:hidden items-center bg-card justify-between w-full px-3 h-14`}
                        >
                            <View className={`flex-1 justify-center`}>
                                <ContextSelector data={context} url={uri} uri={uri} mode="compact" />
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
                    </View>
                ) : (
                    <></>
                )}
            </>
        )
    }

    return (
        <View className={`${appSetting('layout', 'page_content_width_default')} ns--cover-wrapper-- mx-auto ne-- `}>
            {appSetting('context_selector', 'show_always') && !suppressContextSelector ? (
                <View style={nativeTabsTopPadStyle()}>
                    <Row
                        className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2 `}
                    >
                        <View className={`${TABLET_MODE_FROM}:hidden flex-1`}>
                            <View className="flex-1 justify-center ">
                                <ContextSelector data={context} url={uri} uri={uri} mode="compact" />
                            </View>
                        </View>
                        <View className="w-12 h-12 "></View>
                    </Row>
                </View>
            ) : (
                <></>
            )}
            {!isMin && (
                <View className={`w-full ${appSetting('cover', 'aspect_ratio')}`}>
                    <CoverImage
                        mode="cover"
                        coverData={data?.cover}
                        profileData={profileData}
                        allowEdit={bAllowEdit}
                        allowSwitch={isAllowSwitch}
                        suppressCoverBackButton={suppressCoverBackButton}
                        priority
                    />
                </View>
            )}
            <View
                className={`w-full lg:flex-row mx-auto gap-3 lg:gap-4 px-3 pt-3 lgpx-4 z-50`}
            >
                {bPerson && (
                    <View className="hidden lg:flex flex-none h-24 w-42 justify-end">
                        <View className=" rounded-full p-1 absolute -bottom-1 flex-none bg-card ">
                            <CoverImage
                                is_person={bPerson}
                                mode="picture"
                                profileDisplaySize={isMin ? 'xl' : '3xl'}
                                coverData={data?.cover}
                                profileData={profileData}
                                allowEdit={bAllowEdit}
                                allowSwitch={isAllowSwitch}
                                priority={!hasCoverImage}
                            />
                        </View>
                    </View>
                )}
                <View
                    className={`flex web:flex-1 sm:gap-3 ${bPerson ? 'lg:flex-row flex-col-reverse' : 'lg:flex-row flex-col-reverse'}`}
                >
                    <View className="flex-none gap-1 ">
                        {isDesktop && <Row className="gap-2 items-center min-h-14">
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

                    <View className="flex-row web:flex-auto items-center lg:items-end lg:justify-end gap-2 ">
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
                                        priority={!hasCoverImage}
                                    />
                                </View>
                            </View>
                        )}
                        {isDesktop && !menusInNavbar && (
                            <View className=" flex-row justify-end ml-auto ">
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
                            {!isDesktop && (
                            <Row className="flex-1 min-w-0 flex-wrap items-center gap-2 min-h-10">
                            <Text
                                className="min-w-0 flex-1 tracking-tight text-2xl sm:text-3xl font-bold text-foreground"
                            >
                                {profileData.display_name ||
                                    profileData.title ||
                                    ''}
                            </Text>
                            <Badges badges={data.badges} size="xs" />
                        </Row>
                            )}
                    </View>

                </View>
                {!isDesktop && !menusInNavbar && (
                    <Row className="items-center flex-wrap gap-2 mb-2">
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
