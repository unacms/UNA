'use client'

import { useCallback, useEffect, useState } from 'react'
import { lazyComponent } from 'app/lib/lazy-component'
import { pickImageForCrop } from './crop'

// Crop UI (zoomable view + crop math) loads on first crop only.
const ImageCropModal = lazyComponent(() => import('./crop-modal'), { name: 'ImageCropModal' })
import { uploadImage, md5, genRnd } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'

export function useProfileImageUpload({
    kind,
    profileId,
    moduleName,
    storage,
    initialUrl,
}: { kind: any; profileId: any; moduleName: any; storage: any; initialUrl: string }) {
    const [localImageUrl, setLocalImageUrl] = useState<string | undefined>(undefined)
    const [isUploading, setIsUploading] = useState(false)
    const [cropSession, setCropSession] = useState<any>(null)
    const imageUrl = localImageUrl ?? initialUrl

    useEffect(() => {
        setLocalImageUrl(undefined)
    }, [initialUrl])

    const pick = useCallback(async () => {
        const session = await pickImageForCrop({ kind })
        if (session) setCropSession(session)
    }, [kind])

    const handleInsertImageFinish = useCallback(async (uploadInfo: any) => {
        try {
            if (!moduleName || !uploadInfo?.result?.data?.id) return
            const sRequest =
                '/api.php?r=' +
                moduleName +
                '/update_image/&params[]=' +
                (uploadInfo.extraVar.kind || kind) +
                '&params[]=' +
                profileId +
                '&params[]=' +
                uploadInfo.result.data.id
            const sResponse = await fetcher(sRequest)
            setLocalImageUrl(sResponse.data)
        } finally {
            setIsUploading(false)
        }
    }, [kind, moduleName, profileId])

    const handleCropConfirm = useCallback(async ({ uri }: { uri: string }) => {
        const uploadKind = cropSession?.kind || kind
        setCropSession(null)
        const uploader =
            moduleName + (uploadKind === 'cover' ? '_cover_crop' : '_picture_crop')
        const url =
            '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&uo=' +
            uploader +
            '&so=' +
            storage +
            '&uid=' +
            genRnd(8) +
            '&img_trans=&m=0&c=' +
            profileId +
            '&p=0'

        setIsUploading(true)
        setLocalImageUrl(uri)
        uploadImage(
            uri,
            url + '&a=upload',
            handleInsertImageFinish,
            { hash: md5(uri), kind: uploadKind },
        )
    }, [cropSession, kind, moduleName, storage, profileId, handleInsertImageFinish])

    // Mounted only while a crop session is open so the lazy chunk is not fetched upfront.
    const modal = cropSession ? (
        <ImageCropModal
            visible={!!cropSession}
            uri={cropSession?.uri}
            sourceWidth={cropSession?.width}
            sourceHeight={cropSession?.height}
            kind={cropSession?.kind || kind}
            module={moduleName}
            fileSizeBytes={cropSession?.fileSizeBytes}
            onCancel={() => setCropSession(null)}
            onConfirm={handleCropConfirm}
        />
    ) : null

    return { imageUrl, isUploading, pick, modal }
}
