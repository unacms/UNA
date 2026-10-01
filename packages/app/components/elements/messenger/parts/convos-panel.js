import { memo, useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import {
    ConvosPanelHeader,
    MESSENGER_OVERLAY_HEADER,
    MESSENGER_OVERLAY_HEADER_FADE,
    MessengerListInset,
    useDebouncedSearch,
} from 'app/components/elements/messenger/parts/headers';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import { useTranslation } from 'react-i18next';

const isWeb = Platform.OS === 'web';

/** Fallback until the list chrome (title + tabs) reports its laid-out height. */
const DEFAULT_CHROME_HEIGHT = 88;

/**
 * Conversation list panel. On desktop the list fills the column and the
 * title / tabs overlay it so rows can scroll behind. On small screens that
 * chrome lives in the injected page header (see MobileListHeader).
 */
const ConvosPanel = memo(function ConvosPanel({
    data,
    panelHeight,
    listHeight,
    selectedConvoIndex,
    changeConvo,
    onSearch,
    onSave,
    addButtons,
    isSmallScreen,
    menuItems,
    menuIndex,
    onMenuChange,
    footerInset = 0,
}) {
    const { t } = useTranslation();
    const search = useDebouncedSearch(onSearch);
    const [chromeHeight, setChromeHeight] = useState(DEFAULT_CHROME_HEIGHT);
    const listTitle = t('Messages');

    const handleChromeLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0)
            setChromeHeight(prev => (prev === height ? prev : height));
    }, []);

    const windowScroll = isWeb && isSmallScreen;
    // Native small screens: fill the tab screen edge-to-edge like feed /
    // conductor lists — rows scroll under the page header (UniList pads for
    // it) and the native tab bar (`footerInset`).
    const fillScreen = !isWeb && isSmallScreen;
    const listH = Math.max(0, listHeight || panelHeight || 0);
    const overlayList = !isSmallScreen;
    const headerInset = overlayList ? chromeHeight : 0;
    const listOverlayProps = useMemo(() => {
        if (!headerInset && !footerInset) return {};
        if (isWeb) {
            return {
                components: {
                    Header: () => <MessengerListInset height={headerInset} />,
                    Footer: () => <MessengerListInset height={footerInset} />,
                },
            };
        }
        return {
            ListHeaderComponent: <MessengerListInset height={headerInset} />,
            ListFooterComponent: <MessengerListInset height={footerInset} />,
        };
    }, [headerInset, footerInset]);

    const list = data && data.length > 0 ? (
        <UniList
            data={data}
            mode="simple"
            useCustomScrollHandler={isSmallScreen && !isWeb}
            useWindowScroll={windowScroll}
            height={windowScroll ? undefined : listH}
            renderItem={({ item, index }) => (
                // Small screens show the list or the chat, never both, so a
                // "current" row would only linger after Back. Desktop keeps it
                // highlighted next to the open chat.
                <ItemConvo selectedIndex={isSmallScreen ? -1 : selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />
            )}
            {...listOverlayProps}
        />
    ) : (
        <View className="items-center justify-center w-full h-full" style={{ paddingTop: headerInset }}>
            <View className="pt-8">
                <View className="gap-y-2 items-center opacity-80 justify-center mx-auto my-auto py-4 px-8 rounded-2xl bg-muted-foreground/10">
                    <Text className="text-center text-lg text-secondary-foreground lg:text-xl font-semibold">
                        {t('No conversations found')}
                    </Text>
                    {addButtons?.length > 0 && <CreateConvoButton variant="secondary" onSave={onSave} onShow={search.reset} />}
                </View>
            </View>
        </View>
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
                <EdgeBlurView edge="top" config={edgeBlurConfig('footer')} className={MESSENGER_OVERLAY_HEADER} washClassName={MESSENGER_OVERLAY_HEADER_FADE} pointerEvents="box-none">
                    <View pointerEvents="auto">
                        <ConvosPanelHeader
                            title={listTitle}
                            searchValue={search.value}
                            onChangeSearch={search.setValue}
                            onCloseSearch={search.reset}
                            addButtons={addButtons}
                            menuItems={menuItems}
                            menuIndex={menuIndex}
                            onMenuChange={onMenuChange}
                            onLayout={handleChromeLayout}
                        />
                    </View>
                </EdgeBlurView>
            ) : null}
        </View>
    );
});

export default ConvosPanel;
