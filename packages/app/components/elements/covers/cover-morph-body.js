'use client'

import { View, Row, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import {
    appSetting,
    formatDateInterval,
    cloneObject,
    cn,
    isWeb,
    useDateLocaleTag,
} from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { useIsDesktop, useBreakpointName } from 'app/context/measure'
import { getComponent } from 'app/components/registry'
import {
    CoverMenuMeta,
    CoverMenu,
    CoverMenuMore,
} from './menu-cover'
import { Platform } from 'react-native'
import { CoverImage, CoverBackButton } from './cover-elements'
import { useShowCoverBackButton } from 'app/components/elements/use-cover-back'
import {
    AVATAR_COLLAPSED,
    TITLE_EXPANDED,
    TITLE_COLLAPSED,
    MORPH_TRANSITION,
    MORPH_BAR,
    TABLET_MODE_FROM,
    getCoverMorphSizing,
} from './constants'

/**
 * Shared CoverMorph identity + cover image markup. Platform shells supply
 * scroll drivers, sticky/overlay wrappers, and optional tab bar children.
 */
export function CoverMorphBody({
    data,
    mode,
    uri,
    context,
    stickyTop = 0,
    showImage = true,
    collapsed = false,
    suppressContextSelector = false,
    suppressCoverBackButton = false,
    barRef,
    coverRef,
    tabBarRef,
    onBarLayout,
    flowH,
    children,
    barClassName,
    barStyle,
    tabBarClassName,
    tabBarStyle,
    onSlotLayout,
}) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    useDateLocaleTag()
    const isDesktop = useIsDesktop()
    const breakpointName = useBreakpointName()
    const sizing = getCoverMorphSizing(isDesktop)
    const profileData = data?.profile
    const canShowBack = useShowCoverBackButton()
    const showCoverBack = !suppressCoverBackButton && canShowBack

    if (!profileData?.module) return null

    const contentWidth = appSetting('layout', 'page_content_width_default')
    const coverBase = appSetting('theme', 'conductor').cover_base
    const coverMode =
        appSetting('cover', 'view_by_module', profileData?.module) || mode
    const bPerson =
        profileData?.module == 'bx_persons' ||
        appSetting('cover', 'show_pic_by_module', profileData?.module)
    const bAllowEdit = data?.allow_edit && appSetting('cover', 'allow_edit')

    const foundItem = currentUser?.informer?.find(
        (item) => item.id == 'sys-switch-profile-context',
    )
    let isAllowSwitch =
        appSetting('cover', 'allow_switch') && foundItem ? foundItem.msg : false
    if (isAllowSwitch) {
        const match = isAllowSwitch.match(/switch_to_profile=(\d+)/)
        isAllowSwitch = match ? match[1] : null
    }

    const isMin = coverMode === 'min'
    const isNone = coverMode === 'none'
    const coverAllowed = showImage && !isMin && !isNone
    // Same on web and native: hide the cover image once collapsed.
    // Web keeps an empty flow-sized box so sticky collapse can still expand.
    const hasImageBlock = coverAllowed && !collapsed
    const keepCoverFlow = coverAllowed && collapsed && Platform.OS === 'web'
    const menusInNavbar =
        isDesktop &&
        !!appSetting('cover', 'more_menu_in_navbar', profileData?.module)
    const collapseActionsToMore = collapsed && !isDesktop

    const profileTitle = profileData.display_name || profileData.title || ''
    const metaMenuItems = (data.meta_menu?.items || []).slice(
        0,
        breakpointName ? undefined : 2,
    )
    const metaMenuCompact = data?.meta_menu
        ? {
            ...data.meta_menu,
            items: metaMenuItems.map((item) => {
                if (!item?.list?.length) return item
                const next = { ...item }
                delete next.list
                return next
            }),
        }
        : null
    const metaDate = !!profileData.info?.date_start && (
        <Text
            numberOfLines={1}
            className="text-muted-foreground text-xs leading-5 uppercase font-semibold tracking-tight"
        >
            {formatDateInterval(
                profileData.info?.date_start,
                profileData.info?.date_end,
                t,
            )}
        </Text>
    )

    // Same source as Cover — do not gate on a separate flag (actions_menu is enough).
    let menu = data?.actions_menu ? cloneObject(data.actions_menu) : null
    if (menu && menu.persistent > 1) {
        menu.persistent = 1
    }

    const ContextSelector = getComponent('molecule', 'context_selector')
    const Badges = getComponent('molecule', 'badges')

    const isAddSelector =
        !suppressContextSelector &&
        context &&
        context.list?.[0] &&
        profileData.module == context.list[0].module
    const showAlwaysSelector =
        !suppressContextSelector && appSetting('context_selector', 'show_always')

    const { avatarExpandedKey, avatarCollapsedWidthClass, avatarHeightClass, stripH } =
        sizing

    return (
        <>
            {hasImageBlock || keepCoverFlow ? (
                <View
                    ref={coverRef}
                    className={`relative w-full ${coverBase}`}
                >
                    {hasImageBlock ? (
                        <View className={`${contentWidth} mx-auto w-full`}>
                            {showAlwaysSelector ? (
                                <Row
                                    className={`${TABLET_MODE_FROM}:hidden items-center w-full h-14 px-2`}
                                >
                                    <View className="flex-1 justify-center">
                                        <ContextSelector
                                            data={context}
                                            url={uri}
                                            uri={uri}
                                            mode="compact"
                                        />
                                    </View>
                                    <View className="w-12 h-12" />
                                </Row>
                            ) : null}
                            <View
                                className={`w-full ${appSetting('cover', 'aspect_ratio')}`}
                            >
                                <CoverImage
                                    mode="cover"
                                    coverData={data?.cover}
                                    profileData={profileData}
                                    allowEdit={bAllowEdit}
                                    allowSwitch={isAllowSwitch}
                                    // Web: back lives in the collapsed morph bar only.
                                    // Native: page header is hidden on profile — keep back on the cover.
                                    suppressCoverBackButton={
                                        suppressCoverBackButton || Platform.OS === 'web'
                                    }
                                    priority
                                />
                            </View>
                        </View>
                    ) : (
                        <View className={`${contentWidth} mx-auto w-full`}>
                            {showAlwaysSelector ? (
                                <View className="w-full h-14" />
                            ) : null}
                            <View
                                className={`w-full ${appSetting('cover', 'aspect_ratio')}`}
                            />
                        </View>
                    )}
                </View>
            ) : null}
            <View
                ref={barRef}
                onLayout={onBarLayout}
                className={cn(
                    'z-50 w-full overflow-visible',
                    coverBase,
                    MORPH_TRANSITION,
                    barClassName,
                )}
                style={barStyle}
            >
                <View
                    className={cn(
                        'relative z-10 gap-3 px-3 lg:px-4 mx-auto w-full overflow-visible',
                        contentWidth,
                        collapsed
                            ? cn('flex-row items-center', MORPH_BAR)
                            : 'flex-col lg:flex-row items-start lg:items-end pt-3 pb-4',
                    )}
                >
                    {showCoverBack ? (
                        <View
                            aria-hidden={!collapsed}
                            className={cn(
                                'web:lg:hidden justify-center  web:transition-[width,opacity]',
                                MORPH_TRANSITION,
                                collapsed
                                    ? cn(
                                        avatarHeightClass,
                                        `${avatarCollapsedWidthClass} opacity-100`,
                                    )
                                    : 'hidden',
                            )}
                        >
                            <CoverBackButton isPerson={bPerson} />
                        </View>
                    ) : null}
                    {!!bPerson && (
                        <View
                            onLayout={onSlotLayout}
                            className={cn(
                                'ns--cover-morph-slot-- relative shrink-0 overflow-visible web:transition-[width,height]',
                                MORPH_TRANSITION,
                                collapsed
                                    ? cn(
                                        avatarHeightClass,
                                        avatarCollapsedWidthClass,
                                    )
                                    : cn(
                                        avatarHeightClass,
                                        'w-28 lg:h-24 lg:w-42',
                                    ),
                            )}
                        >
                            <View
                                className={
                                    collapsed
                                        ? 'relative'
                                        : 'absolute -bottom-1 left-0 rounded-full p-1 bg-card'
                                }
                            >
                                <CoverImage
                                    is_person={bPerson}
                                    mode="picture"
                                    profileDisplaySize={
                                        collapsed
                                            ? AVATAR_COLLAPSED
                                            : avatarExpandedKey
                                    }
                                    coverData={data?.cover}
                                    profileData={profileData}
                                    allowEdit={bAllowEdit && !collapsed}
                                    allowSwitch={isAllowSwitch}
                                    animated
                                    priority
                                />
                            </View>
                        </View>
                    )}
                    {!isNone ? (
                        <View
                            className={cn(
                                'min-w-0 justify-center overflow-visible',
                                collapsed ? 'flex-1' : 'w-full lg:flex-1',
                            )}
                        >
                            <View
                                className={cn(
                                    'self-start max-w-full',
                                    collapsed && 'h-11 justify-center',
                                )}
                            >
                                <Row
                                    className={cn(
                                        'items-center gap-1 min-w-0',
                                        collapsed && 'h-6',
                                    )}
                                >
                                    <Text
                                        numberOfLines={1}
                                        className={cn(
                                            'min-w-0 shrink font-bold text-foreground tracking-tight web:transition-[font-size,line-height]',
                                            MORPH_TRANSITION,
                                            collapsed
                                                ? TITLE_COLLAPSED
                                                : TITLE_EXPANDED,
                                        )}
                                    >
                                        {profileTitle}
                                    </Text>
                                    <View className="shrink-0">
                                        <Badges badges={data.badges} size={collapsed ? '3xs' : 'xs'} />
                                    </View>
                                </Row>
                                <Row
                                    className={cn(
                                        'items-center gap-1 min-w-0',
                                        collapsed && 'hidden',
                                    )}
                                >
                                     <CoverMenuMeta {...data.meta_menu} items={metaMenuItems} />
                                     {metaDate}

                                </Row>
                                <Row
                                    className={cn(
                                        'items-center gap-2 flex-nowrap min-w-0 h-5',
                                        !collapsed && 'hidden',
                                    )}
                                >
                                    {!!metaMenuCompact && (
                                        <CoverMenuMeta
                                            {...metaMenuCompact}
                                            compact
                                            hide_avatars
                                            button_size="mini"
                                        />
                                    )}
                                    {metaDate}
                                </Row>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-1" />
                    )}
                    {isAddSelector && !isNone ? (
                        <View
                            className={cn(
                                `${TABLET_MODE_FROM}:hidden shrink-0 justify-center web:transition-opacity`,
                                MORPH_TRANSITION,
                                avatarHeightClass,
                                collapsed
                                    ? 'opacity-100'
                                    : 'hidden',
                            )}
                        >
                            <ContextSelector
                                data={context}
                                url={uri}
                                uri={uri}
                                mode="min"
                            />
                        </View>
                    ) : null}
                    {/* Collapsed bar + desktop: actions in the identity row */}
                    {!menusInNavbar && !!menu && (collapsed || isDesktop) ? (
                        <Row
                            className={cn(
                                'items-center gap-1 shrink-0 overflow-visible',
                                avatarHeightClass,
                                Platform.OS === 'web' && !collapsed
                                    ? 'absolute right-0 top-3 z-10 pr-4 lg:static lg:right-auto lg:top-auto lg:pr-0'
                                    : 'ml-auto justify-end self-center',
                            )}
                        >
                            {!collapseActionsToMore ? (
                                <CoverMenu {...menu} uri={uri} isSplitMenu={true} />
                            ) : null}
                            <CoverMenuMore
                                {...menu}
                                uri={uri}
                                allowZeroPersistant={!isDesktop}
                                isSplitMenu={!collapseActionsToMore}
                            />
                        </Row>
                    ) : null}
                </View>
                {/* Mobile expanded: CoverMenu/CoverMenuMore must be direct Row
                    children on native — an extra View wrapper hides NeoButtons. */}
                {!menusInNavbar && !!menu && !collapsed && !isDesktop ? (
                    <Row
                        className={cn(
                            'w-full  mx-auto px-3 mb-2 items-center flex-wrap gap-2 justify-between overflow-visible',
                            contentWidth,
                        )}
                    >
                        <CoverMenu {...menu} uri={uri} isSplitMenu={true} />
                        <CoverMenuMore
                            {...menu}
                            uri={uri}
                            allowZeroPersistant
                            isSplitMenu={true}
                        />
                    </Row>
                ) : null}
            </View>
            {children ? (
                <View
                    ref={tabBarRef}
                    className={cn(
                        'header-fixed sticky z-40 w-full',
                        coverBase,
                        collapsed && 'border-b border-border/60',
                        tabBarClassName,
                    )}
                    style={
                        tabBarStyle ?? {
                            top: stickyTop + (collapsed ? stripH : flowH),
                        }
                    }
                >
                    {children}
                </View>
            ) : null}
        </>
    )
}
