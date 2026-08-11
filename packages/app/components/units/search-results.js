import { useState, useRef } from 'react';
import { stripTags } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile/profile';
import GeneralContentList from './general-content-list';
export default function UnitSearchResults(props) {

    return <GeneralContentList {...props} unitType="search" />
}


export function UnitSearchResultsSmall({ data, onPress }) {


    //TODO: rework url
    const sText = data?.title ? data.title : stripTags(data.text);

    const profile = data.author_data;

    if (data.image) {
        profile.url_avatar = data.image.src;
        profile.url = data.url;
    }

    return (
        <Pressable onPress={() => onPress(data.url)}>
            <View className=" mb-1 ">
                <View className="bg-muted flex-row p-2 rounded-xl ">
                    {data?.author_data &&
                        <View className="w-12 h-12 rounded-full flex-none ">
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                        </View>
                    }
                    <View className="flex-auto mx-2 my-auto ">
                        <View className='flex-row  w-full items-end content-end'>

                            <Text className='flex-auto  text-sm text-popover-foreground ' numberOfLines={1}>{sText}</Text>
                        </View>
                        <View className='flex-row items-center'>
                            {data?.module_title &&
                                <Text className='text-xs flex-none text-muted-foreground' numberOfLines={1}>{data.module_title}</Text>
                            }
                        </View>
                    </View>
                </View>

            </View>
        </Pressable>
    );
}
