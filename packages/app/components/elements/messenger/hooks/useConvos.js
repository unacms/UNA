import Services from "app/components/elements/messenger/services/convos";
import { useInfiniteQuery, useQuery, useQueryClient } from  '@tanstack/react-query';
import { useCurrentUser } from 'app/context/user';

const ConvoKeys = {
    all: ['get_convos_list'],
    convoByMenu: (menuItem) => [...ConvoKeys.all, menuItem],
    convoById: (convoId) => [...ConvoKeys.all, convoId],
    convoByMenuWithId: (menuItem, convoId) => [...ConvoKeys.convoByMenu(menuItem), convoId]
}

function useConvoItem(menuItem, convoId) {
    return useQuery(ConvoKeys.convoById(convoId), () => Services.getConvo(convoId), {
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: false
    });
}

function addConvoItem(menuItem, oData){
    const queryClient = useQueryClient();
    const { id } = oData;

    queryClient.setQueryData(ConvoKeys.convoByMenu(menuItem), (data) => {
        return { data, pages: [oData, ...oData.pages] };
    });

    queryClient.invalidateQueries({ queryKey: ConvoKeys.convoByMenu(menuItem) });/*.then((data) => {
        /!*setConvoId(+lot);
        setHistoryArea(false);
        setConvoItem({ item: convo, manually: true });
        console.log('-------- invalisate query -------', data, lot);*!/
    });*/
}

const getConvoItems  = (menuItem)  => {
    const queryClient = useQueryClient();

    let oData = queryClient.getQueryData(ConvoKeys.convoByMenu(menuItem));
    return {
       getConvoItem: (iConvoId) => {
           if (!iConvoId)
               return ;

           if (!oData)
               oData = queryClient.getQueryData(ConvoKeys.convoByMenu(menuItem));

           return oData?.pages.flatMap(page => page).find((oItem) => oItem.id === iConvoId)
       }
    };
}

export { useConvoItem, ConvoKeys, getConvoItems, addConvoItem };

export default function useConvos(menuItem, onSelect) {
    const { currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    return useInfiniteQuery(ConvoKeys.convoByMenu(menuItem), ({ pageParam = 0}) => Services.getList(menuItem, pageParam), {
        //keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        select: (data) => data?.pages.flatMap(page => page),
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage)
                throw new Error('No data!');

            if (Services.iPerPage > lastPage.length)
                return false;

            return lastPage.length * allPages.length;
        },
        onSuccess: (data) => data.forEach((item) => queryClient.setQueryData(ConvoKeys.convoByMenuWithId(menuItem, item.id), item)),
        enabled: !!currentUser && !!menuItem
    });
}