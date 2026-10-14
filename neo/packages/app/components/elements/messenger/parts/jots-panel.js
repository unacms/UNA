import { memo, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';
import { Icon } from 'app/ui/atoms/icon';
import { ListInset } from 'app/components/elements/chat/parts/headers';
import { useTranslation } from 'react-i18next';

const isWeb = Platform.OS === 'web';
const invertedNative = !isWeb;

/**
 * Where the 'new messages' line goes: before the first unread message, or before
 * the first loaded one when the unread start is on an earlier page. Returns the
 * row index (-1 for none) and the jot id the line is drawn above.
 */
function getUnreadStart(data, unread) {
    if (!unread?.count || !unread?.firstId || !Array.isArray(data) || !data.length) return { index: -1, jotId: 0 };

    const index = data.findIndex((jot) => Number(jot?.id) >= unread.firstId);
    if (index < 0) return { index: -1, jotId: 0 };

    return { index, jotId: Number(data[index].id) };
}

/** Message list of the open conversation. Desktop chrome overlays the parent; mobile web window-scrolls. */
const JotsPanel = memo(function JotsPanel({ data, unread, listHeight, refListJots, startReached, handleReply, isSmallScreen, headerInset = 0, footerInset = 0, keyboardBottomOffset }) {
    // Taken once when the talk opens: the line keeps its place while new messages arrive.
    const [unreadStart] = useState(() => getUnreadStart(data, unread));
    // Open on the line, one message above it for context, instead of the end.
    const initialPosition = useMemo(() => {
        if (unreadStart.index < 0) return {};
        const index = Math.max(0, unreadStart.index - 1);
        return isWeb ? { initialTopMostItemIndex: { index, align: 'start' } } : { initialScrollIndex: index };
    }, [unreadStart]);

    const listOverlayProps = useMemo(() => {
        if (isWeb) {
            return {
                components: {
                    Header: () => <ListInset height={headerInset} />,
                    Footer: () => <ListInset height={footerInset} />,
                },
            };
        }
        // UniList's chat mode keeps the rows top-to-bottom (alignItemsAtEnd, not a
        // real invert), so the composer inset belongs at the bottom here too.
        return {
            ListHeaderComponent: <ListInset height={headerInset} />,
            ListFooterComponent: <ListInset height={footerInset} />,
        };
    }, [headerInset, footerInset]);

    const windowScroll = isWeb && isSmallScreen;
    const fillParent = !isSmallScreen;
    // Native small screens: the chat fills the tab screen; header and composer
    // overlay it and the insets keep the newest / oldest rows clear of them.
    const fillScreen = !isWeb && isSmallScreen;
    const listH = Math.max(0, listHeight || 0);

    return (
        <View
            className={fillParent ? 'absolute inset-0' : fillScreen ? 'w-full flex-1' : 'w-full'}
            style={!fillParent && !fillScreen && !windowScroll && listH > 0 ? { height: listH } : undefined}
        >
            <UniList
                refer={refListJots}
                {...(invertedNative ? { inverted: true } : {})}
                overscan={900}
                onStartReached={startReached}
                scrollToLastItem={true}
                data={data}
                useWindowScroll={windowScroll}
                height={windowScroll ? undefined : (listH || undefined)}
                mode="simple"
                useCustomScrollHandler={isSmallScreen && !isWeb}
                keyboardBottomOffset={keyboardBottomOffset}
                renderItem={({ item, index }) => (
                    <ItemJot
                        handleReply={handleReply}
                        item={item}
                        index={index}
                        unreadCount={Number(item?.id) === unreadStart.jotId ? unread?.count : 0}
                    />
                )}
                {...listOverlayProps}
                {...initialPosition}
            />
        </View>
    );
});

export default JotsPanel;

/** Desktop right panel when no conversation is selected. */
export function ChatEmptyState() {
    const { t } = useTranslation();
    return (
        <View className="flex-1 items-center justify-center">
            <View className="gap-y-2 items-center opacity-80 justify-center py-4 px-8">
                <Icon icon="MessagesSquare" size={28} className="text-muted-foreground" />
                <Text className="text-center text-base text-muted-foreground font-medium">
                    {t('Select a conversation')}
                </Text>
            </View>
        </View>
    );
}
