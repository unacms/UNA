import { memo } from 'react';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import Form from 'app/components/elements/form';
import { ContentMore } from 'app/ui/molecules/content/content-more';
import { useTranslation } from 'react-i18next';

/** Message composer: optional reply-to strip + the UNA send form. */
const Composer = memo(function Composer({ form, replyItem, onFormSubmit, handleCancelReply }) {
    const { t } = useTranslation();

    return (
        <View className="p-1.5 sm:p-2.5">
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
        </View>
    );
});

export default Composer;
