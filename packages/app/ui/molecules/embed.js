import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { memo } from "react";
import { getYouTubeVideoId } from 'app/lib/util'
import Youtube from 'app/ui/molecules/youtube'

const Embed = memo(function ({ data, size }) {
    const videoId = getYouTubeVideoId(data.url);
    if (videoId)
        return <Youtube videoId={videoId} url={data.url} size={size}  />

    return <Link target='_blank' href={data.url} >
        <Row className='rounded-lg border border-border'>
            <View className='aspect-square h-32 m-2 mr-4 '>
                {(data.image) ? <Image view="cover" resizeMode="cover" className="rounded-tl-lg rounded-bl-lg " src={data.image} />
                    : (data.logo ? <Image view="cover" resizeMode="cover" className="rounded-tl-lg rounded-bl-lg " src={data.logo} /> : <></>)}
            </View>
            <View className='flex-auto my-2 mr-4'>
                <Text className="text-popover-foreground   text-base font-bold " numberOfLines={1}>{data.title}</Text>
                <Text className="text-popover-foreground   text-sm my-2" numberOfLines={2}>{data.description}</Text>
                <Row className='gap-x-2'>
                    {!!data.logo && <View className='h-6 w-6'>
                        <Image view="cover" resizeMode="cover" src={data.logo} />
                    </View>}
                    <Text className="text-popover-foreground  text-sm">{data.domain}</Text>
                </Row>
            </View>
        </Row>
    </Link>
})
export default Embed;
