import { settings } from 'app/settings';
export const APP_URL = appSetting('config', 'app_url') ;
export const UNA_URL = appSetting('config', 'una_url');
export const UNA_API_KEY = appSetting('config', 'una_api_key');
const merge = require('deepmerge');

export function appSetting(section, name, path, extraSettings = null) {
    let settings_ = settings;
    if (extraSettings){
        settings_ = merge(settings, extraSettings)
    }

    if (path)
        return settings_[section] && settings_[section][name] ? settings_[section][name][path] : '';

    return settings_[section] ? settings_[section][name] : '';
}

export async function getRemoteSettings(isServer = false) {
    const url = '/api.php?cnf=1';
    let opts = {
        cache: 'no-store',
        headers: {
            Origin: 'neo://app'
        },
    };
    if (isServer){
        opts = {
            cache: 'no-store',
            headers: {
                authorization: 'Bearer ' + UNA_API_KEY,
            }
        };
    }
    const cnf = await(await fetch(UNA_URL + url, opts)).json();
    const cnfData = cnf && typeof cnf.data !== 'undefined' ? JSON.parse(cnf.data) : {};

    if (isServer)
        return {hash: cnf.hash, data: cnfData}

    return cnfData;
};
