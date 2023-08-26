import { fetcher } from "app/lib/fetcher";

const CONVO_LIST = '/api.php?r=bx_messenger/get_convos_list/&params=',
      CONVO_ITEM = '/api.php?r=bx_messenger/get_convo_item/&params=';

export default {
    getList: async(group, pageParam = 0) => {
        const { data } =  await fetcher(CONVO_LIST + JSON.stringify({ group, count: pageParam }));
        return data || [];
    },
    getConvo: async(id) => {
        const { data } =  await fetcher(CONVO_ITEM + JSON.stringify({ id }));
        return data || [];
    }
};