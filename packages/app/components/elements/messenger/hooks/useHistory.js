import { HistoryServices as Services } from "app/components/elements/messenger/services";
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from 'app/context/user';
import { stripTags } from 'app/lib/util';
import { ConvoKeys } from './useConvos';
import {useContext} from "react";
import { MenuData, PageData } from "app/components/elements/messenger/context/messenger-сontext";

const HistoryKeys = {
    all: ['get_convo_messages'],
    messagesByConvo: (convoId) => [...HistoryKeys.all, convoId],
    messagesByConvoWithId: (convoId, messageId) => [...HistoryKeys.messagesByConvo(convoId), messageId]
}

export { HistoryKeys };

export const updateHistoryPageCache = async ()  => {
    const queryClient = useQueryClient();
    const { convoId } = useContext(PageData);

    return await queryClient.invalidateQueries({
        queryKey: HistoryKeys.messagesByConvo(convoId),
        exact: true,
        refetchType: 'active',
    });
};

export const updateMessageCache = (iMessageId) => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries(HistoryKeys.messagesByConvo(convoId), {
        predicate: (query) => {
            return query.pageParams === page;
        },
    });
};

export default function useHistory(convoId, onSuccess) {
   const { currentUser } = useCurrentUser(),
         { iPerPage } = Services;

   return useInfiniteQuery(HistoryKeys.messagesByConvo(convoId), ({ pageParam = 0}) => Services.getMessages(convoId, pageParam), {
            enabled: !!convoId && !!currentUser,
            //keepPreviousData: true,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
           /* staleTime: 20 * 1000,*/
            staleTime: Infinity,
            //cacheTime: 25 * 1000,
            select: (data) => data?.pages.flatMap(page => page),
            getPreviousPageParam: (firstPage, allPages) => {
                if (!firstPage || firstPage.length < iPerPage || ( allPages.length > 1 && allPages[allPages.length - 1].length !== firstPage.length ))
                    return false;

                return firstPage[0].id;
            },
           onSuccess:(data) => {
                if (typeof onSuccess === 'function')
                    onSuccess(data);
           },
           /*notifyOnChangeProps: ['data', 'isLoading']*/
    });
}

function removeCacheMessage(queryClient, convoId, iMessageId){
    queryClient.setQueryData(HistoryKeys.messagesByConvo(convoId), (currentData) => {
        const { pages } = currentData || {},
              newPages = pages?.map((page) => page.filter(({ id }) => +id !== +iMessageId));

        return {...currentData, pages: newPages };
    });
}

function updateConvoCache(queryClient, menuItem, oMessage, bDecrease = true){
    if (!oMessage)
        return;

    const { message, lot_id:convoId, created } = oMessage;

    queryClient.setQueryData(ConvoKeys.convoByMenu(menuItem), (currentData) => {
        const { pages } = currentData;

        const oNewList = pages.map((page) => {
            return page.map((oItem) => {
                const { total_messages, id } = oItem;
                if (id === convoId) {
                    const iTotal = bDecrease ? +total_messages - 1 : +total_messages + 1;

                    return Object.assign({}, oItem, {
                        total_messages: iTotal > 0 ? iTotal : 0,
                        message: stripTags(message),
                        date: created
                    });
                }
                return oItem;
            })
        });

        return { ...currentData, pages: [...oNewList] };
    });
}

function addNewMessage(queryClient, convoId, sMessage, currentUser, iTmpId){
    queryClient.setQueryData(HistoryKeys.messagesByConvo(convoId), (oldData) => {
        const { pages } = oldData || { pages: [undefined]},
            userData = { url_avatar: currentUser.avatar,
                display_name: currentUser.display_name,
                display_type: "unit",
                module: "bx_persons"};

        const oLastPage = [...pages];
        oLastPage[oLastPage.length - 1] = [...oLastPage[oLastPage.length - 1], { id: iTmpId, created:iTmpId, lot_id: convoId, message: sMessage, author_data: userData }];

        return {...oldData, pages:[...oLastPage] };
    });

}

function getLastMessage(queryClient, convoId){
    const { pages } = queryClient.getQueryData(HistoryKeys.messagesByConvo(convoId));

    if (!pages || pages.length === 0)
        return;

    return pages[0][pages[0].length - 1];
}

