import { settings } from 'app/settings';
export const APP_URL = appSetting('config', 'app_url') ;
export const UNA_URL = appSetting('config', 'una_url');
export const UNA_API_KEY = appSetting('config', 'una_api_key');
export const APP_ORIGIN = appSetting('config', 'app_origin');

/*const merge = require('deepmerge');

export function appSetting(section, name, path, extraSettings = null) {
    let settings_ = settings;
    if (extraSettings){
        settings_ = merge(settings, extraSettings)
    }

    if (path)
        return settings_[section] && settings_[section][name] ? settings_[section][name][path] : '';

    return settings_[section] ? settings_[section][name] : '';
}*/


export function appSetting(section, name, path, extraSettings = null) {
    // Initialize cacheSettings if it doesn't exist
    appSetting.cacheSettings = appSetting.cacheSettings || {};

    // Adjust cacheKey to exclude 'undefined' when 'path' is not provided
    const cacheKey = path ? `${section}_${name}_${path}` : `${section}_${name}`;
    if (appSetting.cacheSettings.hasOwnProperty(cacheKey)) {
        return appSetting.cacheSettings[cacheKey];
    }
    const sectionData = settings?.[section];
    const result = path ? sectionData?.[name]?.[path] : sectionData?.[name];
    appSetting.cacheSettings[cacheKey] = result ?? '';
    return appSetting.cacheSettings[cacheKey];
}


export async function getRemoteSettings(isServer = false) {
    const url = '/api.php?cnf=1';
    let opts = {
        cache: 'no-store',
        headers: {
            Origin: APP_ORIGIN
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
    const cnfData = cnf && typeof cnf.data !== 'undefined' && cnf.data != '' ? JSON.parse(cnf.data) : {};

    if (isServer)
        return {hash: cnf.hash, data: cnfData}

    return cnfData;
};
