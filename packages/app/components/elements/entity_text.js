import { View, Pressable } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting } from 'app/settings'
import { useState } from 'react';
import { stripTags } from '../../lib/util';
import { ContentMore } from 'app/ui/molecules/contentmore';

export default function ElementEntityText({data}) {

    const view = appSetting('entry', 'default_view');
    
    switch (view) {
        case 'small':
          return <Small data={data} />;
        default:
          return <Default data={data} />;
      }
}

function Small({ data }) {

    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight:22
        }
    }; 

    return (
        <View className="relative sm:my-0 bg-neocard  dark:bg-neocard-dark sm:border-x  border-neoborder dark:border-neoborder-dark w-full mx-auto max-w-5xl">
           <View className=' bg-neoitem dark:bg-neoitem-dark rounded-lg flex-col space-y-1 p-2 mx-4 mb-4 mt-4'>
                <Text className="font-bold text-neogray-900 dark:text-neogray-50 text-base ">{data.title}</Text>
                <ContentMore content={data.text} numberOfLines={3} textStyle={oCommentTextStyle} openSmall={false} textClassName="text-base text-gray-600 dark:text-gray-400"/>
            </View>
        </View>
    );
}

function Default({ data }) {
    return (
        <View className="relative sm:my-0 bg-neocard  dark:bg-neocard-dark sm:border-x  border-neoborder dark:border-neoborder-dark w-full mx-auto max-w-5xl">
            {(data.image) && <View className="w-full aspect-[3/1] mb-4"><Image {...data.image} alt={data.title} priority className=" mt-4 u-cover" view="cover"   /></View>}              
            <View className="mx-4 mb-4">
                <H1 className="font-bold tracking-tight  text-neogray-900 dark:text-neogray-50 ">{data.title}</H1>
                <Html data={data.text} />
            </View>
        </View>
    );
}
