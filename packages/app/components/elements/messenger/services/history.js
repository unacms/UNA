import { fetcher } from "app/lib/fetcher";
import { getData, getUrl } from "./utils";

const iPerPage = 20;

const oUriList = {
  list: 'get_convo_messages',
  message: 'get_convo_message',
  form: 'get_send_form',
  search_users: 'search_users',
  clear_ghost: 'clear_ghost',
};

export default {
    iPerPage,
    getMessages: async (iConvoId, iJotId = 0) => {
        const data = await getData(oUriList.list, { lot: iConvoId, jot: iJotId }),
             { jots } = data || {};

        return jots || [];
    },
    performAction: async (sAction, messageId ) => {
       const data = await getData(`${sAction}_convo`, { jot_id: messageId });
        if (typeof data.code === 'undefined' || +data.code)
            console.log(`Actions ${sAction} was not found`, data.code);

        return data;
    },
    getForm: async (data) => await getData(oUriList.form, data),
    clearGhost: async (data) => await getData(oUriList.clear_ghost, data),
    sendMessage: async(formData) => {
        const { data } = await fetcher([getUrl(oUriList.form), '' , formData]);
        return data;
    },
    getMessage: async (id) => await getData(oUriList.message, { id }),
    getSearchUsers: async (sValue) => await getData(oUriList.search_users, { term: sValue })
};