export const useHistoryMessageAction = function(convoId, menuItem){
    const queryClient = useQueryClient();

    const { mutateAsync: executeAction, isSuccess } =  useMutation({
        mutationFn: async ({ action, messageId }) => await Services.performAction(action, messageId),
        onMutate: async (oData) => {
            const { action, messageId } = oData;

            await queryClient.cancelQueries({ queryKey: HistoryKeys.messagesByConvo(convoId), exact: true });
            await queryClient.cancelQueries({ queryKey: ConvoKeys.convoByMenu(menuItem), exact: true });

            // Remove message and update the cache. Remove the last message.
            const prevHistoryData = queryClient.getQueryData(HistoryKeys.messagesByConvo(convoId));

            if (action === 'remove')
                removeCacheMessage(queryClient, convoId, messageId);

            // Find the latest message to use its data for talks briefs
            const prevConvoListData = queryClient.getQueryData(ConvoKeys.convoByMenu(menuItem)),
                  lastMessage = getLastMessage(queryClient, convoId);

            // Update talk's from which last message is in talks briefs area
            updateConvoCache(queryClient, menuItem, lastMessage, action === 'remove');

            return { prevHistoryData, prevConvoListData };
        },
        onError: (error, data, { prevHistoryData, prevConvoListData }) => {
            queryClient.setQueryData(ConvoKeys.convoByMenu(menuItem), prevConvoListData);
            queryClient.setQueryData(HistoryKeys.messagesByConvo(convoId), prevHistoryData);
        },
        onSuccess:(data) => {

        },
    });

    return { executeAction, isSuccess };
}

async function updateMessage (queryClient, convoId, { jot_id: iId, time}) {
    return await Services.getMessage(iId).then((data) => {
        queryClient.setQueryData(HistoryKeys.messagesByConvo(convoId), (currentData) => {
            const { pages } = currentData;

            const oNewList = pages.map((page) => {
                return page.map((oItem) => {
                    const {id} = oItem;
                    if (+id === +iId || +id === +time) {
                        return {...data};
                    }
                    return oItem;
                });
            });
            return {...currentData, pages: [...oNewList]};
        });
    });
}


export const useSendData = function(){
    const queryClient = useQueryClient();
    const { currentUser } = useCurrentUser();

    const { convoInfo: { item }, historyArea } = useContext(PageData),
        { menuItem } = useContext(MenuData),
        { id: convoId } = item || {},
        { action: historyAction, profile: actionProfile } = historyArea || {};

    const { mutate: sendMessage } = useMutation({
        mutationFn: ({ oFormData }) => {
            const aParams = Object.create(null);

            if (oFormData.has('id') && historyAction !== 'create-convo')
                oFormData.set('id', convoId);

            if (actionProfile && actionProfile.id)
                aParams.participants = [actionProfile.id];

            if (historyAction && oFormData.has('action'))
                aParams.action = historyAction;

            if (oFormData.has('payload') && Object.keys(aParams).length)
                oFormData.set('payload', JSON.stringify(aParams));

            return Services.sendMessage(oFormData);
        },
        onMutate: async ( { oData: { message, payload, message_id } }) => {
            await queryClient.cancelQueries({ queryKey: HistoryKeys.messagesByConvo(convoId), exact: true });
            await queryClient.cancelQueries({ queryKey: ConvoKeys.convoByMenu(menuItem), exact: true });

            const prevHistoryData = queryClient.getQueryData(HistoryKeys.messagesByConvo(convoId));
            if (!prevHistoryData)
                return {};

            // add new message, if it is not edit mode
            if (!message_id)
                addNewMessage(queryClient, convoId, message, currentUser, payload);

            // Find the latest message to use its data for talks briefs
            const lastMessage = getLastMessage(queryClient, convoId);
            const prevConvoListData = queryClient.getQueryData(ConvoKeys.convoByMenu(menuItem));

            // Update talk's from which last message is, in talks briefs area
            updateConvoCache(queryClient, menuItem, lastMessage, false);

            return { prevHistoryData, prevConvoListData };
        },
        onError: (error, data, { prevHistoryData, prevConvoListData }) => {
            queryClient.setQueryData(ConvoKeys.convoByMenu(menuItem), prevConvoListData);
            queryClient.setQueryData(HistoryKeys.messagesByConvo(convoId), prevHistoryData);
        },
        onSuccess: async (oData) => await updateMessage (queryClient, convoId, oData)
    });

    return { sendMessage };
}



