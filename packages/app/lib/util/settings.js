import { appSetting as setting } from 'app/config';
import { remoteSettings } from 'app/settings/remote';

export function appSetting(section, name, path) {
    return setting(section, name, path, remoteSettings.data);
}

