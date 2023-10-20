import Services from "../services/history";
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from 'app/context/user';
import { stripTags } from 'app/lib/util';
import { ConvoKeys } from './useConvos';

const HistoryKeys = {
    all: ['get_convo_messages'],
    messagesByConvo: (convoId) => [...HistoryKeys.all, convoId],
    messagesByConvoWithId: (convoId, messageId) => [...HistoryKeys.messagesByConvo(convoId), messageId]
}

export { HistoryKeys };

const updateMessage = async(iConvoId, iMessageId) => {
    const queryClient = useQueryClient();
    const oData = await queryClient.fetchQuery(HistoryKeys.messagesByConvoWithId(iConvoId, iMessageId), Services.getMessage(iMessageId));
}

export default function useHistory(convoId, onSuccess) {
   const { currentUser } = useCurrentUser(),
         { iPerPage } = Services;

   const queryClient = useQueryClient();
   return useInfiniteQuery(HistoryKeys.messagesByConvo(convoId), ({ pageParam = 0}) => Services.getMessages(convoId, pageParam), {
        enabled: !!convoId && !!currentUser,
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
       /* staleTime: 20 * 1000,*/
        cacheTime: 25 * 1000,
        select: (data) => data?.pages.flatMap(page => page),
        getPreviousPageParam: (firstPage, allPages) => {
            if (!firstPage || firstPage.length < iPerPage || ( allPages.length > 1 && allPages[allPages.length - 1].length !== firstPage.length ))
                return false;

            return firstPage[0].id;
        },
       /* getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                return false;

            return lastPage[lastPage.length-1].id;
        },*/
       onSuccess:(data) => {
            data.forEach((item) => {
                queryClient.setQueryData(HistoryKeys.messagesByConvoWithId(convoId, item.id), item)
            });

           if (typeof onSuccess === 'function')
                onSuccess(data);
       },
       /*notifyOnChangeProps: ['data', 'isLoading']*/
    });
}

export const useHistoryMessageAction = function(convoId, menuItem){
    const client = useQueryClient();

    let oLastMessage = null;
    const { mutateAsync: executeAction, isSuccess } =  useMutation({
        mutationFn: async ({ action, messageId }) => await Services.performAction(action, messageId),
        onMutate: async ({ messageId }) => {

            await client.cancelQueries(HistoryKeys.messagesByConvo(convoId));
            await client.cancelQueries(ConvoKeys.convoByMenu(menuItem));

            // Convos History
            const prevHistoryData = client.getQueryData(HistoryKeys.messagesByConvo(convoId));
            client.setQueryData(HistoryKeys.messagesByConvo(convoId), (oldData) => {
                const { pages } = oldData;
                const oNewMessages = pages.map((page) => page.filter(({ id }) => +id !== +messageId));

               if (oNewMessages?.length)
                    oLastMessage = oNewMessages[oNewMessages.length-1].slice(-1).pop(); // get the last message of history

               return {...oldData, pages: oNewMessages };
            });

            const prevConvoListData = client.getQueryData(ConvoKeys.convoByMenu(menuItem));
            if (oLastMessage) {
                const { lot_id, message, created } = oLastMessage,
                      prevConvoData = client.getQueryData(ConvoKeys.convoByMenuWithId(menuItem, lot_id));

                const iItemsCount = prevConvoData?.total_messages && (prevConvoData?.total_messages - 1);

                client.setQueryData(ConvoKeys.convoByMenuWithId(menuItem, lot_id), Object.assign({}, prevConvoData, {
                    total_messages: +iItemsCount,
                    message: stripTags(message),
                    date: created
                }));
            }

            client.setQueryData(ConvoKeys.convoByMenu(menuItem), (oldData) => {
                const { pages } = oldData;

                const oNewList = pages.map((page) => {
                    return page.map((oItem) => {
                        const { total_messages, id, created } = oItem;
                        if (+id === +convoId) {
                            return Object.assign({}, oItem, {
                                total_messages: total_messages > 0 ? total_messages - 1 : 0,
                                message: stripTags(oLastMessage.message),
                                date: oLastMessage.created
                            });
                        }
                        return oItem;
                    })
                });

                return {...oldData, pages: [...oNewList] };
            });

            return { prevHistoryData, prevConvoListData };
        },
        onError: (error, data, { prevHistoryData, prevConvoListData }) => {
            client.setQueryData(ConvoKeys.convoByMenu(menuItem), prevConvoListData);
            client.setQueryData(HistoryKeys.messagesByConvo(convoId), prevHistoryData);
        },
        onSettled: (data) => {
            //client.invalidateQueries({ queryKey: ConvoKeys.convoByMenu(menuItem)});
            //client.invalidateQueries({ queryKey: HistoryKeys.messagesByConvo(convoId) });
        }
    });



    return { executeAction, isSuccess };
}

