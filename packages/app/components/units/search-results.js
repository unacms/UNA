import { useState, useRef } from 'react';
import { stripTags } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import GeneralContentList from './general-content-list';
export default function UnitSearchResults(props) {

    return <GeneralContentList {...props} unitType="search" />
    /*return (     
        <Card margin="mt-4 mx-2">
            <Link href={data.url}>  
                <View className='flex-col    '>   
                    <View className="flex flex-col h-28 gap-1 p-3 ">
                        <Text numberOfLines={2} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-primarysm:leading-5  text-lg sm: text-base  font-bold'>
                            {data.title}
                        </Text>
                        <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300 text-sm ">{data.summary_plain}</Text>
                    </View>          
                </View>      
            </Link>
        </Card>  
    )*/
}


export function UnitSearchResultsSmall({ data, onPress }) {


    //TODO: rework url
    const sText = data?.title ? data.title : stripTags(data.text);

    const profile = data.author_data;

    if (data.image){
        profile.url_avatar = data.image.src;
        profile.url = data.url;
    }

    return (
        <Pressable onPress={() => onPress(data.url)}>
            <View className=" mb-1 ">
                <View className="bg-bgritem dark:bg-bgritem-d hover:bg-bgritem-h dark:hover:bg-bgritem-dh flex-row p-2 rounded-xl ">
                    {data?.author_data &&
                        <View className="w-12 h-12 rounded-full flex-none ">
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                        </View>
                    }
                    <View className="flex-auto mx-2 my-auto ">
                        <View className='flex-row  w-full items-end content-end'>

                            <Text className='flex-auto  text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={1}>{sText}</Text>
                        </View>
                        <View className='flex-row items-center'>
                            {data?.module_title &&
                                <Text className='text-xs flex-none text-neutral-500' numberOfLines={1}>{data.module_title}</Text>
                            }
                        </View>
                    </View>
                </View>

            </View>
        </Pressable>
    );
}
