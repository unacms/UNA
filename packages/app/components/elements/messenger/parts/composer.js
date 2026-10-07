import { memo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import Form from 'app/components/elements/form';
import { ContentMore } from 'app/ui/molecules/content/content-more';
import { useTranslation } from 'react-i18next';
import { hasLiquidGlass, IOS_TAB_BAR_MARGIN, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { KbGutterView } from 'app/ui/atoms/kb-avoiding-view';

/** Message composer: optional reply-to strip + the UNA send form. */
const Composer = memo(function Composer({ form, replyItem, onFormSubmit, handleCancelReply }) {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    // Phones (native): at rest, line up with the tab bar (the 16px gutter; iOS 26's
    // floating bar sits at 21pt). With the keyboard up the bar is covered, so go to
    // 8px: the avatar (8px inside) then lines up with the list avatars at 16px.
    const gutter = Platform.OS !== 'web' && width < LAYOUT_BREAKPOINTS.sm
        ? { rest: hasLiquidGlass ? IOS_TAB_BAR_MARGIN : 16, open: 8 }
        : null;

    return (
        <KbGutterView className={gutter ? 'py-1.5' : 'px-4 py-1.5 sm:p-2.5'} gutter={gutter}>
            <View>
                {replyItem ? (
                    <View className="bg-accent/60 rounded-xl border border-accent px-2.5 py-2 mb-2">
                        <Row className="items-start justify-between max-w-full relative">
                            <View className="flex-auto pr-4">
                                <Row className="max-w-full">
                                    <Text className="text-xs text-popover-foreground">{t('Reply to:')} </Text>
                                    <Text className="font-semibold text-xs text-popover-foreground">{replyItem.author_data.display_name}</Text>
                                </Row>
                                <View className="overflow-hidden">
                                    <ContentMore
                                        content={replyItem.message}
                                        numberOfLines={3}
                                        numberOfSymbols={360}
                                        openSmall={false}
                                        customClassName="u-vanilla-html-small"
                                    />
                                </View>
                            </View>
                            <View className="flex-none">
                                <NeoButton
                                    style="bordered"
                                    controlSize="mini"
                                    borderShape="circle"
                                    image="X"
                                    accessibilityLabel={t('Close')}
                                    classNames={{ root: 'flex-none' }}
                                    onPress={() => handleCancelReply()}
                                />
                            </View>
                        </Row>
                    </View>
                ) : null}
                <Form {...form} name="bx_messenger" resetOnSubmit={true} classContainerName=" flex-row flex-wrap w-full items-start justify-between" onFormSubmit={onFormSubmit} />
            </View>
        </KbGutterView>
    );
});

export default Composer;
