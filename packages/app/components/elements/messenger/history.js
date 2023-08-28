import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useRef, useContext, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { PageData, MenuData } from "./context/messenger-сontext";
import { Text } from 'app/design/typography';
import Loading from "../../../ui/atoms/loading";
import {ListFeed, MsgFeed} from 'app/components/units/convos-feeds';
import Form from "../form";
import UniList from 'app/ui/atoms/unilist';
import ReactionContext from "../../../context/actions";
import useHistory, { useSendData, useHistoryMessageAction } from "./hooks/useHistory";
import { ConvoKeys } from "./hooks/useConvos";
import { useQueryClient } from '@tanstack/react-query';
import Services from "./services/history";
import { getSkeleton } from 'app/lib/skeleton-helpers';

const SendForm = memo(({ convoId, menuItem, onSubmit }) => {
    const [formData, setFormData] = useState();
    const { sendMessage } = useSendData(convoId, menuItem);

    useEffect(() => {
        (async() => {
            await Services.getForm().catch((e) => { console.log(e.toString()) }).then((data) => {
                setFormData(data);
            });
        })();
    }, []);

    return formData && <View className={"flex-0 relative max-h-auto pt-2 bg-backgroundcard dark:bg-backgroundcard-dark border-t border-bordercolorcard dark:border-bordercolorcard-dark w-full "} >
        <Form data={ formData } name={'bx_messenger'} classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between" onFormSubmit={ (oFormData) => sendMessage(oFormData , { onSuccess: ( data )=> onSubmit(data)}) } />
    </View>
});

const ConvoHeader = memo(({ title, onPress }) => {
    return <View className="flex flex-0 w-full px-3.5 py-2 flex-row h-14 relative border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" >
             <View className="md:hidden">
                 <Button variant="outline" startDecorator="ArrowLeft" rounded align="start" onPress={onPress} />
             </View>
             <View className="w-full flex-1 flex items-center justify-center" title={ title }>
                 <Text className="px-2 text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize" numberOfLines={1}>
                     { title }
                 </Text>
             </View>
           </View>;
});

export function HistoryComponent(){
    const { convoInfo: { item }, setPanel, pageHeight, setConvoItem } = useContext(PageData),
          { menuItem } = useContext(MenuData),
          { title, id } = item || {},
           client = useQueryClient(),
           handlerClickBackButton = useCallback(() => setPanel(false), []),
           handlerUpdateSelectedConvo = useCallback(() => {
                   const { pages } = client.getQueryData(ConvoKeys.convoByMenu(menuItem));

                        pages?.flatMap(page => page).some((oItem) => {
                        if (+oItem.id === +item.id) {
                            setConvoItem((prev) => ({ item: oItem, manually: prev.manually }));
                            return true;
                        }
                    });
             }, [menuItem, item]),
            handlerSendForm = useCallback(() => {
                const { pages } = client.getQueryData(ConvoKeys.convoByMenu(menuItem)),
                    convosList = pages.flatMap(page => page);

                convosList.some((oItem) => {
                    if (+oItem.id === +item.id) {
                        setConvoItem((prev) => ({ item: oItem, manually: prev.manually }));
                        return true;
                    }
                });
            }, [menuItem, item]);

    return <View className="h-full">
            <ConvoHeader title={title} onPress={handlerClickBackButton}/>
              <View className="px-3 max-h-full flex w-full h-full flex-col relative flex-1">
                <History convo={item} menuItem={menuItem} height={pageHeight} onHistoryUpdate={handlerUpdateSelectedConvo} />
              </View>
            { id && <SendForm convoId={id} menuItem={menuItem} onSubmit={handlerUpdateSelectedConvo}/>}
           </View>
}

