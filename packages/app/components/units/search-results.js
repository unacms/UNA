import { useState, useRef } from 'react';
import { useWindowDimensions} from 'react-native';

import { stripTags } from '../../lib/util';

import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button } from 'app/design/controls';
import Time from 'app/ui/atoms/time';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import { Pressable } from 'dripsy';

export default function UnitFeed({data, onPress}) {
    const redirectdRef = useRef();

    //TODO: rework url
    let url = data?.url ? data.url.replace('{bx_url_root}', '') : '';

    const handleClick = (sUrl) => {
        if(!sUrl)
            return;

        if(!!onPress && typeof onPress == 'function')
            onPress();

        redirectdRef.current.redirect(sUrl);
    }
    
    const sText = data?.title ? data.title : stripTags(data.text);

    return (
        <View className=" ">
            <Redirect ref={redirectdRef} />
            <Pressable onPress={() => handleClick(url)}>
                <View className=" my-[1px] p-2 flex-row  
                 group duration-200 overflow-hidden rounded-md shadow-sm 
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover 
                
                active:translate-y-0.5 
                border-bordercolorcard dark:border-bordercolorcard-dark
                ">    
                    <View className="w-12 h-12 mr-2 rounded-full flex-none ">
                        {data?.author_data && <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />}
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row '>
                            <Text className='text-sm flex-none text-gray-500'><Time ts={data.added}></Time></Text>
                        </View>
                        <View className='flex-row  w-full items-end content-end'>
                            <Text className='flex-auto mr-2 text-sm text-gray-900 dark:text-gray-100' numberOfLines={1}>{sText}</Text>    
                        </View>         
                    </View>
                </View>
            </Pressable>
        </View>
    );
}
