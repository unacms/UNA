import { useState, useRef } from 'react';
import { useWindowDimensions} from 'react-native';
import { stripTags } from '../../lib/util';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import AnimatedBlock from 'app/ui/molecules/animated-block'

export default function UnitFeed({data}) {
    const redirectdRef = useRef();

    var oImage = null;
    if (data.content.images)  
      oImage = data.content.images.length > 0 ? data.content.images[0] : null;
    
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')
    
    const {height, width, scale, fontScale} = useWindowDimensions();

    //TODO: rework url
    let url = data.content.entry_url.replace('{bx_url_root}', '');
    
    
    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl);
    }
    let content_parsed = data?.content_parsed ? data?.content_parsed : '';
    content_parsed = content_parsed.replace('&#8230;', '...');
    
    return (
        <AnimatedBlock>
        <View className=" mt-2 ">
            <Redirect ref={redirectdRef} />
            <Pressable onPress={() => handleClick(url)}>
                <View className=" bg-bgritem dark:bg-bgritem-d flex-row p-2 max-w-4xl mx-auto w-full rounded-lg ">  
                    <View className="w-12 h-12 mr-2 rounded-full flex-none " >
                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row '>
                            <Text className='text-sm flex-auto mr-2 font-semibold text-neutral-900 dark:text-neutral-100'>{data.author_data.display_name}</Text>
                            <Text className='text-sm flex-none text-neutral-500'><Time ts={data.date}></Time></Text>
                        </View>
                        <View className='flex-row  w-full items-end content-end'>
                            <Text className='flex-auto mr-2 text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={1}>{stripTags(data.content_parsed)}</Text>    
                        </View>         
                    </View>
               </View>
            </Pressable>
        </View>
        </AnimatedBlock>
    );
}
