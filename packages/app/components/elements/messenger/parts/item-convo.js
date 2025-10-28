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
    const Item = ({ item, index, changeConvo, selectedIndex }) => (<Pressable onPress={() => changeConvo(item)}>
        <Row className={(selectedIndex == index ? ' bg-primary/10 ' : '') + ' gap-3 px-3 py-2'} >
            
            <View className=" rounded-full flex-none bg-secondary mb-auto">
                <Profile
                    {...participants[0]}
                    displayType="unit_wo_info"
                    displaySize="lg"
                />
            </View>
            <View className="flex-auto flex-col my-auto ">
                <Row className="flex-row items-center justify-between gap-1 ">
                <Text className="flex-auto text-base font-bold text-card-foreground web:group-hover:text-foreground line-clamp-1 truncate " numberOfLines={1}>
                    {names}
                </Text>
                <Time ts={item.date}></Time>
                </Row>
                <Row>
                    <Text className="flex-auto text-sm text-card-foreground web:group-hover:text-foreground line-clamp-1 truncate " numberOfLines={1}>
                    {item.message}
                </Text>
                </Row>
            </View>
            {(item.unread > 0 && selectedIndex != index) && (
                <View className="flex-none bg-primary rounded-full my-auto h-min min-w-5 min-h-5 items-center justify-center px-1.5">

                    <Text className="text-xs text-inverted-foreground font-semibold">
                        {item.unread}
                    </Text>
                </View>
            )}

            {participants.length > 1 && (
                <View className="absolute bottom-1 start-9 bg-muted border border-card h-5 text-center justify-center rounded-full px-1">
                    <Text className="text-center items-center text-muted-foreground text-xs font-semibold">
                        +{participants.length - 1}
                    </Text>
                </View>
            )}
        </Row>
    </Pressable>);

    //if (!isWeb) {
    return <Item item={item} index={index} changeConvo={changeConvo} selectedIndex={selectedIndex} />
    //}
}