import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Platform, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import UniList from 'app/ui/atoms/unilist';
import { getBreakpoint } from 'app/lib/util';
import type { UniListRenderItem } from 'app/ui/atoms/unilist/shared';
import {
    ConvosListHeader,
    CHAT_OVERLAY_HEADER,
    CHAT_OVERLAY_HEADER_FADE,
    ListInset,
    useDebouncedSearch,
    type MenuItem,
} from 'app/components/elements/chat/parts/headers';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';

const isWeb = Platform.OS === 'web';

/** Fallback until the list chrome (title + tabs) reports its laid-out height. */
const DEFAULT_CHROME_HEIGHT = 88;

type ConvosListProps = {
    /** Rows; each needs an `id`. */
    data?: { id: string | number }[] | null;
    panelHeight?: number;
    listHeight?: number;
    /** Stacked (list ↔ chat) layout: the title / tabs live in the injected page header. */
    isSmallScreen?: boolean;
    addButtons?: ReactNode;
    menuItems?: MenuItem[];
    menuIndex?: number;
    onMenuChange?: (index: number) => void;
    /** Room under the list for a tab bar drawn over the screen. */
    footerInset?: number;
    /** No `onSearch` means no search button. */
    onSearch?: (term: string) => void;
    // The host owns the rows, title and empty state.
    renderItem: UniListRenderItem;
    title: string;
    /** The empty list's title. */
    emptyText: string;
    /** A line under the title. */
    emptyDescription?: string;
    /** Lucide icon over the title, in a circle. */
    emptyIcon?: string;
    /** Title and line while a search found nothing (defaults to the empty list's). */
    emptySearchText?: string;
    emptySearchDescription?: string;
    /** A search kept outside the list (the small-screen header's) is on. */
    searching?: boolean;
    /** Rendered under the empty text, when no search is on. */
    emptyAction?: (helpers: { resetSearch: () => void }) => ReactNode;
};

/**
 * Conversation list panel (messenger conversations, agent threads). On desktop
 * the list fills the column and the title / tabs overlay it so rows can scroll
 * behind. On small screens that chrome lives in the injected page header (see
 * MobileListHeader).
 */
/**
 * An empty list as UNA's site shows one (BxDolEmptyState): a neutral icon in a circle, the title, one line and one
 * labelled action, in plain text on the page, not a grey box.
 */
function ListEmptyState({ headerInset, icon, title, description, action }: {
    headerInset: number;
    icon?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <View className="items-center w-full h-full px-6" style={{ paddingTop: headerInset }}>
            <View className="items-center gap-2 pt-8 max-w-sm" role="status">
                {icon ? (
                    <View className="w-12 h-12 mb-1 rounded-full items-center justify-center bg-button" aria-hidden>
                        <Icon icon={icon} size={24} className="text-secondary-foreground" />
                    </View>
                ) : null}
                <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
                {description ? (
                    <Text className="text-center text-sm text-secondary-foreground">{description}</Text>
                ) : null}
                {action ? <View className="pt-2">{action}</View> : null}
            </View>
        </View>
    );
}

const ConvosList = memo(function ConvosList({
    data,
    panelHeight,
    listHeight,
    onSearch,
    addButtons,
    isSmallScreen,
    menuItems,
    menuIndex = 0,
    onMenuChange,
    footerInset = 0,
    renderItem,
    title,
    emptyText,
    emptyDescription,
    emptyIcon,
    emptySearchText,
    emptySearchDescription,
    searching: searchingOutside = false,
    emptyAction,
}: ConvosListProps) {
    const search = useDebouncedSearch(onSearch);
    const searching = !!search.value || searchingOutside;
    const [chromeHeight, setChromeHeight] = useState(DEFAULT_CHROME_HEIGHT);

    const handleChromeLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0)
            setChromeHeight(prev => (prev === height ? prev : height));
    }, []);

    const windowScroll = isWeb && !!isSmallScreen;
    // Native small screens: fill the tab screen edge-to-edge like feed /
    // conductor lists — rows scroll under the page header (UniList pads for
    // it) and the native tab bar (`footerInset`).
    const fillScreen = !isWeb && !!isSmallScreen;
    const listH = Math.max(0, listHeight || panelHeight || 0);
    const overlayList = !isSmallScreen;
    // Phones: edge-to-edge card rows (each 1px below the one above, the first
    // below the header too), like Notifications. Wider: rows
    // inset themselves 8px on the sides but sit 2px apart; 6px more at the top
    // and bottom puts the first and last rows 8px from the list's edges, like
    // Notifications (`paddingForList` sm:py-1.5, on web and native).
    const { width: windowWidth } = useWindowDimensions();
    const listEdge = getBreakpoint(windowWidth) ? 6 : 0;
    const headerInset = (overlayList ? chromeHeight : 0) + listEdge;
    const bottomInset = footerInset + listEdge;
    const listOverlayProps = useMemo(() => {
        if (!headerInset && !bottomInset) return {};
        if (isWeb) {
            return {
                components: {
                    Header: () => <ListInset height={headerInset} />,
                    Footer: () => <ListInset height={bottomInset} />,
                },
            };
        }
        return {
            ListHeaderComponent: <ListInset height={headerInset} />,
            ListFooterComponent: <ListInset height={bottomInset} />,
        };
    }, [headerInset, bottomInset]);

    const list = data && data.length > 0 ? (
        <UniList
            data={data}
            mode="simple"
            useCustomScrollHandler={!!isSmallScreen && !isWeb}
            useWindowScroll={windowScroll}
            height={windowScroll ? undefined : listH}
            renderItem={renderItem}
            {...listOverlayProps}
        />
    ) : (
        <ListEmptyState
            headerInset={headerInset}
            icon={emptyIcon}
            title={searching ? (emptySearchText ?? emptyText) : emptyText}
            description={searching ? (emptySearchDescription ?? emptyDescription) : emptyDescription}
            action={searching ? null : emptyAction?.({ resetSearch: search.reset })}
        />
    );

    return (
        <View
            className={`${overlayList ? 'relative flex-1 min-h-0 overflow-hidden' : 'w-full'} ${fillScreen ? 'flex-1' : ''}`}
            style={overlayList
                ? { height: panelHeight || listH }
                : (!windowScroll && !fillScreen && listH > 0 ? { height: listH } : undefined)
            }
        >
            {overlayList ? <View className="absolute inset-0">{list}</View> : list}

            {overlayList ? (
                <EdgeBlurView edge="top" config={edgeBlurConfig('footer')} className={CHAT_OVERLAY_HEADER} washClassName={CHAT_OVERLAY_HEADER_FADE} pointerEvents="box-none">
                    <View pointerEvents="auto">
                        <ConvosListHeader
                            title={title}
                            searchValue={search.value}
                            onChangeSearch={search.setValue}
                            onCloseSearch={search.reset}
                            addButtons={addButtons}
                            menuItems={menuItems}
                            menuIndex={menuIndex}
                            onMenuChange={onMenuChange ?? (() => {})}
                            onLayout={handleChromeLayout}
                            searchable={!!onSearch}
                        />
                    </View>
                </EdgeBlurView>
            ) : null}
        </View>
    );
});

export default ConvosList;
