import { getData } from "./utils";

const iPerPage = 15;

const oUriList = {
  'list': 'get_convos_list',
  'convo': 'get_convo_item',
  'exact': 'find_convo',
  'create_convo': 'save_parts_list'
};

export default {
    iPerPage,
    getList: async (group, pageParam = 0) => await getData(oUriList.list, { group, count: pageParam }),
    getConvo: async (id) => await getData(oUriList.convo, { id }),
    findConvo: async (sParam) => await getData(oUriList.exact, { param: sParam }),
    getCreateConvo: async (aUsers) => await getData(oUriList.create_convo, { parts: aUsers }),
};