import type { ReactNode } from 'react';
import { View, Row } from 'app/design/view';
import Profile from 'app/ui/molecules/profile/profile';
import Time from 'app/ui/atoms/time';

type MessageItemProps = {
    /** Profile props (`display_name`, `url_avatar`, …). */
    author: Record<string, any>;
    /** Unix timestamp, seconds; no time shown without it. */
    time?: number;
    /** Card body. */
    children: ReactNode;
    /** Row under the card (Reply / reactions). */
    footer?: ReactNode;
};

/**
 * One message of a conversation: avatar, a translucent card with the author's
 * name and time on top and the body inside, and an optional row under it
 * (Reply / reactions). Shared by the messenger and the agent chat so both
 * transcripts look the same.
 */
export default function MessageItem({ author, time, children, footer }: MessageItemProps) {
    return (
        <View className="w-full px-4 mt-3">
            <Row className="gap-2">
                <Profile {...author} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                <View className="flex-auto min-w-0">
                    <View className="bg-card/60 shadow-card-outline dark:shadow-card-outline-deep rounded-xl px-3">
                        <Row className="items-center w-full justify-between gap-1 mb-0.5 pt-2">
                            <Profile {...author} displayType="unit_wo_image" />
                            {time ? (
                                <View>
                                    <Time className="text-muted-foreground text-sm" ts={time} />
                                </View>
                            ) : null}
                        </Row>
                        {children}
                    </View>
                </View>
            </Row>
            {footer}
        </View>
    );
}
