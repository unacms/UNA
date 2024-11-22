import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { memo, useState, useCallback } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Youtube from 'app/ui/molecules/youtube'
import { Button } from 'app/design/controls';

function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

const Embed = memo(function ({ data, size }) {

    const videoId = getYouTubeVideoId(data.url);
    if (videoId)
        return <Youtube videoId={videoId} size={size} />

    return <Link target='_blank' href={data.url} >
        <Row className='rounded-lg mt-3 border border-bdr dark:border-bdr-d'>
            <View className='aspect-square h-32 mr-4'>
                {(data.image) ? <Image view="cover" sizes={LAYOUT_BREAKPOINTS.lg} resizeMode="cover" className="rounded-tl-lg rounded-bl-lg " src={data.image} />
                    : (data.logo ? <Image view="cover" sizes={LAYOUT_BREAKPOINTS.lg} resizeMode="cover" className="rounded-tl-lg rounded-bl-lg " src={data.logo} /> : <></>)}
            </View>
            <View className='flex-auto my-2 mr-4'>
                <Text className="text-neutral-900  dark:text-neutral-100 text-base font-bold " numberOfLines={1}>{data.title}</Text>
                <Text className="text-neutral-900  dark:text-neutral-100 text-sm my-2" numberOfLines={2}>{data.description}</Text>
                <Row className='gap-x-2'>
                    {!!data.logo && <View className='h-6 w-6'>
                        <Image view="cover" resizeMode="cover" sizes={LAYOUT_BREAKPOINTS.lg} src={data.logo} />
                    </View>}
                    <Text className="text-neutral-900 dark:text-neutral-100 text-sm">{data.domain}</Text>
                </Row>
            </View>
        </Row>
    </Link>
})
export default Embed;
