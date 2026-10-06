import { View, Row } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useMemo, useCallback } from 'react';
import MessageItem from 'app/components/elements/chat/parts/message-item'
import { NeoButton } from 'app/design/controls'
import Form from 'app/components/elements/form';
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { components } from 'app/components/registry';
import { useTranslation } from 'react-i18next';
import { FeedbackHaptics } from 'app/lib/util';
import { toUnaDisplayImageItem } from 'app/lib/image-helpers'
import Carousel from 'app/ui/molecules/content/carousel'
import { Modal } from 'app/design/controls'
import emitter, { EVENTS } from 'app/context/emitter';
import { TouchableWithoutFeedback } from 'react-native';
import { ContentMore } from 'app/ui/molecules/content/content-more'

export default function JotItem({ item, index, handleReply }) {
    const Reactions = components['molecule']['reactions'];
    const { t } = useTranslation();
    const [postData, setPostData] = useState(null)
    const [viewState, setViewState] = useState({ view: '' })

    const handleManageMenuSelect = useCallback(async (oItem, event) => {

        switch (oItem.name) {
            case 'edit':
                const result = await fetcher('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ 'action': 'edit', id: item.id }));
                setViewState({ view: 'edited', data: result });
                break;

            case 'remove':
                const result1 = await fetcher('/api.php?r=bx_messenger/remove_jot/Services&params=' + JSON.stringify({ jot_id: item.id, lot_id: item.lot_id, lot_hash: item.lot_hash }));
                break;
        }
    }, [item]);

    const { data: dynamicData } = useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params[]=', postData);

    let aImg = useMemo(
        () => (item?.files || []).map(toUnaDisplayImageItem).filter(Boolean),
        [item]
    );

    const onFormSubmit = useCallback((formData, d) => {
        formData.set("id", item.lot_id);
        setViewState({ view: '' })
        setPostData(formData);
    }, []);

    const aManageMenu = useMemo(() => item.menu?.items.filter(item => ['remove', 'edit'].includes(item.name)), [item]);

    const handleReplyInner = useCallback(async (item) => {
        FeedbackHaptics('Medium');
        emitter.emit(EVENTS.editor, { action: 'focus' })
        handleReply(item);
    }, [handleReply]);

    const reactionsWithUpdatedParams = {
        ...item.reactions,
        params: { ...item.reactions.params, button_size: "xs", button_variant: "link" }
    };

    const Jot = <TouchableWithoutFeedback onPress={() => { emitter.emit(EVENTS.editor, { action: 'blur' }) }}><View className='w-full'>
        <MessageItem
            author={item.author_data}
            time={item.created}
            footer={
            <View className="flex-row justify-between items-center mt-0.5">
                <View className="pl-12">
                    <NeoButton style="borderless" controlSize="mini" borderShape="capsule" align="start" image="MessageCircle" label={t("Reply")} haptics={false} onPress={() => handleReplyInner(item)} />
                </View>
                <Row className='gap-2'>
                    <View className=''>
                        <Reactions key={'reactions_' + item.id} {...reactionsWithUpdatedParams} />
                    </View>
                    {aManageMenu.length > 0 &&
                        <DropdownMenu items={aManageMenu.map((aItem) => {
                            return {
                                id: aItem.id + '-' + aItem.name,
                                name: aItem.name,
                                link: aItem.link,
                                title: aItem.title
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
                            transparent={true}
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
                        {item.reply > 0 ? (
                            <View className="border border-border/60 rounded-md p-2 my-1 bg-muted-foreground/20">
                                <ContentMore
                                    content={item?.reply_message}
                                    numberOfLines={2}
                                    numberOfSymbols={200}
                                    openSmall={false}
                                    customClassName="u-vanilla-html-small"
                                />
                            </View>
                        ) : null}
                        <ContentMore
                            content={item?.message}
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

    return Jot
}