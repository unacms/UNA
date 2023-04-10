import { useState, useRef } from 'react';
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic, Image as ImageNative } from 'react-native';

import { stripTags } from '../../lib/util';

import { TouchableOpacity } from 'app/design/view'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls';
import Time from 'app/ui/atoms/time';
import Image from 'app/ui/atoms/image';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';

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
        <View className="sm:mb-2">
            <Redirect ref={redirectdRef} />
            <Button variant="custom" size="base" fullWidth="true" onPress={() => handleClick(url)}>
                <View className="sm:rounded-lg flex-row w-full -m-2 p-4 active:translate-y-0.5 active:bg-neocard-active dark:active:bg-neocard-darkactive duration-200 bg-neocard dark:bg-neocard-dark border-b hover:bg-neocard-hover dark:hover:bg-neogray-800 border-neoborder dark:border-neoborder-dark overflow-hidden ">    
                    <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row '>
                            <Text className='text-sm flex-auto mr-2 font-semibold text-neogray-900 dark:text-neogray-100'>{data.author_data.display_name}</Text>
                            <Text className='text-sm flex-none text-neogray-500'><Time ts={data.date}></Time></Text>
                        </View>
                        <View className='flex-row  w-full items-end content-end'>
                            <Text className='flex-auto mr-2 text-sm text-neogray-900 dark:text-neogray-100' numberOfLines={1}>{stripTags(data.content_parsed)}</Text>    
                        </View>         
                    </View>
                </View>
            </Button>
        </View>
    );
}
