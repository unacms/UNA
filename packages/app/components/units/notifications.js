import { useState, useRef } from 'react';
import { useWindowDimensions} from 'react-native';
import { stripTags } from '../../lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import { Pressable } from 'dripsy';

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

    return (
        <View className=" ">
            <Redirect ref={redirectdRef} />
            <Pressable onPress={() => handleClick(url)}>
                <View className=" p-2 flex-row  
                 group duration-200 overflow-hidden rounded-md  
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                  mt-[1px] max-w-5xl self-center w-full sm:border
                active:translate-y-0.5 
                border-bordercolorcard dark:border-bordercolorcard-dark
                ">    
                    <View className="w-12 h-12 mr-2 rounded-full flex-none ">
                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row '>
                            <Text className='text-sm flex-auto mr-2 font-semibold text-gray-900 dark:text-gray-100'>{data.author_data.display_name}</Text>
                            <Text className='text-sm flex-none text-gray-500'><Time ts={data.date}></Time></Text>
                        </View>
                        <View className='flex-row  w-full items-end content-end'>
                            <Text className='flex-auto mr-2 text-sm text-gray-900 dark:text-gray-100' numberOfLines={1}>{stripTags(data.content_parsed)}</Text>    
                        </View>         
                    </View>
                </View>
            </Pressable>
        </View>
    );
}
