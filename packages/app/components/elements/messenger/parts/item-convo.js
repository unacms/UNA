import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import { useCurrentUser } from 'app/context/user';


export default function ({ item, index, changeConvo, selectedIndex }) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const participants = item.participants.filter(p => p.id != currentUser.id);
    const names = participants.map(p => p.display_name).join(', ');
    //memo(
    const Item = ({item, index, changeConvo, selectedIndex }) => (<Pressable onPress={() => changeConvo(item)}>
        <Row className={(selectedIndex == index ? ' bg-accent/60 ' : '') + ' gap-3 border-border/50 border-b flex-row px-3 py-2'} >
            <View className=" rounded-full flex-none bg-secondary">
                <Profile
                    {...participants[0]}
                    displayType="unit_wo_info"
                    displaySize="base"
                />
            </View>
            <View className="flex-auto flex-col my-auto ">
                
                <Text className="flex-auto text-base font-bold text-card-foreground sm:group-hover:text-accent web:sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                    {names}
                </Text>
                <Row>
                    <Time className="text-xs flex-none text-muted-foreground" ts={item.date}></Time>
                </Row>
                <View className="flex-row absolute right-0 top-1/2 -translate-y-1/2  items-end content-end">
                   
                    <View className="flex-none bg-primary rounded-full    my-auto h-min px-1.5">
                        {(item.unread > 0 && selectedIndex != index) && (
                            <Text className="text-xs text-white dark:text-black font-medium">
                                {item.unread}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
            {participants.length > 1 && (
                    <View className='absolute bottom-1 left-9  bg-primary border border-background h-5 text-center justify-center rounded-full px-1'>
                    <Text className={` text-center items-center text-white text-xs font-semibold`}>
                            +{participants.length-1}
                    </Text>
                    </View>
                )}
        </Row>
    </Pressable>);
    
    //if (!isWeb) {
    return <Item item={item} index={index} changeConvo={changeConvo} selectedIndex={selectedIndex} />
    //}
}