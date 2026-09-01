import { appSetting } from 'app/lib/util'

/** Tailwind `py-2.5` — keep in sync with `cover.morph_bar`. */
export const BAR_PAD_Y_PX = 10
export const MORPH_LEAD = 16
export const MORPH_RANGE_MIN = 32
export const MORPH_HYSTERESIS = 8

export const AVATAR_EXPANDED = appSetting('cover', 'morph_avatar_expanded') || '3xl'
export const AVATAR_EXPANDED_MOBILE =
    appSetting('cover', 'morph_avatar_expanded_mobile') || '2xl'
export const AVATAR_COLLAPSED = appSetting('cover', 'morph_avatar_collapsed') || 'base'
export const TITLE_EXPANDED =
    appSetting('cover', 'morph_title_expanded') ||
    'text-2xl sm:text-3xl lg:text-4xl'
export const TITLE_COLLAPSED =
    appSetting('cover', 'morph_title_collapsed') || 'text-base lg:text-lg'
export const MORPH_TRANSITION =
    appSetting('cover', 'morph_transition') ||
    'native:duration-300 web:duration-300 web:ease-out motion-reduce:transition-none'
export const MORPH_BAR = appSetting('cover', 'morph_bar') || 'py-2.5'

export const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

export function profileSizePx(sizeKey, fallback) {
    const width = appSetting('theme', 'profile_sizes', sizeKey)?.width
    return typeof width === 'number' ? width : fallback
}

export function profileAxisClass(sizeKey, axis, fallback) {
    const container = appSetting('theme', 'profile_sizes', sizeKey)?.container || ''
    const prefix = axis === 'w' ? 'w-' : 'h-'
    return container.split(/\s+/).find((c) => c.startsWith(prefix)) || fallback
}

export function getCoverMorphSizing(isDesktop) {
    const avatarExpandedKey = isDesktop ? AVATAR_EXPANDED : AVATAR_EXPANDED_MOBILE
    const avatarCollapsedPx = profileSizePx(AVATAR_COLLAPSED, 44)
    return {
        avatarExpandedKey,
        avatarExpandedPx: profileSizePx(
            avatarExpandedKey,
            isDesktop ? 160 : 96,
        ),
        avatarCollapsedPx,
        avatarCollapsedWidthClass: profileAxisClass(
            AVATAR_COLLAPSED,
            'w',
            'w-11',
        ),
        avatarHeightClass: profileAxisClass(AVATAR_COLLAPSED, 'h', 'h-11'),
        stripH: avatarCollapsedPx + BAR_PAD_Y_PX * 2,
    }
}

export function computeMorphCollapseRange(
    avatarExpandedPx,
    slotHeight,
    hasCoverBlock,
) {
    const slotH = slotHeight > 0 ? slotHeight : 44
    const photoAbove = Math.max(0, avatarExpandedPx + 8 - slotH)
    return hasCoverBlock
        ? Math.max(MORPH_RANGE_MIN, photoAbove) + MORPH_LEAD
        : 0
}
