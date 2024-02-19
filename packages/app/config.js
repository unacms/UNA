import { settings } from 'app/settings';

export const APP_URL = appSetting('config', 'app_url');
export const UNA_URL = appSetting('config', 'una_url');

export function appSetting(section, name, path) {
    if (path)
        return settings[section] && settings[section][name] ? settings[section][name][path] : '';

    return settings[section] ? settings[section][name] : '';
}