const History = memo(({ convo, height, menuItem, onHistoryUpdate }) => {
    const { id: convoId, total_messages: total } = convo || {},
          { isLoading, error, isFetchingPreviousPage, fetchPreviousPage, data: messages, hasPreviousPage } =  useHistory(convoId, (data) => {
              setFirstItemIndex({ index: getIndex(data), id: convoId });
          }),
          { iPerPage } = Services,
          { executeAction } = useHistoryMessageAction(convoId, menuItem),
          refList = useRef(null),
          getIndex = useCallback((messages) => {
              let iIndex = total > iPerPage ? total - iPerPage: 0;
              if (messages?.length > iPerPage)
                  iIndex = total - messages.length;

              return iIndex;
          }, [total]),
         [firstItemIndex, setFirstItemIndex] = useState({ index: 0, id: convoId });

    const handleTopReached = useCallback(() => {
        if (!isFetchingPreviousPage && hasPreviousPage)
            fetchPreviousPage();

    }, [isFetchingPreviousPage, hasPreviousPage, fetchPreviousPage]);

    const handlerMenuSelect = useCallback(async ({ name }, item) => {
        const { id: messageId, lot_id: convoId } = item;

        switch(name) {
            case 'edit':
            case 'remove':
            case 'save':
               await executeAction({ action: name, messageId }, { onSuccess: ( data ) => {
                   if (data?.code === 0) {
                       onHistoryUpdate();
                   }
                }});
            case 'share':
        }

    }, [messages, refList.current]);


    const renderItem = ({ item, index }) => <MsgFeed key={ item.id } item={item} handlerMenuSelect={handlerMenuSelect}/>,
        keyExtractor = (item) => item.id;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    if (isLoading || !messages.length || firstItemIndex.id !== convoId)
        return getSkeleton('feed');

    return <View className="w-full h-full flex-1">
                <ReactionContext>
                    <UniList
                        firstItemIndex={ +firstItemIndex.index }
                        initialTopMostItemIndex={ messages.length - 1 }
                        /* listState={ `convo-history-${convoId}` }*/
                        refer={ refList }
                        /*style={{ marginBottom: 20 }}*/
                        data={ messages }
                        renderItem={ renderItem }
                        startReached={ handleTopReached }
                       /* maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                        }}*/
                        overscan={ 400 }
                        height={ height }
                        totalCount={ messages.length }
                        followOutput={"smooth"}
                        ListHeaderComponent={ isFetchingPreviousPage && <View><Loading/></View> }
                        /*contentContainerStyle={{ paddingBottom: 20 }}*/
                        defaultItemHeight={ 100 }
                       /* estimatedItemSize={ 100 }*/
                       /* keyExtractor={ keyExtractor }*/
                        /*showsVerticalScrollIndicator={false}*/
                    />
                </ReactionContext>
           </View>
});

/*const HistoryList = memo(({ startIndex, messages, height, handleTopReached, handlerMenuSelect }) => {
    const [update, setUpdate] = useState(false);

    const refList = useRef();
    const renderItem = ({ item, index }) => <MsgFeed key={ item.id } item={item} handlerMenuSelect={handlerMenuSelect}/>;

    return  <ReactionContext>
                <UniList
                    firstItemIndex={ +startIndex }
                    initialTopMostItemIndex={ messages.length - 1 }
                    /!* listState={ `convo-history-${convoId}` }*!/
                    refer={ refList }
                    style={{ marginBottom: 20 }}
                    data={ messages }
                    renderItem={ renderItem }
                    startReached={ handleTopReached }
                    maintainVisibleContentPosition={{
                        minIndexForVisible: 0,
                    }}
                    overscan={ 400 }
                    /!* rangeChanged={{
                         startIndex: firstItemIndex.index,
                         endIndex: messages.length - 1,
                     }}*!/
                    height={ height }
                    totalCount={ messages.length }
                    followOutput={"smooth"}
                    ListHeaderComponent={ () =>
                        isFetchingPreviousPage && <View className='m-2 absolute w-full bg-backgroundcard dark:bg-backgroundcard-dark'><Loading/></View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    defaultItemHeight={100}
                    estimatedItemSize={100}
                    /!*showsVerticalScrollIndicator={false}*!/
                />
            </ReactionContext>
}, (prev, next) => {
    return prev.startIndex === next.startIndex && prev.messages.length === next.messages.length && prev.handleTopReached === next.handleTopReached;
});*/
