import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useMemo, useCallback, memo } from 'react';
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import { Button } from 'app/design/controls'
import Form from 'app/components/elements/form';
//import use-SWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Reactions from 'app/ui/molecules/reactions';
import { useTranslation } from 'react-i18next';
import { FeedbackHaptics } from 'app/lib/util';
import { linkedText } from 'app/lib/text-helpers';
import { Platform } from 'react-native'
import Carousel from 'app/ui/molecules/carousel'
import { Modal } from 'app/design/controls'
import emitter from 'app/context/emitter';
import { TouchableWithoutFeedback } from 'react-native';

export default function JotItem({ item, index, handleReply }) {
    const isWeb = Platform.OS == 'web'
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

    const { data: dynamicData, error } = useFetchForm('/api.php?r=bx_messenger/get_send_form/Services&params[]=', postData);

    let aImg = useMemo(() => item?.files.map((obj) => {
        return {
            src: obj.src,
            width: obj.width,
            height: obj.height,
            type: 'image',
        }
    }), [item]);

    const onFormSubmit = useCallback((formData, d) => {
        formData.set("id", item.lot_id);
        setViewState({ view: '' })
        setPostData(formData);
    }, []);

    const aManageMenu = useMemo(() => item.menu?.items.filter(item => ['remove', 'edit'].includes(item.name)), [item]);

    const handleReplyInner = useCallback(async (item) => {
        FeedbackHaptics('Medium');
        emitter.emit('editor', { action: 'focus' })
        handleReply(item);
    }, [handleReply]);

    const reactionsWithUpdatedParams = {
        ...item.reactions,
        params: { ...item.reactions.params, button_size: "xs", button_variant: "link" }
    };

    const Jot = <TouchableWithoutFeedback  onPress={() => {emitter.emit('editor', { action: 'blur' })}}><View className='w-full py-3 px-3'>
        <Row className="gap-2">
            <View className=" flex-0">
                <Profile {...item.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
            </View>
            <View className='flex-auto'>
                <View className='bg-bgritem dark:bg-bgritem-d rounded-xl px-3 u-vanilla-html-small' >
                    <Row className="items-center justify-between gap-1 mb-0.5 pt-2">
                        <Profile 
                            {...item.author_data} 
                             displayType="unit_wo_image"
                        />
                      
                        <Time ts={item.created}></Time>
                    </Row>
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
                        {item.reply > 0 && <View className='   border border-bdr dark:border-bdr-d  rounded-md p-2 my-1  bg-neutral-500/20'>
                            <Text className="text-xs text-neutral-800 dark:text-neutral-200 font-default">{linkedText(item?.reply_message, "hover:text-linkhover")}</Text>
                        </View>}
                        <Text className=" text-base text-neutral-800 dark:text-neutral-200 font-default">{linkedText(item?.message, "hover:text-linkhover")}</Text>
                        {aImg.length > 0 && <Carousel data={aImg} />}
                    </View>}
                </View>
            </View>
        </Row>
        <View className="flex-row justify-between items-center ml-2 mt-0.5">
            <View className="pl-12">
                <Button align="start" title={t("Reply")} size="xs" startDecorator="Reply" variant="link" onPress={() => handleReplyInner(item)} rounded />
            </View>
            <Row className='mr-1'>
                <View className='mr-2 '>
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
                    })} onSelect={handleManageMenuSelect}>
                        <Button variant="text" size="xs" startDecorator="Ellipsis" rounded />
                    </DropdownMenu>
                }
            </Row>
        </View>
    </View></TouchableWithoutFeedback>

    return Jot
}


