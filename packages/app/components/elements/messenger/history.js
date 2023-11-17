import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useRef, useContext, useEffect, useState, useCallback, memo, Clipboard } from 'react';
import { PageData, MenuData } from "./context/messenger-сontext";
import { Text } from 'app/design/typography';
import Loading from "app/ui/atoms/loading";
import {MsgFeed} from 'app/components/units/convos-feeds';
import UniList from 'app/ui/atoms/unilist';
import ReactionContext from "app/context/actions";
import useHistory, { HistoryKeys, useHistoryMessageAction } from "./hooks/useHistory";
import { ConvoKeys, addConvoItem } from "./hooks/useConvos";
import { useQueryClient } from '@tanstack/react-query';
import Services from "./services/history";
import ConvoServices from "./services/convos";
import { getSkeleton } from 'app/lib/skeleton-helpers';
import CreateConvo from './create-convo';
import { isPhone } from "./grid-utils";
import Profile from "app/ui/molecules/profile";
import {SendForm} from "./send-form";

const ConvoHeader = memo(({ title, onPress, profile }) => {
    let sTitle = title;

    if (profile)
        sTitle = profile.display_name;

    return <View className="flex flex-0 w-full px-3.5 py-2 flex-row h-14 relative border-b border-bdrnavbar dark:border-bdrnavbar-d" >
             <View className="md:hidden">
                 <Button variant="outline" startDecorator="ArrowLeft" rounded align="start" onPress={onPress} />
             </View>
             <View className={ "w-full flex-1 flex items-center " + (profile ? "justify-normal flex-row" : "justify-center") } title={ sTitle }>
                 { profile && <Profile {...profile} displayType="unit_wo_info" displaySize="base"/> }
                 <Text className="px-2 text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-50 capitalize" numberOfLines={1}>
                     { sTitle }
                 </Text>
             </View>
           </View>;
});

