import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic'
import { linkify } from 'app/lib/util'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import Profile from 'app/ui/molecules/profile'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html';
import { Button } from 'app/design/controls'
import Form from 'app/components/elements/form';
import useSWR from "swr";
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Reactions from 'app/ui/molecules/reactions';

export default function JotItem({ item, index }) {
    const [postData, setPostData] = useState(null)
    const [viewState, setViewState] = useState({ view: '' })
    const handleManageMenuSelect = async (oItem, event) => {

        switch (oItem.name) {
            case 'edit':
                const result = await fetcher('/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ 'action': 'edit', id: item.id }));
                setViewState({ view: 'edited', data: result });
                break;

            case 'remove':
                const result1 = await fetcher('/api.php?r=bx_messenger/remove_jot/Services&params=' + JSON.stringify({ jot_id: item.id, lot_id: item.lot_id }));
                break;
        }
    }

    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_messenger/get_send_form/Services&params[]=', '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    let aImg = item?.files.map((obj) => {
        return {
            src: obj.src,
            type: 'image',
        }
    });

    const onFormSubmit = (formData, d) => {
        formData.set("id", item.lot_id);
        setViewState({ view: '' })
        setPostData(formData);
    }

    let aManageMenu = [];
    if(item.menu?.items) 
        aManageMenu = item.menu.items.filter(item => ['remove', 'edit'].includes(item.name));

    return (
        <AnimatedBlock key={'jot' + index}>
            <View className='w-full mb-4'>
                <View className="flex-row gap-x-2 ">
                    <View className="w-10 flex-0 ">
                        <Profile {...item.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                    </View>
                    <View className='flex-1 flex-col gap-y-1 mb-2 '>
                        <View className={'bg-neutral-500/10 border border-neutral-500/10 rounded-lg px-2.5 u-vanilla-html-small  py-2'} >
                            <View className="flex-row flex-1 items-center mb-0.5 overflow-hidden">
                                <Profile {...item.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                <View><Text className="text-neutral-500 px-1">·{index}</Text></View>
                                <Time ts={item.created}></Time>
                            </View>

                            {viewState.view == 'edited' ? (
                                <View className="w-full">
                                    <Form
                                        name='bx_messenger'
                                        {...viewState.data}
                                        classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                        onFormSubmit={onFormSubmit}
                                    />
                                    <View className="mx-4 mb-4">
                                        <Button
                                            title="Cancel"
                                            fullWidth
                                            size="base"
                                            startDecorator="X"
                                            variant="outline"
                                            onPress={() => setViewState({ view: '' })}
                                        />
                                    </View>
                                </View>
                            ) : <><Html data={linkify(item?.message)} /><CarouselMemo aImg={aImg} /></>}



                        </View>
                    </View>
                </View>
                <View className="flex-row justify-between items-center ml-2">
                    <View className="pl-10">
                        <Reactions key={'reactions_' + item.id} {...item.reactions} />
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
                            <Button variant="outline" size="xs" startDecorator="DotsThreeOutline" onPress={() => { FeedbackHaptics('Medium'); }} rounded />
                        </DropdownMenu>
                    }
                </View>
            </View>


        </AnimatedBlock>
    )
}



function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = React.memo(
            dynamic(() => import('app/ui/molecules/carousel'))
        )
        return <Carousel data={aImg} />
    }, [b])
    return computedData
}
