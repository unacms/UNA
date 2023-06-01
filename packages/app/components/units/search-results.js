import { useState, useRef } from 'react';
import { stripTags, getImageSizes } from '../../lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import { Pressable } from 'dripsy';
import Link from '../../ui/atoms/link';

export default function UnitSearchResults(props) {
    let data = props.data;
    const imageSizes = getImageSizes();
    return (     
        <View className="
            shadow-sm hover:shadow-lg active:shadow-none 
            mt-4 mx-2             
            group duration-200  rounded-lg 
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
               border-4 border-transparent 
           justify-between 
            active:translate-y-0.5 ">
            <Link href={data.url}>  
            <View className='flex-col    '>   
               
                <View className="flex flex-col h-28 gap-1 p-3 ">
                                <Text numberOfLines={2} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-accent sm:dark:hover:text-accent-dark sm:leading-5  text-lg sm:text-base  font-bold'>
                                    {data.title}
                                </Text>
                                <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300   text-sm   ">{data.summary_plain}</Text>
                
                </View>
              
                            
                </View>      
            </Link>
        
        
    </View>  
)
}
