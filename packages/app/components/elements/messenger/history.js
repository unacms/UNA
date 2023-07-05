import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import React, { useRef, useContext, useEffect} from 'react';
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

    const refList = useRef();

    /*const scrollToLastFruit = () => {
        const lastChildElement = refList.current?.lastElementChild;
        lastChildElement?.scrollIntoView({ behavior: 'smooth' });
    };

        */

    const { menuItem, height } = useContext(MessengerContext),
        sUrl = '/api.php?r=bx_messenger/get_convo_messages_json/&params=';

    useEffect(() => {
        const { scrollToIndex } = refList.current || {};
        //console.log('----- use effect ----', refList);
        if (typeof scrollToIndex === 'function') {
            //console.log('----- scroll on the effect  ----', refList.current, height);
            refList.current.scrollToIndex({ index: height });
            //autoscrollToBottom(true);
        }

    }, [id]);

    const fetchData = async({ pageParam = 0 }) => {
        const { data } =  await fetcher(sUrl + JSON.stringify({ lot:id }));

        //console.log('---- log -- get messages ---', data);

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

    //console.log('------ history element ----', refList);

    return id && <View className="max-h-full flex w-full h-full flex-col relative">
                    <View className="flex w-full px-3.5 py-2 flex-row h-14 relative border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" >
                        <View className="md:hidden">
                            <Button variant="outline" startDecorator="ArrowLeft" rounded align="start" onPress={pressBack} />
                        </View>
                        <View className="w-full flex-1 flex items-center justify-center" title={ title }>
                           <Text className="px-2 text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize" numberOfLines={1}>
                               { title }
                           </Text>
                        </View>
                    </View>
                    <View className="mb-24 px-3 max-h-full flex w-full h-full flex-col relative">
                        <UniList
                            refer={refList}
                            data={messages}
                            renderItem={renderItem}
                           // onEndReachedThreshold={ -1 }
                           // onEndReached = { handleEndReached }
                            keyExtractor={ keyExtractor }
                            height={ height - 48 }
                            estimatedItemSize={100}
                            ListHeaderComponent={
                               hasNextPage && isFetchingNextPage && <View className='m-2'><Loading/></View>
                            }
                        />
                    </View>
            </View>
}