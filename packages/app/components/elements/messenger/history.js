import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import React, { useRef, useContext, useEffect, useState, useCallback } from 'react';
import MessengerContext from "./messenger-сontext";
import { Text } from 'app/design/typography';
import { fetcher } from "../../../lib/fetcher";
import { useInfiniteQuery, useMutation, useQueryClient } from  '@tanstack/react-query';
import Loading from "../../../ui/atoms/loading";
import { MsgFeed } from 'app/components/units/convos-feeds';
import Form from "../form";
import UniList from 'app/ui/atoms/unilist';
import ReactionContext from "../../../context/actions";

export default function ElementHistory({ convo, pressBack, height, menuItem }) {
    const sUrl = '/api.php?r=bx_messenger/get_convo_messages_json/&params=',
          sFormUrl = '/api.php?r=bx_messenger/get_convo_send_form_json/&params=',
          iPerPage = 20;

    const  { title, id, total_messages } = convo || {},
           [formData, setFormData] = useState(),
           [page, setPage] = useState(0),
           [firstItemIndex, setFirstItemIndex] = useState(total_messages || 0),
           [initScrollPos, setInitScrollPos] = useState(0),
           [firstRender, setFirstRender] = useState(false),
           [iScrollPos, updateScrollPos] = useState(0),
           [firstItem, setFirstItem] = useState(0),
           [users, setUsers] = useState([]),
           getInitScrollPos = useCallback(() => total_messages < iPerPage ? total_messages - 1  : iPerPage - 1, [total_messages]);


    const refList = useRef();

    useEffect(() => {
       fetchFormData();
       refList?.current?.scrollToIndex({
            index: getInitScrollPos(),
            behavior: "smooth"
       });

    }, [id]);


    const updateCache = useCallback(() => {
        client.invalidateQueries({ queryKey: ['get_convo_messages_json', id]});
        client.invalidateQueries({ queryKey: ['get_convos_list_json', menuItem]});
    }, [id, menuItem]);

    const handleMenuSelect = async ({ name }, jot_id) => {
        const { data, status } = await fetcher(`/api.php?r=bx_messenger/${name}_convo/&params=` + JSON.stringify({ jot_id }));
        if (typeof data?.code === 'undefined' || +data?.code) {
            console.log(`Actions ${name} was not found`, data?.code, status);
            return;
        }

        switch(name) {
            case 'edit':
                break;
            case 'remove':
                    updateCache();
                break;
            case 'save':
                    console.log('Message ', jot_id, ' has been saved.');
                break;
        }
    };

    const fetchFormData = async(sAction = 'add') => {
        const { data } =  await fetcher(sFormUrl + JSON.stringify({ id }));
        setFormData(data);
    };

    const fetchData = async({ pageParam = 0 }) => {
        const { data } =  await fetcher(sUrl + JSON.stringify({ lot:id, jot: pageParam }));

        if (!data)
            return false;

        const { jots } = data;

        if (typeof jots === 'undefined')
            return [];

        if (!pageParam)
            setFirstItem(jots[0]);
        else
            setFirstItem(jots[jots.length - 1]);

       return jots;
    };

    const {
        data,
        error,
        fetchNextPage,
        fetchPreviousPage,
        hasPreviousPage,
        hasNextPage,
        isFetchingNextPage,
        isFetchingPreviousPage,
        isLoading
    } = useInfiniteQuery(['get_convo_messages_json', id], fetchData, {
        keepPreviousData: true,
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        getPreviousPageParam: (firstPage, allPages) => {
            if (!firstPage || !firstPage.length || allPages[0].length !== firstPage.length)
                return false;

            return firstPage[0].id;
        },
        getPevPageParam: (lastPage, allPages) => {
            if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                return false;

            return lastPage[lastPage.length-1].id;
        }
    });

   /* useEffect(() => {
        setFirstItemIndex(total_messages);

        refList?.current?.scrollToIndex({
            index: getInitScrollPos(),
            behavior: "smooth"
        });

    }, [total_messages]);*/

    const handleEndReached = () => {
        if (!isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }

    const handleTopReached = () => {
        if (!isFetchingPreviousPage && hasPreviousPage) {
            fetchPreviousPage();
            setFirstItemIndex((prev) => { return prev < iPerPage ? iPerPage : prev - iPerPage });
        }
    }

    const client = useQueryClient();
    const { mutate: sendMessage } = useMutation({
        mutationFn: async(formData) => await fetcher([sFormUrl + JSON.stringify({ id })/*sSendFormUrl + JSON.stringify({ convo: id })*/, '' , formData]),
        onSuccess: (oData) => {
            /*client.setQueriesData(['get_convo_messages_json', id], (prevData) => {
                const { pages, pageParams } = prevData,
                      newData = Object.assign({}, prevData);

                console.log('----- new data -----', newData);

                if (pages[pages.length - 1].length === iPerPage) {
                    newData.pages.push(oData);
                    newData.pageParams.push(pages[pages.length - 1][iPerPage - 1].id);
                }

                console.log('----- prev data -----', prevData, newData);
                return prevData;
            });*/

            updateCache();

            refList.current.scrollToIndex({
                index: messages.length - 1,
                behavior: "smooth"
            });
        }
    });

    if (isLoading)
        return <View className='m-2'><Loading/></View>;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    const messages = data?.pages?.flatMap(page => page);


    const renderItem = ({ item }) => <MsgFeed key={ item?.id } item={item} handleMenuSelect={handleMenuSelect}/>,
          keyExtractor = (item) => {
              return item && item.id;
          };

    return <View className="max-h-full flex w-full h-full flex-col relative">
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
                        {
                            <ReactionContext>
                                <UniList
                                    /*firstItemIndex={firstItemIndex}*/
                                    initialTopMostItemIndex={ messages.length - 1 }
                                    refer={refList}
                                    /*style={{paddingBottom: 20}}*/
                                    data={messages}
                                    renderItem={({item, index}) => renderItem({item, index})}
                                    startReached={handleTopReached}
                                    /*maintainVisibleContentPosition={{
                                        minIndexForVisible: 0,
                                    }}*/
                                    keyExtractor={keyExtractor}
                                    height={height}
                                    /*contentContainerStyle={{ paddingBottom: 20 }}*/
                                    /*showsVerticalScrollIndicator={false}*/
                                    /* defaultItemHeight={100}*/
                                    /*estimatedItemSize={150}*/
                                    /*extraData={id}*/
                                    ListHeaderComponent={() => {
                                        if (hasPreviousPage && isFetchingPreviousPage)
                                            return <View className='m-2'><Loading/></View>;
                                        /* else
                                           return data?.pageParams?.length > 1 && data?.pages[0].flatMap(page => page).map((item) => renderItem({item : item }));
                                        }*/
                                    }
                                    }
                                />
                            </ReactionContext>
                        }
                          </View>
                            {/*<KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >*/}
                                        <View onLayout={ () => {} } className={"flex-0 relative max-h-auto pt-2 bg-backgroundcard dark:bg-backgroundcard-dark border-t border-bordercolorcard dark:border-bordercolorcard-dark w-full "} >
                                                        { formData && <Form data={ formData } name={'bx_messenger'} classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                                                            onFormSubmit={ async (formData) => {
                                                                                /*const iTime = (new Date()).getTime()/1000;
                                                                                const sData = renderItem({ item: { message:  formData.get('message'), created:  iTime} });
                                                                                messages.push({ id:iTime, message:  formData.get('message'), created: (new Date()).getTime(), author_data: currentUser });
                                                                                console.log('--- data ------', formData, messages);*/
                                                                                sendMessage(formData);
                                                                            }} />
                                                        }
                                        </View>
                            {/*</KeyboardAvoidingView>*/}
    </View>
}
