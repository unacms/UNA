import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import React, { useRef, useContext, useEffect, useState} from 'react';
import MessengerContext from "./messenger-сontext";
import { Text } from 'app/design/typography';
import { fetcher } from "../../../lib/fetcher";
import { useInfiniteQuery } from  '@tanstack/react-query';
import Loading from "../../../ui/atoms/loading";
import { MsgFeed } from 'app/components/units/convos-feeds';
import Form from "../form";
import {FlashList} from "@shopify/flash-list";

export default function ElementHistory({ convo, pressBack }) {
    const  { title, id } = convo,
           [formData, setFormData] = useState([]);

    const refList = useRef();

    const { height } = useContext(MessengerContext),
        sUrl = '/api.php?r=bx_messenger/get_convo_messages_json/&params=',
        sFormUrl = '/api.php?r=bx_messenger/get_convo_send_form_json/';

    useEffect(() => {
       fetchFormData();
    }, []);

    const fetchFormData = async() => {
        const { data } =  await fetcher(sFormUrl);
        setFormData(data);
    };

    const fetchData = async({ pageParam = 0 }) => {
        const { data } =  await fetcher(sUrl + JSON.stringify({ lot:id, jot: pageParam }));
        return data?.jots || [];
    };

    const {
        status,
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery(['get_convo_messages_json', id], fetchData, {
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                return false;

            return lastPage[0].id;
        }
    });

    const handleEndReached = () => {
        if (!isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }

    if (isLoading)
        return <View className='m-2'><Loading/></View>;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    const renderItem = ({ item }) => <MsgFeed key={ item.id } item={item} />,
          keyExtractor = (item) => item.id;

    const messages = data?.pages.flatMap(page => page);

    return id && <View className="max-h-full flex w-full h-full flex-col relative">
                    <View className="flex flex-0 w-full px-3.5 py-2 flex-row h-14 relative border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" >
                        <View className="md:hidden">
                            <Button variant="outline" startDecorator="ArrowLeft" rounded align="start" onPress={pressBack} />
                        </View>
                        <View className="w-full flex-1 flex items-center justify-center" title={ title }>
                           <Text className="px-2 text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize" numberOfLines={1}>
                               { title }
                           </Text>
                        </View>
                    </View>
                    <View className="px-3 max-h-full flex w-full h-full flex-col relative flex-1">
                        <FlashList
                            ref={refList}
                            data={messages}
                            renderItem={renderItem}
                            onEndReachedThreshold={ 0 }
                            onEndReached = { handleEndReached }
                            onLoad = {(e) => {
                                //console.log('------ log ------', refList.current);
                            }}
                            inverted = {-1}
                            keyExtractor={ keyExtractor }
                            height={ height - 100 }
                            showsVerticalScrollIndicator={false}
                            estimatedItemSize={100}
                            /*ListHeaderComponent={ <View className='m-2'><Loading/></View> }*/
                            ListHeaderComponent={
                               hasNextPage && isFetchingNextPage && <View className='m-2'><Loading/></View>
                            }
                        />
                    </View>
                    <View onLayout={ () => {} } className={" flex-0 relative max-h-auto pt-2 bg-backgroundcard dark:bg-backgroundcard-dark border-t border-bordercolorcard dark:border-bordercolorcard-dark w-full "} >
                        <Form data={formData} name={'bx_messenger'} classContainerName="flex-row flex-wrap px-2 w-full  items-start justify-between" onFormSubmit={() => {}} />
                    </View>
    </View>
}
