import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { fetcher } from 'app/lib/fetcher';
import { useState, useMemo, useCallback, type ComponentType } from 'react';
import MessageItem from 'app/components/elements/chat/parts/message-item'
import { NeoButton } from 'app/design/controls'
import Form from 'app/components/elements/form';
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';
import { components } from 'app/components/registry';
import { useTranslation } from 'react-i18next';
import { FeedbackHaptics } from 'app/lib/util';
import { playCue } from 'app/lib/sound';
import { Icon } from 'app/ui/atoms/icon';
import { toUnaDisplayImageItem } from 'app/lib/image-helpers'
import CarouselJs from 'app/ui/molecules/content/carousel'
import { Modal } from 'app/design/controls'
import emitter, { EVENTS } from 'app/context/emitter';
import { TouchableWithoutFeedback } from 'react-native';
import { ContentMore } from 'app/ui/molecules/content/content-more'
import type { ApiMenuItem, Jot } from 'app/components/elements/messenger/parts/messenger.types';

const registry = components as Record<string, Record<string, any> | undefined>;
// carousel.js is untyped: `memo` of a JS component infers no props.
const Carousel = CarouselJs as unknown as ComponentType<{ data: unknown[]; maxWidth?: number }>;

type JotItemProps = {
    item: Jot;
    index?: number;
    handleReply: (item: Jot) => void;
    /** Above the first unread message: the 'new messages' line with this count. */
    unreadCount?: number;
    /** Saved / removed from saved by the viewer. */
    onSavedChange?: (item: Jot, saved: boolean) => void;
};

type ViewState = { view: '' | 'edited'; data?: Record<string, any> };

