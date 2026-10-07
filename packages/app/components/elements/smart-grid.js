import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ({ blockWrapperProps, data }) {
    const initedData = data.content.sm;
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='w-full'>
                {initedData?.map(a =>(getCell(a)))}
            </View>
        </BlockWrapper>
    )
}

function getCell(block, bAllowEdit) {
    let blockContent;
    switch (block.type) {
        case "image":
            blockContent = <View className='w-full aspect-video'><Image view='cover' className=" u-cover " alt='' src={block.content} /></View>
            break;
        case "text":
            blockContent = <View className="py-2 px-4 items-start justify-start"><Text className='text-lg text-popover-foreground '>{block.content}</Text></View>;
            break;
        case "link":
            const ImageComponent = ({ className, src }) => (
                <Image view='cover' className={className} alt='' src={src} />
            );

            blockContent = block.content_data && (
                <View className={`items-left justify-between p-4 ${block.h == 1 && block.w == 2 ? 'flex-row' : ''}`}>
                    <View className={block.h == 1 && block.w == 2 ? 'w-1/2' : ''}>
                        <View className="h-8 w-8 rounded-full">
                            <ImageComponent className="u-cover rounded-full" src={block.content_data.logo} />
                        </View>
                        <Text className=' text-base mt-2 font-semibold tracking-tight' numberOfLines={1}>{block.content_data.title}</Text>
                        {(block.h > 1 || block.w > 1) && <Text className=' text-base my-2' numberOfLines={block.h == 1 && block.w == 2 ? 3 : 4}>{block.content_data.description}</Text>}
                        <Text className='text-sm'>{block.content_data.domain}</Text>
                    </View>
                    <View className={`${block.h == 1 && block.w == 2 ? 'w-1/2 items-center justify-center pl-4' : 'w-full aspect-video rounded-2xl'}`}>
                        <View className="aspect-video rounded-2xl w-full">
                            <ImageComponent className="u-cover rounded-lg" src={block.content_data.image} />
                        </View>
                    </View>
                </View>
            );
            break;
        case "map":
            blockContent = <></>;//<Map height={100 * block.h} data={{ caption: block.content.content_state + ', ' + block.content.content_city + ', ' + block.content.content_street, location: { lat: block.content.content_lat, lng: block.content.content_lng } }} />
            break;
        default:
            blockContent = null;
    }

    return (

        <View key={block.i} className="mb-1 mx-1 shadow groupweb:duration-200 overflow-hidden bg-card">
            {blockContent}
        </View>
    );
}