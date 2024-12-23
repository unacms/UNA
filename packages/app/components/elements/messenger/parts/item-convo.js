import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { stripTags } from 'app/lib/util'
import Card from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import { Platform } from 'react-native'
import { memo, useContext } from 'react';
import { useCurrentUser } from 'app/context/user';


export default function ({ item, index, changeConvo, selectedIndex }) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const participants = item.participants.filter(p => p.id != currentUser.id);
    const names = participants.map(p => p.display_name).join(', ');
    //memo(
    const Item = ({item, index, changeConvo, selectedIndex }) => (<Pressable onPress={() => changeConvo(item)}>
        <Card border="  sm:hover:bg-bgritem dark:sm:hover:bg-bgritem-d " addClassName={(selectedIndex == index ? ' bg-neutral-500/10 ' : '') + 'group  active:opacity-50 active:translate-y-1 flex-row p-3 sm:px-4 '} rounded="rounded-none" margin=" ">
            <View className=" mr-3 rounded-full flex-none bg-secondary-500/10">
                <Profile
                    {...participants[0]}
                    displayType="unit_wo_info"
                    displaySize="lg"
                />
                
                
               
            </View>
            <View className="flex-auto flex-col my-auto ">
                
                <Text className="flex-auto text-base  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                    {names}
                </Text>
                <Row>
                    <Time className="text-xs flex-none" ts={item.date}></Time>
                </Row>
                <View className="flex-row w-full items-end content-end">
                   {/* <Text
                        className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                        numberOfLines={1}
                    >
                        {stripTags(item.message)}
</Text>*/}
                    <View className="flex-none bg-primary dark:bg-primary-d rounded-full    my-auto h-min px-1.5">
                        {(item.unread > 0 && selectedIndex != index) && (
                            <Text className="text-xs text-white dark:text-black font-medium">
                                {item.unread}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
            {participants.length > 1 && (
                    <View className='absolute bottom-1 left-10 bg-neutral-500 dark:bg-neutral-500 rounded-full p-1 h-6 w-6'>
                    <Text className={` text-center items-center text-white text-xs font-semibold`}>
                            +{participants.length-1}
                    </Text>
                    </View>
                )}
        </Card>
    </Pressable>);
    
    //if (!isWeb) {
    return <Item item={item} index={index} changeConvo={changeConvo} selectedIndex={selectedIndex} />
    //}
}