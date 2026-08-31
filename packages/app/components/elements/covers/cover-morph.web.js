'use client'

import { cn } from 'app/lib/util'
import { CoverMorphBody } from './cover-morph-body'
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
            barClassName={cn(collapsed ? 'header-fixed sticky' : 'relative')}
            barStyle={collapsed ? { top: stickyTop } : undefined}
        >
            {children}
        </CoverMorphBody>
    )
}
