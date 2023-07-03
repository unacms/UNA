import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import React, { useState, useContext, memo, useEffect} from 'react';
import MessengerContext from "./messenger-сontext";
import { Text } from 'app/design/typography';
import { fetcher } from "../../../lib/fetcher";
import { useInfiniteQuery } from  '@tanstack/react-query';
import Loading from "../../../ui/atoms/loading";
import UniList from 'app/ui/atoms/unilist';
import { MsgFeed } from 'app/components/units/convos-feeds';

export default function ElementHistory({ convo, pressBack }) {
    const  { title, id } = convo;
        //[messages, AddMessages] = useState([]);

    const { menuItem, height } = useContext(MessengerContext),
        sUrl = '/api.php?r=bx_messenger/get_convo_messages_json/&params=';

    const fetchData = async({ pageParam = 0 }) => {
        const { data } =  await fetcher(sUrl + JSON.stringify({ lot:id }));

        console.log('---- log -- get messages ---', data);

        return data && data.jots || [];
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
            //console.log('---- log get next Params -----', lastPage, allPages);

            if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                return false;

            return lastPage.length * allPages.length;
        }
    });

    const handleEndReached = () => {
        //console.log('---- log reach ends ----', isFetchingNextPage, data);
        if (!isFetchingNextPage && hasNextPage) {
            //console.log('---- log get the next page  ----');
            fetchNextPage();
        }
    }

    if (isLoading)
        return <View className='m-2'><Loading/></View>;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    const renderItem = ({ item }) => <MsgFeed key={ item.id } item={item} />,
        keyExtractor = (item) => item.id;

    const messages = data.pages.flatMap(page => page);

    return id && <View className="h-full">
                    <View className="flex w-full p-2 flex-row h-[60px] relative border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" >
                        <View className="md:hidden">
                            <Button variant="outline" startDecorator="CaretLeft" rounded align="start" onPress={pressBack} />
                        </View>
                        <View className="w-full flex-1 flex items-center justify-center">
                           <Text className="truncate text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 capitalize flex items-center">{title}</Text>
                        </View>
                    </View>
                    <View className="lg:p-4 xl:p-4">
                        <UniList
                            data={messages}
                            renderItem={renderItem}
                            onEndReachedThreshold={ 0.8 }
                           // onEndReached = { handleEndReached }
                            keyExtractor={ keyExtractor }
                            height={ height - 48 }
                            ListFooterComponent={
                                hasNextPage && isFetchingNextPage && <View className='m-2'><Loading/></View>
                            }
                        />
                    </View>
            </View>
}