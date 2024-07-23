import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls';
import React, { useState } from 'react';
import Image from 'app/ui/atoms/image';
;
import Map from 'app/components/elements/map';

export default function (props) {
    const initedData = props.data.content.sm;


    return <View className='w-full'>
        {initedData?.map(a => 
        (

           getCell(a)

        )
        )}

    </View>
}

function getCell(block, bAllowEdit) {
    let blockContent;
    switch (block.type) {
        case "image":
            blockContent = <View className='w-full aspect-video'><Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" className=" u-cover " alt='' src={block.content} /></View>
            break;
        case "text":
            blockContent = <View className="py-2 px-4 items-start justify-start"><Text className='text-lg text-neutral-900 dark:text-neutral-50'>{block.content}</Text></View>;
            break;
        case "link":
            const ImageComponent = ({ className, src }) => (
                <Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" className={className} alt='' src={src} />
            );

            blockContent = block.content_data && (
                <View className={`items-left justify-between p-4 ${block.h == 1 && block.w == 2 ? 'flex-row' : ''}`}>
                    <View className={block.h == 1 && block.w == 2 ? 'w-1/2' : ''}>
                        <View className="h-8 w-8 rounded-full">
                            <ImageComponent className="u-cover rounded-full" src={block.content_data.logo} />
                        </View>
                        <Text className='text-base mt-2 font-semibold tracking-tight' numberOfLines={1}>{block.content_data.title}</Text>
                        {(block.h > 1 || block.w > 1) && <Text className='text-base my-2' numberOfLines={block.h == 1 && block.w == 2 ? 3 : 4}>{block.content_data.description}</Text>}
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
        <View key={block.i} className="mb-1 mx-1 border border-bdrcard dark:border-bdrcard-d shadow-sm group duration-200 overflow-hidden bg-bgrcard dark:bg-bgrcard-d">
            {blockContent}
        </View>
    );
}