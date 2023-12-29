import { fetcher } from "app/lib/fetcher";

const sModulePrefix =  '/api.php?r=bx_messenger/';

export function getUrl(sLink, oParams){
    const sParams = typeof oParams === 'object' ? '/&params=' + JSON.stringify(oParams) : '';
    return sModulePrefix + sLink + sParams;
}

export async function getData (sLink, oParams) {
    const { data } = await fetcher(getUrl(sLink, oParams));
    return data || [];
}

