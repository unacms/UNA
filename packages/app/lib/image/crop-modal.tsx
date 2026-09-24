'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Platform } from 'react-native'
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal, NeoButton } from 'app/design/controls'
import { useTranslation } from 'react-i18next'
import {
    CROP_MAX_ZOOM,
    cropAndPrepareImage,
    getCoverFitSize,
    getCropAspect,
    getCropOutputSize,
    getCropRectFromTransform,
} from './crop'

const isWeb = Platform.OS === 'web'

function CropStage({
    uri,
    sourceWidth,
    sourceHeight,
    kind,
    viewport,
    zoomRef,
    transformRef,
}: { uri: any; sourceWidth?: any; sourceHeight?: any; kind?: any; viewport?: any; zoomRef?: any; transformRef?: any }) {
    const display = useMemo(
        () => getCoverFitSize(sourceWidth, sourceHeight, viewport.width, viewport.height),
        [sourceWidth, sourceHeight, viewport.width, viewport.height],
    )
    const isCircle = kind === 'picture'

    const handleTransform = useCallback((event: any) => {
        transformRef.current = event
    }, [transformRef])

    const handleWheel = useCallback((event: any) => {
        const deltaY = event?.nativeEvent?.deltaY ?? event?.deltaY
        if (typeof deltaY !== 'number' || !zoomRef.current?.zoomBy) return
        event?.preventDefault?.()
        event?.stopPropagation?.()
        zoomRef.current.zoomBy(deltaY > 0 ? -0.12 : 0.12)
    }, [zoomRef])

    return (
        <View
            className={`overflow-hidden bg-black web:cursor-grab web:select-none ${isCircle ? 'rounded-full' : 'rounded-xl'}`}
            style={{ width: viewport.width, height: viewport.height }}
            onWheel={isWeb ? handleWheel : undefined}
        >
            <ReactNativeZoomableView
                key={`${uri}:${viewport.width}:${viewport.height}`}
                ref={zoomRef}
                bindToBorders
                visualTouchFeedbackEnabled={false}
                minZoom={1}
                maxZoom={CROP_MAX_ZOOM}
                initialZoom={1}
                zoomStep={0.35}
                contentWidth={display.width}
                contentHeight={display.height}
                onTransform={handleTransform}
                style={{ width: viewport.width, height: viewport.height }}
            >
                <Image
                    source={{ uri }}
                    resizeMode="cover"
                    {...({ draggable: false } as object)}
                    style={{ width: display.width, height: display.height }}
                />
            </ReactNativeZoomableView>
            <View pointerEvents="none" className="absolute inset-0">
                <View
                    className={`h-full w-full border-2 border-white/80 ${
                        isCircle ? 'rounded-full' : 'rounded-xl'
                    }`}
                />
            </View>
        </View>
    )
}

export default function ImageCropModal({
    visible,
    uri,
    sourceWidth,
    sourceHeight,
    kind = 'picture',
    module,
    fileSizeBytes,
    onCancel,
    onConfirm,
}: { visible: any; uri?: any; sourceWidth?: any; sourceHeight?: any; kind?: any; module?: any; fileSizeBytes?: any; onCancel?: () => void; onConfirm?: any }) {
    const { t } = useTranslation()
    const zoomRef = useRef<any>(null)
    const transformRef = useRef<any>(null)
    const [viewport, setViewport] = useState<any>(null)
    const [applying, setApplying] = useState(false)
    const aspect = getCropAspect(kind, module)
    const isCircle = kind === 'picture'

    useEffect(() => {
        if (!visible) {
            setViewport(null)
            setApplying(false)
            transformRef.current = null
        }
    }, [visible])

    const handleBoxLayout = useCallback((event: any) => {
        const width = event?.nativeEvent?.layout?.width
        if (typeof width !== 'number' || width <= 0) return
        const nextHeight = isCircle ? width : width / aspect
        setViewport((prev: any) => {
            if (prev && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - nextHeight) < 1) {
                return prev
            }
            return { width, height: nextHeight }
        })
    }, [aspect, isCircle])

    const handleZoomBy = useCallback((delta: number) => {
        zoomRef.current?.zoomBy?.(delta)
    }, [])

    const handleApply = useCallback(async () => {
        if (!uri || !viewport || applying) return
        const display = getCoverFitSize(sourceWidth, sourceHeight, viewport.width, viewport.height)
        const event = transformRef.current || {}
        const crop = getCropRectFromTransform({
            sourceWidth,
            sourceHeight,
            viewWidth: viewport.width,
            viewHeight: viewport.height,
            displayWidth: display.width,
            displayHeight: display.height,
            offsetX: event.offsetX || 0,
            offsetY: event.offsetY || 0,
            zoomLevel: event.zoomLevel || 1,
        })
        const output = getCropOutputSize(kind, crop, aspect, module)

        setApplying(true)
        try {
            const nextUri = await cropAndPrepareImage({
                uri,
                crop,
                outputWidth: output.width,
                outputHeight: output.height,
                fileSizeBytes,
            })
            await onConfirm?.({ uri: nextUri, crop })
        } catch (err) {
            console.warn('[image-crop] apply failed:', err)
            setApplying(false)
        }
    }, [uri, viewport, applying, sourceWidth, sourceHeight, kind, module, aspect, fileSizeBytes, onConfirm])

    const title = kind === 'cover' ? t('Adjust cover') : t('Adjust photo')

    return (
        <Modal
            onVisible={visible}
            title={title}
            onClose={applying ? undefined : onCancel}
            outerClickClose={false}
            skipUnsavedGuard
            autoHeight
            scrollable={false}
            maxWidth={isCircle ? 'max-w-lg' : 'max-w-3xl'}
        >
            <View className="gap-4">
                <Text className="text-center text-sm text-muted-foreground">
                    {t('Move and zoom to choose what stays in frame')}
                </Text>
                <View
                    className={`w-full ${isCircle ? 'max-w-sm mx-auto' : ''}`}
                    onLayout={handleBoxLayout}
                >
                    {viewport && uri ? (
                        <CropStage
                            uri={uri}
                            sourceWidth={sourceWidth}
                            sourceHeight={sourceHeight}
                            kind={kind}
                            viewport={viewport}
                            zoomRef={zoomRef}
                            transformRef={transformRef}
                        />
                    ) : (
                        <View className={isCircle ? 'aspect-square' : ''} style={isCircle ? undefined : { aspectRatio: aspect }} />
                    )}
                </View>
                <Row className="items-center justify-center gap-3">
                    <NeoButton
                        image="Minus"
                        style="glass"
                        controlSize="regular"
                        borderShape="circle"
                        disabled={applying}
                        accessibilityLabel={t('Zoom out')}
                        onPress={() => handleZoomBy(-0.25)}
                    />
                    <Text className="text-sm text-muted-foreground">{t('Zoom')}</Text>
                    <NeoButton
                        image="Plus"
                        style="glass"
                        controlSize="regular"
                        borderShape="circle"
                        disabled={applying}
                        accessibilityLabel={t('Zoom in')}
                        onPress={() => handleZoomBy(0.25)}
                    />
                </Row>
                <Row className="justify-center gap-3">
                    <Button
                        variant="default"
                        size="base"
                        title={t('Cancel')}
                        disabled={applying}
                        onPress={onCancel}
                    />
                    <Button
                        variant="primary"
                        size="base"
                        title={applying ? t('Saving...') : t('Apply')}
                        disabled={applying || !viewport}
                        onPress={handleApply}
                    />
                </Row>
            </View>
        </Modal>
    )
}
