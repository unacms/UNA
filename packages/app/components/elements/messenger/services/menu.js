import { getData } from "./utils";

const oUriLis = {
    menu: 'get_messenger_menu',
};

export default {
    getMenu: async () => await getData(oUriLis.menu)
};