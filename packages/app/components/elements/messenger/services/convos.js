import { fetcher } from "app/lib/fetcher";
const sModulePrefix =  '/api.php?r=bx_messenger/';

const iPerPage = 15;

const aEndpoints = {
    'list': 'get_convos_list',
    'convo': 'get_convo_item',
    'exact': 'find_convo',
    'create_convo': 'save_parts_list'
};

function getUrl(sLink, oParams){
    const sEndpoint = typeof aEndpoints[sLink] === 'undefined' ? sLink: aEndpoints[sLink],
        sParams = typeof oParams === 'object' ? '/&params=' + JSON.stringify(oParams) : '';

    return sModulePrefix + sEndpoint + sParams;
}

export default {
    iPerPage,
    getList: async(group, pageParam = 0) => {
        const { data } =  await fetcher(getUrl('list', { group, count: pageParam }));
        return data || [];
    },
    getConvo: async(id) => {
        const { data } =  await fetcher(getUrl('convo', { id }));
        return data || [];
    },
    findConvo: async(sParam) => {
        const { data } =  await fetcher(getUrl('exact', { param: sParam }));
        return data || [];
    },
    getCreateConvo: async (aUsers) => {
        const { data } = await fetcher(getUrl('create_convo', { parts: aUsers }));
        return data || [];
    }
};