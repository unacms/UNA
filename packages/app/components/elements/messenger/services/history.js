import { fetcher } from "app/lib/fetcher";
const sModulePrefix =  '/api.php?r=bx_messenger/';

const iPerPage = 20;

const aEndpoints = {
      'list': 'get_convo_messages',
      'message': 'get_convo_message',
      'form': 'get_send_form',
      'search_users': 'search_users',
    };

function getUrl(sLink, oParams){
    const sEndpoint = typeof aEndpoints[sLink] === 'undefined' ? sLink: aEndpoints[sLink],
          sParams = typeof oParams === 'object' ? '/&params=' + JSON.stringify(oParams) : '';

    return sModulePrefix + sEndpoint + sParams;
}

export default {
    iPerPage,
    getMessages: async (iConvoId, iJotId = 0) => {
        const { data } = await fetcher(getUrl('list', { lot: iConvoId, jot: iJotId })),
              { jots } = data || {};

        return jots || [];
    },
    performAction: async (sAction, messageId ) => {
       const { data, status } = await fetcher(getUrl(`${sAction}_convo`, { jot_id: messageId }));
        if (typeof data.code === 'undefined' || +data.code)
            console.log(`Actions ${sAction} was not found`, data.code);

        return data;
    },
    getForm: async () => {
       const { data } = await fetcher(getUrl('form'));
       return data;
    },
    sendMessage: async(id, formData) => {
        const { data } = await fetcher([getUrl('form', { id }), '' , formData]);
        return data;
    },
    getMessage: async (id) => {
        const { data } = await fetcher(getUrl('message', { id }));
        return data || [];
    },
    getSearchUsers: async (sValue) => {
        const { data } = await fetcher(getUrl('search_users', { term: sValue }));
        return data || [];
    }
};