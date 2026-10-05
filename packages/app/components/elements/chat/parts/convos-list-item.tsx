import { useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row, Pressable } from 'app/design/view';
import Profile from 'app/ui/molecules/profile/profile';
import Time from 'app/ui/atoms/time';

const isWeb = Platform.OS === 'web';

type ConvosListItemProps = {
    /** Props for `Profile` (avatar unit). */
    profile: Record<string, any>;
    title: string;
    /** Unix timestamp, seconds. */
    time?: number;
    /** Plain text. */
    preview?: string;
    unread?: number;
    /** "+N" badge on the avatar. */
    extraCount?: number;
    selected?: boolean;
    onPress: () => void;
};

/**
 * One row of a conversation list: avatar, title, time, one-line preview, unread
 * badge. Shared by the messenger and the agents page so both lists look the same.
 *
 * 8px outside + 8px inside, so avatars line up with the 16px list header and
 * tabs while the highlight keeps an 8px inset.
 */
export default function ConvosListItem({
    profile,
    title,
    time,
    preview,
    unread = 0,
    extraCount = 0,
    selected = false,
    onPress,
}: ConvosListItemProps) {
    // Native has no :active for the inner Row, so track the press to show the
    // hover highlight while the finger is down.
    const [pressed, setPressed] = useState(false);
    const pressProps = isWeb ? null : { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) };
    const rowBg = selected ? ' bg-accent ' : (pressed ? ' bg-muted/60 ' : ' web:group-hover:bg-muted/60 active:bg-muted/60 ');

    return (
        <Pressable className="group w-full px-2 py-0.5 web:cursor-pointer" onPress={onPress} {...pressProps}>
            <Row className={rowBg + ' relative w-full overflow-hidden gap-3 rounded-xl px-2 py-2 web:duration-200'}>
                <View className=" rounded-full flex-none bg-secondary mb-auto">
                    <Profile
                        {...profile}
                        displayType="unit_wo_info"
                        displaySize="xl"
                    />
                </View>
                <View className="flex-1 my-auto ">
                    <Row className="items-center gap-2">
                        {/* Same type as the feed author name (profile_sizes.base + profile-link). */}
                        <Text className="block flex-1 min-w-0 text-base leading-6 font-semibold tracking-tight text-foreground line-clamp-1 truncate overflow-hidden max-w-full" numberOfLines={1}>
                            {title}
                        </Text>
                        {time ? <Time className="text-sm text-muted-foreground whitespace-nowrap" ts={time} /> : null}
                    </Row>
                    <View>
                        <Text className="block text-sm text-secondary-foreground web:group-hover:text-foreground line-clamp-1 truncate overflow-hidden max-w-full" numberOfLines={1}>
                            {preview}
                        </Text>
                    </View>
                </View>
                {unread > 0 && !selected ? (
                    <View className="flex-none bg-primary rounded-full mb-auto mt-1 h-min min-w-5 min-h-5 items-center justify-center px-1.5">
                        <Text className="text-xs text-primary-foreground font-semibold">
                            {unread}
                        </Text>
                    </View>
                ) : null}

                {extraCount > 0 ? (
                    <View className="absolute bottom-1 start-10 bg-muted border border-card h-5 text-center justify-center rounded-full px-1">
                        <Text className="text-center items-center text-muted-foreground text-xs font-semibold">
                            +{extraCount}
                        </Text>
                    </View>
                ) : null}
            </Row>
        </Pressable>
    );
}
