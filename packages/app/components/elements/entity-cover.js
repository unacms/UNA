import { View } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { Text } from 'app/design/typography';
import { CoverMenuMeta, CoverMenu } from 'app/components/elements/covers/menu-cover';
import { stripTags } from 'app/lib/util'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ({ data, blockWrapperProps, uri }) {
    return (
        <BlockWrapper {...blockWrapperProps}>
            {!!data.cover && <View className="w-full h-28 ">
                <Image alt={data.fullname} view="cover" src={data.cover.src} priority />
            </View>}
            <View className="p-4 w-full mx-auto bg-card h-min overflow-hidden rounded-2xl shadow-sm">
                {!!data.image && <View className="w-28 h-28 overflow-hidden bg-background   rounded-full  "><Image alt={data.fullname} className="rounded-full" view="cover" src={data.image.src} priority={!data.cover} /></View>}
                <View className="flex-row flex-wrap ">
                    <View className=" flex-auto">
                        <Text className="text-2xl pt-4 font-bold text-secondary-foreground ">
                            {data.fullname || data.space_name || data.name}
                        </Text>

                    </View>
                </View>
                <View className="text-center flex-row py-3 gap-3 items-center">
                    <CoverMenuMeta {...data.meta_menu} />
                </View>
                <View className="w-full">
                    <CoverMenu  isSplitMenu={false} size='sm' {...data.actions_menu} uri={uri} />
                  
                </View>
                <Text numberOfLines={3} className='mt-2 text-base text-muted-foreground '>{stripTags(data.description || data.space_desc)}</Text>
            </View>
        </BlockWrapper>
    );
}
