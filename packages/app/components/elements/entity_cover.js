import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { Text } from 'app/design/typography';
import { CoverMenuMeta, CoverMenu } from 'app/components/nav/menu-cover'
import { stripTags } from 'app/lib/util'
import { BlockWrapper } from 'app/components/block-wrapper'
export default function ({ data, blockWrapperProps, uri }) {

    return (
        <BlockWrapper {...blockWrapperProps}><View className="flex-col p-4 w-full mx-auto bg-card h-min overflow-hidden rounded-2xl shadow-sm">
            <View className="w-28 h-28 overflow-hidden bg-background   rounded-full  ">
                {!!data.image ? <Image alt={data.fullname} className="rounded-full" view="cover" src={data.image.src} /> : <View><View className="w-[50%] z-20 aspect-square bg-secondary   border-4 border-border  mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square  bg-secondary    mx-auto rounded-t-full  "></View></View>}
            </View>
            <View className="flex-row flex-wrap ">
                <View className=" flex-col   flex-auto">
                    <Text className="text-2xl pt-4 font-bold text-secondary-foreground ">
                        {data.fullname || data.space_name}
                    </Text>

                </View>
                
            </View>
            <View className="text-center flex-row py-3 gap-3 items-center">
                
                <CoverMenuMeta {...data.meta_menu} />
            </View>
            <View className="text-center flex-row gap-x-2 items-center">
                <CoverMenu containerClasses=" hz " size='sm' {...data.actions_menu} uri={uri} />
            </View>
            
            <Text numberOfLines={3} className='mt-2 text-base text-muted-foreground '>{stripTags(data.description || data.space_desc)}</Text>
            
        </View></BlockWrapper>
    );
}