export const useSendData = function(convoId, menuItem){
    const client = useQueryClient();
    const { currentUser } = useCurrentUser();
    const { mutate: sendMessage } = useMutation({
        mutationFn: ({ oFormData }) => Services.sendMessage(convoId, oFormData),
        onMutate: async ( { oData: { message } }) => {

            const iTime = parseInt((new Date()).getTime()/1000);

            await client.cancelQueries(HistoryKeys.messagesByConvo(convoId));
            await client.cancelQueries(ConvoKeys.convoByMenu(menuItem));

            // Convos History
            const prevHistoryData = client.getQueryData(HistoryKeys.messagesByConvo(convoId));
    
            if (!prevHistoryData)
                return;

            client.setQueryData(HistoryKeys.messagesByConvo(convoId), (oldData) => {
                const { pages } = oldData || { pages: [undefined]};
                pages[pages.length - 1] = [...pages[pages.length - 1], { id: iTime, created:iTime, lot_id: convoId, message, author_data: currentUser }];
                return {...oldData, pages };
            });

            const prevConvoListData = client.getQueryData(ConvoKeys.convoByMenu(menuItem));
            client.setQueryData(ConvoKeys.convoByMenu(menuItem), (oldData) => {
                const { pages } = oldData || {};

                let oModifiedItem = Object.create({});
                const oNewList = pages?.length && pages.map((page) => {
                    return page.filter((oItem) => {
                        const { total_messages, id } = oItem;
                        if (+id === +convoId) {
                            oModifiedItem = Object.assign({}, oItem, {
                                total_messages: +total_messages + 1,
                                message: stripTags(message)
                            });
                            return false;
                        }
                        return true;
                    })
                });

                oNewList[0] = [oModifiedItem, ...oNewList[0]];
                return {...oldData, pages: [...oNewList] };
            });

            return { prevHistoryData, prevConvoListData };
        },
        onError: (error, data, { prevHistoryData, prevConvoListData }) => {
            client.setQueryData(ConvoKeys.convoByMenu(menuItem), prevConvoListData);
            client.setQueryData(HistoryKeys.messagesByConvo(convoId), prevHistoryData);
        },
        onSettled: (data) => {
            client.invalidateQueries({ queryKey: HistoryKeys.messagesByConvo(convoId)});
            //client.invalidateQueries({ queryKey: ConvoKeys.convoByMenu(menuItem)});
        },
        onSuccess: (oData) => {
            //const { jot_id } = oData;
           /// console.log('----- on sucess data -----', jot_id);
            //if (jot_id) {
                //const oData = updateMessage(convoId, jot_id);
                //client.setQueryData(HistoryKeys.messagesByConvoWithId(convoId, jot_id));
                /*client.setQueryData(HistoryKeys.messagesByConvo(convoId), (data) => {
                    const { pages } = oldData || {};
                    pages[pages.length - 1] = [...pages[pages.length - 1], { id: iTime, created:iTime, lot_id: convoId, message, author_data: currentUser }];
                    return {...oldData, pages };
                });*/

              //  const oMessage = async () => await client.fetchQuery(HistoryKeys.messagesByConvoWithId(convoId, jot_id), Services.getMessage(jot_id));
                //client.setQueryData(HistoryKeys.messagesByConvoWithId(convoId, jot_id), prevHistoryData);
                //console.log('----- data message -----', oMessage());

           // }
        }
    });

    return { sendMessage };
}



