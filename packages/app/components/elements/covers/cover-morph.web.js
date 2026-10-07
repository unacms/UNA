'use client'

import { cn, appSetting } from 'app/lib/util'
import { useIsDesktop } from 'app/context/measure'
import CoverMorphBody from 'app/customization/covers/cover-morph-body'
import { useCoverMorph } from './use-cover-morph'

/**
 * Web CoverMorph: CSS sticky collapse, no react-native-reanimated.
 * Scroll driver: `./use-cover-morph-driver.web.js`
 */
export default function CoverMorph({
    data,
    mode,
    uri,
    context,
    pageKey,
    stickyTop = 0,
    showImage = true,
    onProgress,
    children,
    suppressContextSelector = false,
    suppressCoverBackButton = false,
}) {
    const isDesktop = useIsDesktop()
    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const isNone = coverMode === 'none'
    const isCoverFixed = !!appSetting('cover', 'fixed')
    // Desktop `none`: tabs only. Narrow `none` / `cover.fixed`: stay in one
    // layout (compact or expanded) instead of falling back to old Cover.
    const skipIdentityBar = isNone && isDesktop
    const skipCollapse = isCoverFixed || (isNone && !isDesktop)
    // Desktop: collapsed strip duplicates the navbar identity — pin tabs only.
    const hideCollapsedBar =
        isDesktop &&
        !isNone &&
        !!appSetting('cover', 'hide_collapsed_bar_desktop', data?.profile?.module)

    const {
        collapsed,
        flowH,
        barRef,
        coverRef,
        tabBarRef,
        onBarLayout,
    } = useCoverMorph({
        pageKey,
        stickyTop,
        onProgress,
        skipIdentityBar,
        skipCollapse,
        hideCollapsedBar,
    })

    if (!data?.profile?.module) return null

    return (
        <CoverMorphBody
            data={data}
            mode={mode}
            uri={uri}
            context={context}
            stickyTop={stickyTop}
            showImage={showImage}
            collapsed={collapsed}
            suppressContextSelector={suppressContextSelector}
            suppressCoverBackButton={suppressCoverBackButton}
            barRef={barRef}
            coverRef={coverRef}
            tabBarRef={tabBarRef}
            onBarLayout={onBarLayout}
            flowH={flowH}
            hideCollapsedBar={hideCollapsedBar}
            barClassName={cn(
                collapsed ? 'header-fixed sticky' : 'relative',
                collapsed && hideCollapsedBar && 'hidden',
            )}
            barStyle={collapsed ? { top: stickyTop } : undefined}
        >
            {children}
        </CoverMorphBody>
    )
}
