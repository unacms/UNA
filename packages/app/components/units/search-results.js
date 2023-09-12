import { useState, useRef } from 'react';
import { stripTags,getImageSizes } from '../../lib/util';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import Link from '../../ui/atoms/link';
import Card from 'app/ui/molecules/card'

export default function UnitSearchResults(props) {
    let data = props.data;
    const imageSizes = getImageSizes();
    return (     
        <Card margin="mt-4 mx-2">
            <Link href={data.url}>  
                <View className='flex-col    '>   
                    <View className="flex flex-col h-28 gap-1 p-3 ">
                        <Text numberOfLines={2} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d sm:leading-5  text-lg sm:text-base  font-bold'>
                            {data.title}
                        </Text>
                        <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300 text-sm ">{data.summary_plain}</Text>
                    </View>          
                </View>      
            </Link>
        </Card>  
    )
}


export function UnitSearchResultsSmall({data, onPress}) {
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
                <Card addClassName="p-2 flex-row" margin="my-[1px]">    
                    <View className="w-12 h-12 mr-2 rounded-full flex-none ">
                        {data?.author_data && <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />}
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row '>
                            <Text className='text-sm flex-none text-neutral-500'><Time ts={data.added}></Time></Text>
                        </View>
                        <View className='flex-row  w-full items-end content-end'>
                            <Text className='flex-auto mr-2 text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={1}>{sText}</Text>    
                        </View>         
                    </View>
                </Card>
            </Pressable>
        </View>
    );
}
