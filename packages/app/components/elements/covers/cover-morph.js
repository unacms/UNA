'use client'

import { useLayoutEffect } from 'react'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated'
import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import CoverMorphBody from 'app/customization/covers/cover-morph-body'
import { useCoverMorph } from './use-cover-morph'

const COVER_OVERLAY_STYLE = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
}

/**
 * Native CoverMorph: absolute overlay + list parallax (reanimated).
 * Scroll driver: `./use-cover-morph-driver.js`
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
    coverScrollY,
    onOverlayHeight,
    leading,
    sceneHeader,
    filter,
    suppressContextSelector = false,
    suppressCoverBackButton = false,
}) {
    const collapsedSV = useSharedValue(0)
    const coverMode =
        appSetting('cover', 'view_by_module', data?.profile?.module) || mode
    const isNone = coverMode === 'none'
    const skipCollapse =
        !!appSetting('cover', 'fixed') || isNone

    const {
        collapsed,
        onSlotLayout,
        onInnerLayout,
        onRootLayout,
        parallaxRange,
        coverScrollY: scrollY,
    } = useCoverMorph({
        data,
        mode,
        showImage,
        pageKey,
        onProgress,
        coverScrollY,
        onOverlayHeight,
        skipCollapse,
    })

    useLayoutEffect(() => {
        collapsedSV.set(collapsed ? 1 : 0)
    }, [collapsed, collapsedSV])

    const translateStyle = useAnimatedStyle(() => {
        if (!scrollY) {
            return { transform: [{ translateY: 0 }] }
        }
        const y = Math.max(0, scrollY.get())
        if (collapsedSV.get() >= 0.5) {
            return { transform: [{ translateY: 0 }] }
        }
        return {
            transform: [
                {
                    translateY:
                        parallaxRange > 0
                            ? interpolate(
                                  y,
                                  [0, parallaxRange],
                                  [0, -parallaxRange],
                                  Extrapolation.CLAMP,
                              )
                            : 0,
                },
            ],
        }
    }, [scrollY, parallaxRange, collapsedSV])

    if (!data?.profile?.module) return null

    const coverBaseClass =
        appSetting('theme', 'conductor').cover_base || 'bg-card'

    // `none`: same as web — chrome stays in flow above the list
    // (no overlay parallax). Tabs render inside CoverMorphBody.
    if (isNone) {
        return (
            <View
                onLayout={onRootLayout}
                className={coverBaseClass}
                style={stickyTop > 0 ? { paddingTop: stickyTop } : undefined}
            >
                {leading}
                <CoverMorphBody
                    data={data}
                    mode={mode}
                    uri={uri}
                    context={context}
                    stickyTop={0}
                    showImage={false}
                    collapsed={false}
                    suppressContextSelector={suppressContextSelector}
                    suppressCoverBackButton={suppressCoverBackButton}
                    onSlotLayout={onSlotLayout}
                >
                    {sceneHeader}
                </CoverMorphBody>
                {filter}
            </View>
        )
    }

    return (
        <View
            pointerEvents="box-none"
            onLayout={onRootLayout}
            style={COVER_OVERLAY_STYLE}
        >
            {leading}
            <Animated.View
                className={coverBaseClass}
                style={translateStyle}
                onLayout={onInnerLayout}
            >
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
                    onSlotLayout={onSlotLayout}
                />
                {sceneHeader}
                {filter}
            </Animated.View>
        </View>
    )
}
