import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import { stripTags } from 'app/lib/util'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import { Platform } from 'react-native'

export default function ConvosItem({ item, index, changeConvo, selectedIndex }) {
    const isWeb = Platform.OS == 'web'

    const Item = <Pressable onPress={() => changeConvo(item)}>
        <Card border="mb-[1px] border-dashed sm:hover:bg-bgritem dark:sm:hover:bg-bgritem-d border-bdrcard dark:border-bdrcard-d" addClassName={(selectedIndex == index ? ' bg-neutral-500/10 ' : '') + 'group  active:opacity-50 active:translate-y-1 flex-row px-3 py-2 '} rounded="rounded-none" margin=" -mb-[1px]">
            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                <Profile
                    {...item.author_data}
                    displayType="unit_wo_info"
                    displaySize="base"
                />
            </View>
            <View className="flex-auto flex-col my-auto ">
                <View className="flex-row gap-x-2">
                    <Text className="text-xs flex-auto font-semibold text-neutral-800 dark:text-neutral-200">
                        {item.author_data.display_name}
                    </Text>
                    <Time className="text-xs flex-none" ts={item.date}></Time>
                </View>
                <Text className="flex-auto text-base  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                    {item.title}
                </Text>
                <View className="flex-row w-full items-end content-end">
                    <Text
                        className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                        numberOfLines={1}
                    >
                        {stripTags(item.message)}
                    </Text>
                    <View className="flex-none bg-primary dark:bg-primary-d rounded-full    my-auto h-min px-1.5">
                        {(item.unread > 0 && selectedIndex != index) && (
                            <Text className="text-xs text-white dark:text-black font-medium">
                                {item.unread}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </Card>
    </Pressable>
    
    if (!isWeb) {
        Item
        
    }

    return (
        <AnimatedBlock key={'convos' + index}>
            {Item}
        </AnimatedBlock>
    )
}