import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import Video from 'app/ui/atoms/video'
import Loading from 'app/ui/atoms/loading'
import { isInlineVideoReady } from 'app/lib/editor/inline-video-ready'

const RECHECK_MS = 15000

/** Editor video in a post body: a "processing" placeholder until UNA has transcoded the mp4. */
export default function InlineVideo({ src, poster }) {
    const { t } = useTranslation()
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let cancelled = false
        let timer = null
        const check = async () => {
            const ok = await isInlineVideoReady(src)
            if (cancelled) return
            if (ok) setReady(true)
            else timer = setTimeout(check, RECHECK_MS)
        }
        check()
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [src])

    return (
        <View className='w-full aspect-video rounded-xl overflow-hidden my-3 bg-muted'>
            {ready ? (
                <Video poster={poster} src={src} cover={true} controls={true} />
            ) : (
                <View className='flex-1 items-center justify-center gap-2'>
                    <Loading size='small' />
                    <Text className='text-sm text-muted-foreground'>{t('Video is processing')}</Text>
                </View>
            )}
        </View>
    )
}
