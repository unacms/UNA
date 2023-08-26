import Services from "../services/convos";
import { useInfiniteQuery, useQuery, useQueryClient, useMutation } from  '@tanstack/react-query';
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

export { useConvoItem, ConvoKeys };
export default function useConvos(menuItem, onSelect) {
    const { currentUser } = useCurrentUser();
    const queryClient = useQueryClient();

    return useInfiniteQuery(ConvoKeys.convoByMenu(menuItem), ({ pageParam = 0}) => Services.getList(menuItem, pageParam), {
        keepPreviousData: true,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        select: (data) => data?.pages.flatMap(page => page),
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                return false;

            return lastPage.length * allPages.length;
        },
        onSuccess: (data) => data.forEach((item) => queryClient.setQueryData(ConvoKeys.convoByMenuWithId(menuItem, item.id), item)),
        enabled: !!currentUser && !!menuItem
    });
}