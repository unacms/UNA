import { appSetting } from './settings';

export function _log(...args: unknown[]) {
    if (typeof __DEV__ !== 'undefined' ? !__DEV__ : process.env.NODE_ENV === 'production') return;
    if (appSetting('config', 'debug') !== true) return;
    console.log(...args);
}
