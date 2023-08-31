import { fetcher } from "app/lib/fetcher";
const sModulePrefix =  '/api.php?r=bx_messenger/';

const iPerPage = 15;

const aEndpoints = {
    'list': 'get_convos_list',
    'convo': 'get_convo_item'
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
    }
};