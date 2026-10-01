import { useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import Profile from 'app/ui/molecules/profile/profile'
import Time from 'app/ui/atoms/time'
import { useCurrentUser } from 'app/context/user';
import { stripTags } from 'app/lib/util';

const isWeb = Platform.OS === 'web';

// 8px outside + 8px inside, so avatars line up with the 16px list header and
// tabs while the highlight keeps an 8px inset.
export default function ({ item, index, changeConvo, selectedIndex }) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    // Native has no :active for the inner Row, so track the press to show the
    // hover highlight while the finger is down.
    const [pressed, setPressed] = useState(false);
    const participants = item.participants.filter(p => p.id != currentUser.id);
    const names = participants.map(p => p.display_name).join(', ');
    const pressProps = isWeb ? null : { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) };
    const rowBg = selectedIndex == index ? ' bg-accent ' : (pressed ? ' bg-muted/60 ' : ' web:group-hover:bg-muted/60 active:bg-muted/60 ');

    return (<Pressable className="group w-full px-2 py-0.5 web:cursor-pointer" onPress={() => changeConvo(item)} {...pressProps}>
        <Row className={rowBg + ' relative w-full overflow-hidden gap-3 rounded-xl px-2 py-2 web:duration-200'} >
            
            <View className=" rounded-full flex-none bg-secondary mb-auto">
                <Profile
                    {...participants[0]}
                    displayType="unit_wo_info"
                    displaySize="base"
                />
            </View>
            <View className="flex-1 my-auto ">
                <Row className="items-center gap-1 ">
                <Text className="block flex-1 min-w-0 text-sm leading-5 font-bold text-card-foreground web:group-hover:text-foreground line-clamp-1 truncate overflow-hidden max-w-full" numberOfLines={1}>
                    {names}
                </Text>
                <Time className="text-sm text-muted-foreground whitespace-nowrap" ts={item.date}></Time>
                </Row>
                <View className="">
                    <Text className="block text-sm text-secondary-foreground web:group-hover:text-foreground line-clamp-1 truncate overflow-hidden max-w-full" numberOfLines={1}>
                    {stripTags(item.message)}
                </Text>
                </View>
            </View>
            {(item.unread > 0 && selectedIndex != index) && (
                <View className="flex-none bg-primary rounded-full mb-auto mt-1 h-min min-w-5 min-h-5 items-center justify-center px-1.5">

                    <Text className="text-xs text-primary-foreground font-semibold">
                        {item.unread}
                    </Text>
                </View>
            )}

            {participants.length > 1 && (
                <View className="absolute bottom-1 start-8 bg-muted border border-card h-5 text-center justify-center rounded-full px-1">
                    <Text className="text-center items-center text-muted-foreground text-xs font-semibold">
                        +{participants.length - 1}
                    </Text>
                </View>
            )}
        </Row>
    </Pressable>);
}