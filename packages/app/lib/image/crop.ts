import { Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from './manipulator'
import { getUploadSizeMb } from 'app/lib/util/upload'
import {
    getCoverAspectClass,
    getCoverCropMaxWidth,
    getPictureCropOutput,
    getUploadWebpOverMb,
    parseAspectRatioClass,
} from './upload-settings'

export const PICTURE_CROP_OUTPUT = 400
export const COVER_CROP_MAX_WIDTH = 2000
export const CROP_MAX_ZOOM = 4

const PICTURE_FIELDS = new Set(['picture', 'avatar', 'badge'])
const COVER_FIELDS = new Set(['covers', 'cover'])

export function getImageCropKind(fieldName: string) {
    if (PICTURE_FIELDS.has(fieldName)) return 'picture'
    if (COVER_FIELDS.has(fieldName)) return 'cover'
    return null
}

export function getCoverCropAspect(module: string) {
    return parseAspectRatioClass(getCoverAspectClass(module)) || 3
}

export function getCropAspect(kind: string, module: string) {
    return kind === 'cover' ? getCoverCropAspect(module) : 1
}

export function isSvgAsset(asset: any) {
    const mime = String(asset?.mimeType || asset?.file_type || asset?.type || '').toLowerCase()
    const uri = String(asset?.uri || '')
    return mime.includes('svg') || uri.includes('image/svg') || /\.svg(\?|$)/i.test(uri)
}

export function getAssetImageSize(asset: any): Promise<{ width: number; height: number } | null> | { width: number; height: number } | null {
    const width = asset?.width
    const height = asset?.height
    if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
        return Promise.resolve({ width, height })
    }
    if (!asset?.uri) return Promise.resolve(null)

    return new Promise((resolve) => {
        Image.getSize(
            asset.uri,
            (w, h) => resolve(w > 0 && h > 0 ? { width: w, height: h } : null),
            () => resolve(null),
        )
    })
}

export async function pickImageForCrop(extra = {}) {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: false,
    })
    if (result.canceled || !Array.isArray(result.assets) || !result.assets.length) {
        return null
    }

    const asset = result.assets[0]! // non-empty, checked above
    const size = await getAssetImageSize(asset)
    if (!size) return null

    return {
        uri: asset.uri,
        width: size.width,
        height: size.height,
        fileSizeBytes: asset.fileSize,
        asset,
        ...extra,
    }
}

export function getCoverFitSize(sourceW: number, sourceH: number, viewW: number, viewH: number) {
    if (!sourceW || !sourceH || !viewW || !viewH) {
        return { width: viewW || 0, height: viewH || 0 }
    }
    const imageAspect = sourceW / sourceH
    const viewAspect = viewW / viewH
    if (imageAspect > viewAspect) {
        return { width: viewH * imageAspect, height: viewH }
    }
    return { width: viewW, height: viewW / imageAspect }
}

export function clampCropRect(rect: any, sourceW: number, sourceH: number) {
    let originX = Number(rect?.originX) || 0
    let originY = Number(rect?.originY) || 0
    let width = Number(rect?.width) || 0
    let height = Number(rect?.height) || 0

    if (originX < 0) {
        width += originX
        originX = 0
    }
    if (originY < 0) {
        height += originY
        originY = 0
    }
    if (originX + width > sourceW) width = sourceW - originX
    if (originY + height > sourceH) height = sourceH - originY

    originX = Math.max(0, Math.round(originX))
    originY = Math.max(0, Math.round(originY))
    width = Math.max(1, Math.round(width))
    height = Math.max(1, Math.round(height))

    if (originX + width > sourceW) originX = Math.max(0, sourceW - width)
    if (originY + height > sourceH) originY = Math.max(0, sourceH - height)

    return { originX, originY, width, height }
}

export function getCropRectFromTransform({
    sourceWidth,
    sourceHeight,
    viewWidth,
    viewHeight,
    displayWidth,
    displayHeight,
    offsetX = 0,
    offsetY = 0,
    zoomLevel = 1,
}: { sourceWidth: any; sourceHeight: any; viewWidth: any; viewHeight: any; displayWidth: any; displayHeight: any; offsetX?: any; offsetY?: any; zoomLevel?: any }) {
    const zoom = zoomLevel || 1
    const imgLeft = offsetX * zoom + viewWidth / 2 - (displayWidth / 2) * zoom
    const imgTop = offsetY * zoom + viewHeight / 2 - (displayHeight / 2) * zoom
    const srcX = (0 - imgLeft) / zoom
    const srcY = (0 - imgTop) / zoom
    const scaleX = sourceWidth / displayWidth
    const scaleY = sourceHeight / displayHeight

    return clampCropRect(
        {
            originX: srcX * scaleX,
            originY: srcY * scaleY,
            width: (viewWidth / zoom) * scaleX,
            height: (viewHeight / zoom) * scaleY,
        },
        sourceWidth,
        sourceHeight,
    )
}

export function getCropOutputSize(kind: string, crop: any, aspect: any, module: string) {
    if (kind === 'picture') {
        const side = Math.max(1, Math.min(getPictureCropOutput(), crop.width, crop.height))
        return { width: Math.round(side), height: Math.round(side) }
    }
    const ratio = aspect || getCoverCropAspect(module)
    const width = Math.max(1, Math.min(getCoverCropMaxWidth(), crop.width))
    return { width: Math.round(width), height: Math.max(1, Math.round(width / ratio)) }
}

export async function cropAndPrepareImage({
    uri,
    crop,
    outputWidth,
    outputHeight,
    fileSizeBytes,
    webpOverMb,
}: { uri: string; crop: any; outputWidth?: number; outputHeight?: number; fileSizeBytes?: number; webpOverMb?: number }) {
    const webpLimit = typeof webpOverMb === 'number' ? webpOverMb : getUploadWebpOverMb()
    const originalSizeMb = await getUploadSizeMb({ uri, fileSizeBytes })
    const shouldConvertToWebp = originalSizeMb > webpLimit
    // expo-image-manipulator's web .d.ts types the export as the class; at runtime it is the instance.
    const context = (ImageManipulator as unknown as { manipulate: (uri: string) => any }).manipulate(uri)
    let hasActions = false

    if (crop && typeof crop.width === 'number' && typeof crop.height === 'number') {
        context.crop({
            originX: crop.originX,
            originY: crop.originY,
            width: crop.width,
            height: crop.height,
        })
        hasActions = true
    }

    if (
        typeof outputWidth === 'number' &&
        typeof outputHeight === 'number' &&
        crop &&
        (crop.width > outputWidth || crop.height > outputHeight)
    ) {
        context.resize({ width: outputWidth, height: outputHeight })
        hasActions = true
    }

    if (!hasActions && !shouldConvertToWebp) {
        return uri
    }

    const renderedImage = await context.renderAsync()
    const processedImage = await renderedImage.saveAsync({
        ...(shouldConvertToWebp ? { format: SaveFormat.WEBP } : {}),
    })

    return processedImage.uri
}