export default function JotItem({ item, handleReply, unreadCount = 0, onSavedChange }: JotItemProps) {
    const Reactions = registry['molecule']?.['reactions'];
    const { t } = useTranslation();
    const [postData, setPostData] = useState<FormData | null>(null)
    const [viewState, setViewState] = useState<ViewState>({ view: '' })
    // Last save / remove from saved: the new state and UNA's item title for it. Kept with the
    // message id, as a list can reuse this row for another message.
    const [savedLocal, setSavedLocal] = useState<{ id: Jot['id']; saved: boolean; title?: string } | null>(null)
    const savedForItem = savedLocal && savedLocal.id === item.id ? savedLocal : null
    const isSaved = savedForItem ? savedForItem.saved : item.saved == 1
    const saveTitle = savedForItem?.title || null

    const handleManageMenuSelect = useCallback(async (oItem: DropdownMenuItemData & { name?: string }) => {
        switch (oItem.name) {
            case 'edit': {
                const result = await fetcher('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ 'action': 'edit', id: item.id }));
                setViewState({ view: 'edited', data: result });
                break;
            }

            case 'remove':
                await fetcher('/api.php?r=bx_messenger/remove_jot/Services&params=' + JSON.stringify({ jot_id: item.id, lot_id: item.lot_id, lot_hash: item.lot_hash }));
                break;

            case 'save': {
                const result = await fetcher('/api.php?r=bx_messenger/save_jot/Services&params=' + JSON.stringify({ jot: item.id }));
                if (result?.data?.code == 0) {
                    const saved = result.data.value == 1;
                    playCue('toggle', { emphasis: 'subtle' });
                    setSavedLocal({ id: item.id, saved, title: result.data.title || undefined });
                    onSavedChange?.(item, saved);
                }
                else
                    playCue('error');
                break;
            }
        }
    }, [item, onSavedChange]);

    useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params[]=', postData);

    const aImg = useMemo(
        () => (item?.files || []).map(toUnaDisplayImageItem).filter(Boolean),
        [item]
    );

    const onFormSubmit = useCallback((formData: FormData) => {
        formData.set("id", String(item.lot_id ?? ''));
        setViewState({ view: '' })
        setPostData(formData);
    }, [item.lot_id]);

    const aManageMenu = useMemo<ApiMenuItem[]>(
        () => (item.menu?.items || []).filter((menuItem) => ['save', 'remove', 'edit'].includes(menuItem.name)),
        [item]
    );

    const handleReplyInner = useCallback(async (jot: Jot) => {
        FeedbackHaptics('Medium');
        emitter.emit(EVENTS.editor, { action: 'focus' })
        handleReply(jot);
    }, [handleReply]);

    const reactionsWithUpdatedParams = {
        ...item.reactions,
        params: { ...item.reactions?.params, button_size: "xs", button_variant: "link" }
    };

    const Jot = <TouchableWithoutFeedback onPress={() => { emitter.emit(EVENTS.editor, { action: 'blur' }) }}><View className='w-full'>
        <MessageItem
            author={item.author_data || {}}
            time={item.created}
            badges={isSaved ? (
                <View accessibilityLabel={t('Saved')}>
                    <Icon icon="Bookmark" size={14} className="text-primary" />
                </View>
            ) : null}
            footer={
            <View className="flex-row justify-between items-center mt-0.5">
                <View className="pl-12">
                    <NeoButton style="borderless" controlSize="mini" borderShape="capsule" align="start" image="MessageCircle" label={t("Reply")} haptics={false} onPress={() => handleReplyInner(item)} />
                </View>
                <Row className='gap-2'>
                    <View className=''>
                        {Reactions ? <Reactions key={'reactions_' + item.id} {...reactionsWithUpdatedParams} /> : null}
                    </View>
                    {aManageMenu.length > 0 &&
                        <DropdownMenu items={aManageMenu.map((aItem) => {
                            return {
                                id: aItem.id + '-' + aItem.name,
                                name: aItem.name,
                                link: aItem.link,
                                title: aItem.name === 'save' && saveTitle ? saveTitle : aItem.title
                            };
                        })} onSelect={handleManageMenuSelect}
                            buttonProps={{ style: 'borderless', controlSize: 'mini', borderShape: 'circle', image: 'Ellipsis', accessibilityLabel: t('More options') }} />
                    }
                </Row>
            </View>
                }
        >
                    {viewState.view == 'edited' ? (
                        <Modal
                            title={t("Edit")}
                            onVisible={true}
                            onClose={() => {
                                setViewState({ view: '' })
                            }}
                            headerBorder={true}
                        >
                            <View className="p-2">
                                <Form
                                    name='bx_messenger'
                                    {...viewState.data}
                                    classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                    onFormSubmit={onFormSubmit}
                                />
                            </View>

                        </Modal>


                    ) : <View className="pb-2">
                        {Number(item.reply) > 0 ? (
                            <View className="border border-border/60 rounded-md p-2 my-1 bg-muted-foreground/20">
                                <ContentMore
                                    content={item?.reply_message}
                                    embed={undefined}
                                    numberOfLines={2}
                                    numberOfSymbols={200}
                                    openSmall={false}
                                    customClassName="u-vanilla-html-small"
                                />
                            </View>
                        ) : null}
                        <ContentMore
                            content={item?.message}
                            embed={undefined}
                            numberOfLines={3}
                            numberOfSymbols={360}
                            openSmall={false}
                            showLess={true}
                            customClassName="u-vanilla-html-small"
                        />
                        {aImg.length > 0 && <View className="max-w-xs w-full"><Carousel data={aImg} /></View>}
                    </View>}
        </MessageItem>
    </View></TouchableWithoutFeedback>

    if (!unreadCount)
        return Jot

    // 'New messages' line above the first unread message of this visit.
    return (
        <View className='w-full'>
            <Row className='w-full items-center gap-3 px-4 mt-4' accessibilityRole='header'>
                <View className='flex-1 h-px bg-primary/60' />
                <Text className='text-xs font-semibold text-primary'>
                    {t('{{count}} new messages', { count: unreadCount })}
                </Text>
                <View className='flex-1 h-px bg-primary/60' />
            </Row>
            {Jot}
        </View>
    )
}
