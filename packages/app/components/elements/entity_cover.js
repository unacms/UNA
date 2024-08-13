import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { Text } from 'app/design/typography';
import { useTranslation } from 'react-i18next';
import { CoverMenuMeta, CoverMenu } from 'app/components/nav/menu-cover'
import { stripTags } from 'app/lib/util'

export default function (props) {
    const { t } = useTranslation();
    const data = props.data;
    console.log(data)
    return (
        <View className="flex-col p-6 w-full mx-auto  bg-bgrcard h-min dark:bg-bgrcard-d  overflow-hidden rounded-xl">
            <View className="w-28 h-28 overflow-hidden bg-neutral-100 dark:bg-neutral-700  rounded-full  ">
                {!!data.image ? <Image alt={data.fullname} className="rounded-full" view="cover" src={data.image.src} /> : <View><View className="w-[50%] z-20 aspect-square bg-neutral-200  dark:bg-neutral-600 border-4 border-neutral-100 dark:border-neutral-700  mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neutral-200  dark:bg-neutral-600  mx-auto rounded-t-full  "></View></View>}
            </View>
            <View className="flex-row flex-wrap ">
                <View className=" flex-col   flex-auto">
                    <Text className="text-2xl pt-4 font-bold text-neutral-800 dark:text-neutral-100">
                        {data.fullname}
                    </Text>

                </View>
                
            </View>
            <View className="text-center flex-row py-4 gap-x-2 items-center">
                
                <CoverMenuMeta {...data.meta_menu} />
            </View>
            <View className="text-center py-2 flex-row gap-x-2 items-center">
                <CoverMenu {...data.actions_menu} uri={props?.uri} />
            </View>
            
            <Text numberOfLines={3} className='mt-2 text-base text-neutral-600 dark:text-neutral-400'>{stripTags(data.description)}</Text>
            
        </View>
    );
}