export function HistoryComponent(){
    const { convoInfo: { item }, setPanel, pageHeight, setConvoItem, historyArea, setHistoryArea, screenMode, setConvoId } = useContext(PageData),
          { menuItem } = useContext(MenuData),
          { action: historyAction, profile: actionProfile } = historyArea || {},
          { title, id } = item || {},
           client = useQueryClient(),
           handlerClickBackButton = useCallback(() => setPanel(false), []),
           handlerCloseArea = useCallback(() => {
               if (isPhone(screenMode))
                   setPanel(false);

               setHistoryArea(false);
           }, [screenMode]),
           handlerSaveList = useCallback((aList) => {
               ConvoServices.getCreateConvo(aList.map((oItem) => oItem.id)).then((data) => {
                   const { code, message, lot, convo } = data;
                   if (+code)
                       console.log(message);
                   else if (lot) {
                       const fUpdate = () => {
                           setConvoId(lot);
                           setHistoryArea(false);
                           setConvoItem({ item: convo, manually: true });
                       };

                        client.setQueryData(ConvoKeys.convoByMenu(menuItem), (data) => {
                                    const pages = [...data.pages];
                                          pages[0] = [convo, ...data.pages[0]];
                                    return { ...data, pages };
                        });
                        fUpdate();
                        client.invalidateQueries({ queryKey: HistoryKeys.messagesByConvo(lot) });
                   }
               });

           }, [menuItem, item, client]),
           handlerUpdateSelectedConvo = useCallback(() => {
                   const { pages } = client.getQueryData(ConvoKeys.convoByMenu(menuItem));
                        pages?.flatMap(page => page).some((oItem) => {
                        if (oItem.id === item.id) {
                            setConvoItem((prev) => ({ item: oItem, manually: prev.manually }));
                            return true;
                        }
                    });
             }, [menuItem, item, client]),
            handlerSendForm = useCallback(() => {
                const { pages } = client.getQueryData(ConvoKeys.convoByMenu(menuItem)),
                    convosList = pages.flatMap(page => page);

                convosList.some((oItem) => {
                    if (oItem.id === item.id) {
                        setConvoItem((prev) => ({ item: oItem, manually: prev.manually }));
                        return true;
                    }
                });
            }, [menuItem, item]);

    return <View className="w-full h-full flex flex-col">
             <ConvoHeader title={title} onPress={handlerClickBackButton} profile={ actionProfile }/>
             <View className="px-3 max-h-full flex w-full h-full flex-col flex-1">
                 { !historyArea && <History convo={item} menuItem={menuItem} height={pageHeight} onHistoryUpdate={handlerUpdateSelectedConvo} />}
                 { historyAction === 'create-convo' && !actionProfile &&
                    <CreateConvo onClose={ handlerCloseArea } viewButtons={ isPhone(screenMode) } onSave={ handlerSaveList }/> }
             </View>
             <View className="w-full pt-2 flex-0 border-t border-bdr dark:border-bdr-d" >
                 { id && <SendForm convoId={ historyAction !== 'create-convo' ? id : 0 }
                   iSelectedProfile={ actionProfile && actionProfile.id }
                   menuItem={ menuItem }
                   onSubmit={ handlerUpdateSelectedConvo }/> }
             </View>
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

        [firstItemIndex, setFirstItemIndex] = useState({ index: 0, id: convoId }),
        [topReached, setTopReached] = useState(false),

        handleTopReached = useCallback(() => {
            if (!isFetchingPreviousPage && hasPreviousPage)
                fetchPreviousPage();

        }, [isFetchingPreviousPage, hasPreviousPage, fetchPreviousPage]),
        /*handleTopPositionReached = useCallback(() => {
            const newReachedPos = topReached && false;
            setTopReached(newReachedPos);
            console.log('--------- top reached execute ---------', messages.length, newReachedPos);
        }, [messages?.length]),*/
        handlerMenuSelect = useCallback(async ({ name }, item) => {
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

    useEffect(() => {
        const { current } = refList;
        if (messages && current && typeof current.scrollToEnd === 'function') {
            setTimeout(() => {
                refList.current.scrollToEnd();
            }, 100);
        }
    }, [messages]);

    useEffect(() => {
        if (topReached) {
            handleTopReached();
            setTimeout(() => {
                refList.current.scrollToIndex({ index: messages.length - iPerPage, animated: true });
            }, 500);
        }
    }, [topReached]);


    const renderItem = ({ item, index }) => <MsgFeed key={ item.id } item={item} handlerMenuSelect={handlerMenuSelect}/>,
        keyExtractor = (item) => item.id;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    if (isLoading || firstItemIndex.id !== convoId)
        return getSkeleton('notifications');

    return <View className="w-full h-full flex-1">
                <ReactionContext>
                    <UniList
                        firstItemIndex={ +firstItemIndex.index }
                        initialTopMostItemIndex={ messages.length - 1 }
                        initialScrollIndex={ messages.length - 1 }
                        /* listState={ `convo-history-${convoId}` }*/
                        refer={ refList }
                        data={ messages }
                        renderItem={ renderItem }
                        startReached={ handleTopReached }
                        onScroll={({ nativeEvent }) => {
                            const { contentOffset } = nativeEvent;
                            if (contentOffset) {
                                const { y } = contentOffset;
                                if (y <= 0)
                                    setTopReached(true);
                            }
                        }}
                        /*maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                        }}*/
                        overscan = { 400 }
                        height = { height }
                        totalCount = { messages.length }
                        followOutput={"smooth"}
                        ListHeaderComponent={ isFetchingPreviousPage && <View><Loading/></View> }
                        ListFooterComponent={ <View className="pb-4"></View> }
                        /*contentContainerStyle={{ paddingBottom: 20 }}*/
                        defaultItemHeight={ 100 }
                       /* estimatedItemSize={ 100 }*/
                        /*keyExtractor={ keyExtractor }*/
                        /*showsVerticalScrollIndicator={false}*/
                    />
                </ReactionContext>
           </View>
});
