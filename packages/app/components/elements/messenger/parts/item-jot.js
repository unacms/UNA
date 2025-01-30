import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useMemo, useCallback, memo } from 'react';
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import { Button } from 'app/design/controls'
import Form from 'app/components/elements/form';
import useSWR from "swr";
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Reactions from 'app/ui/molecules/reactions';
import { useTranslation } from 'react-i18next';
import { FeedbackHaptics } from 'app/lib/util';
import { linkedText } from 'app/lib/text-helpers';
import { Platform } from 'react-native'
import Carousel from 'app/ui/molecules/carousel'
import { Modal } from 'app/design/controls'

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

    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_messenger/get_send_form/Services&params[]=', '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )

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
    },[]);

    const aManageMenu = useMemo(() => item.menu?.items.filter(item => ['remove', 'edit'].includes(item.name)), [item]);

    const handleReplyInner = useCallback(async (item) => {
        FeedbackHaptics('Medium');
        handleReply(item);
    }, [handleReply]);

    const reactionsWithUpdatedParams = {
        ...item.reactions,
        params: { ...item.reactions.params, button_size: "xs", button_variant: "link" }
      };

    const Jot = <View className='w-full py-2'>
        <View className="flex-row gap-x-2 ">
            <View className="w-10 flex-0 ">
                <Profile {...item.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
            </View>
            <View className='flex-1 flex-col gap-y-1  '>
                <View className={'bg-bgritem dark:bg-bgritem-d rounded-xl px-3 u-vanilla-html-small py-2'} >
                    <View className="flex-row flex-1 items-center mb-0.5 overflow-hidden">
                        <Profile {...item.author_data} displayType="unit_text_link"  />
                        <View><Text className="text-neutral-400 dark:text-neutral-600 px-[4px]">·</Text></View>
                        <Time ts={item.created}></Time>
                    </View>

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


                    ) : <>
                        {item.reply > 0 && <View className='   border border-bdr dark:border-bdr-d  rounded-md p-2 my-1  bg-neutral-500/20'>
                            <View className="flex-row items-baseline" >
                                {/* <View><Text className='text-xs text-neutral-800 dark:text-neutral-200 pb-1'>In Reply to </Text></View>*/}
                            </View>
                            <Text className="text-xs text-neutral-800 dark:text-neutral-200 font-default">{linkedText(item?.reply_message, "hover:text-linkhover")}</Text>
                        </View>}
                        <Text className="text-base text-neutral-800 dark:text-neutral-200 font-default">{linkedText(item?.message, "hover:text-linkhover")}</Text>
                        {aImg.length > 0 && <Carousel data={aImg} />}
                    </>}
                </View>
            </View>
        </View>
        <View className="flex-row justify-between items-center ml-2 mt-0.5">
            <View className="pl-10">
                <Button align="start" title={t("Reply")} size="xs" startDecorator="ArrowBendLeftUp" variant="link" onPress={() => handleReplyInner(item)} rounded />
            </View>
            <Row className='mr-1'>
                <View className='mr-2'>
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
                        <Button variant="text" size="xs" startDecorator="DotsThreeOutline"  rounded />
                    </DropdownMenu>
                }
            </Row>
        </View>
    </View>

    //if (!isWeb)
    return Jot
    //<Jot viewState={viewState} item={item} onFormSubmit={onFormSubmit} aManageMenu={aManageMenu} handleManageMenuSelect={handleManageMenuSelect}/>;

    /* return (
         <AnimatedBlock key={'jot' + index}>
             {Jot}
         </AnimatedBlock>
     )*/
}


