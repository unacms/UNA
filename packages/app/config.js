import { settings } from 'app/settings';

export const APP_URL2 = appSetting('config', 'app_url') ;
export const APP_URL = appSetting('config', 'debug') ? 'http://localhost:3000' : APP_URL2 ;
export const UNA_URL = appSetting('config', 'una_url');

export function appSetting(section, name, path) {
    if (path)
        return settings[section] && settings[section][name] ? settings[section][name][path] : '';

    return settings[section] ? settings[section][name] : '';
}