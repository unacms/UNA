import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from "next/dynamic";
import {useCurrentUser} from "app/context/user";
import {FeedbackHaptics, linkify} from "app/lib/util";
import Html from "app/ui/atoms/html";
import {Button} from "app/design/controls";
import { HistoryServices as Services } from "app/components/elements/messenger/services";
import DropdownMenu from "app/ui/atoms/dropdown-menu";
import Reactions from 'app/ui/molecules/reactions';
import Form from "../elements/form";
import { useSendData, updateHistoryPageCache } from "../elements/messenger/hooks/useHistory";

const ListFeed = memo((data)  => {
  const { author_data, message, date, title, count, onPress, isActive } = data || {};

  return <Pressable onPress={(e) => onPress(e, data)} className={ isActive ? ' bg-neutral-500/10' : '' }>
            <View className="flex-row p-2 sm:px-3 groupweb:duration-200 overflow-hidden m-1 sm:mx-2 rounded-lg hover:bg-neutral-500/10 active:opacity-50 active:translate-y-0.5">

            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
            <Profile
              { ...author_data }
              displayType="unit_wo_info"
              displaySize="lg"
            />
         </View>
        <View className="flex-auto flex-col my-auto ">
          <View className="flex-row gap-2">
            <Text
                className="flex-auto text-lg font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                numberOfLines={1}
            > { title } </Text>
            <Time stylesName="text-neutral-600 dark:text-neutral-400 text-xs whitespace-nowrap truncate min-w-[3rem] text-right" ts={ date }></Time>
          </View>
          <View className="flex-row w-full items-end content-end">
            <Text
              className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
              numberOfLines={1}
            >
              { message }
            </Text>
            <View className="flex-none bg-primary dark:bg-primary-d rounded-full my-auto h-min px-1.5">
              { count > 0 && (
                <Text className="text-xs text-white dark:text-black font-medium">
                  { count }
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
});

function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = memo(dynamic(() => import('app/ui/molecules/carousel')));
        return  <Carousel data={aImg}/>
    }, [b]);


    return computedData;
}

const ImagesComponent = ({files}) => {
    if (!files || !files.length)
        return;

    const aImg = files?.map(({src}) => ({ src, type: 'image' }));

    return <View className='w-full aspect-auto pb-6 pt-4'>
                <CarouselMemo aImg={aImg} b={files}/>
           </View>
}

const MsgFeed = memo(({ item, handlerMenuSelect }) => {
    const { currentUser } = useCurrentUser(),
         { author_data, created, count, files, message, menu, id, reactions } = item,
         sCommentClass = "bg-neutral-500/10 rounded-tl-none rounded-2xl px-4 u-vanilla-html-small",
         { sendMessage } = useSendData();

    const [mode, setMode] = useState(''),
          [formData, setFormData] = useState();

    const handlerClearGhost = useCallback((id) => Services.clearGhost({ id }), []);

    if (!created)
        return (<View></View>);

    useEffect(() => {
        if (mode === 'edit')
            (async() => await Services.getForm({ action: mode, id })
                .catch((e) => { console.log(e.toString()) })
                .then((data) => setFormData(data)))
            ();

    }, [mode]);

    return (
        <View className='w-full pt-3'>
            <View className="flex-row-reverse ">
                <View className='flex-1 flex-col gap-y-4 -translate-x-2 translate-y-1 '>
                    <View className={sCommentClass + ' py-2'} >
                        <View className="flex-row flex-1 items-center pb-0.5">
                            <Profile {...author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <Text className="text-neutral-400 dark:text-neutral-600 px-[4px]">·</Text>
                            <Time className="" ts={created}></Time>
                            {
                                mode === 'edit' && <View className="absolute right-0">
                                                                    <Button
                                                                    title="Cancel"
                                                                    size="xs"
                                                                    startDecorator="X"
                                                                    variant="outline"
                                                                    onPress={() => {
                                                                        setMode('');
                                                                        handlerClearGhost(id);
                                                                        //updateHistoryPageCache();
                                                                    }}
                                                                />
                                                </View>
                            }
                        </View>
                        <View>
                           { mode === 'edit' && formData ? (
                                <View className="w-full py-2">
                                    <Form data={ formData } name={'bx_messenger'} resetOnSubmit={true}
                                          classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                          onFormSubmit={ (oFormData, oData) => { return sendMessage({ oFormData, oData }, {
                                                  onSuccess: ({ code }) => {
                                                     if (!+code) {
                                                         setMode('');
                                                     }
                                                  }
                                          })} } />
                                </View>
                            ) : <Html data={linkify(message)} className="" /> }
                        </View>
                        { mode !== 'edit' && <ImagesComponent files={files}/>}
                    </View>
                    <View className="flex-row w-full justify-between items-center">
                        { !!currentUser ? <View className='mr-2'>
                                                <Reactions {...{
                                                    counter: { items: reactions },
                                                    params: {
                                                        show_combined: true,
                                                        show_counter: true,
                                                        show_action: true,
                                                        show_counter_style: 'compound',
                                                    },
                                                    type: 'icon',
                                                    system: 'bx_messenger_jot',
                                                    object_id: id,
                                                    action: { reaction: 'default' }
                                                }} />
                                          </View> : <></> }
                        { !!currentUser && menu && menu.length && <View className='flex-row'>
                            <View className="ml-2">
                                <DropdownMenu items={menu.map((aItem) => {
                                    return {
                                        id: aItem.id ? aItem.id : aItem.name,
                                        name: aItem.name,
                                        link: aItem.link,
                                        title: aItem.title
                                    };
                                })} onSelect={(oItem) => {
                                    setMode(oItem.name);
                                    return handlerMenuSelect(oItem, item);
                                }}>
                                    <Button variant="outline" size="xs" startDecorator="Ellipsis" rounded />
                                </DropdownMenu>
                            </View>
                        </View> }
                    </View>
                </View>
                <View className="bg-neutral-50 dark:bg-neutral-900 rounded-full mb-auto p-0.5">
                    <Profile {...author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                </View>
            </View>
        </View>
    );
});


export { MsgFeed, ListFeed };