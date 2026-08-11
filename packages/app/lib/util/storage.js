import pako from 'pako';
import { parse as flatted_parse, stringify as flatted_stringify } from 'flatted';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWeb } from './layout';
import { appSetting } from './settings';

const nativeCache = [];

/** Clear in-memory native sessionStorage stand-in used by storageSet/Get. */
export function clearNativeMemoryCache() {
    for (const key of Object.keys(nativeCache)) {
        delete nativeCache[key]
    }
}

export const getDataFromCache = (pref, storageKeyValue) => {
    if (appSetting('cache', 'list') && isWeb) {
        return storageGet(pref, storageKeyValue);
    }
    return false;
}

export async function asyncStorageSet(key, data) {
    if (isWeb) {
        storageSet(key, '', data, true);
    }
    else {
        AsyncStorage.setItem(key, data);
    }
}

export async function asyncStorageGet(key) {
    if (isWeb) {
        return storageGet(key, '', true);
    }
    else {
        return await AsyncStorage.getItem(key)
    }
}

export function storageSet(pref, key, data, isLocal = false) {

    if (!isWeb) {
        if (!isLocal && pref == 'layout:shmo') {
            nativeCache[pref + '-' + key] = data;
        }
    }
    else {
        if (typeof localStorage !== 'undefined') {
            const serializedData = appSetting('cache', 'compress') ? compress(data) : JSON.stringify(data);
            const storage = isLocal ? localStorage : sessionStorage;
            storage.setItem(`${pref}-${key}`, serializedData);
        }
    }
}

export function storageGet(pref, key, isLocal = false) {
    if (!isWeb) {
        if (!isLocal && pref == 'layout:shmo') {
            if (nativeCache[pref + '-' + key])
                return nativeCache[pref + '-' + key]
        }
        // return await AsyncStorage.getItem(`${pref}-${key}`);
    }
    else {
        if (typeof localStorage !== 'undefined') {
            const storage = isLocal ? localStorage : sessionStorage;
            const storedData = storage.getItem(`${pref}-${key}`);
            if (!storedData) return null;
            return appSetting('cache', 'compress') ? decompress(storedData) : JSON.parse(storedData);
        }
    }
}

export function storageKey(url, useUrl = true) {
    if (!isWeb)
        return;

    let s = url;
    if (!useUrl)
        s = url;
    return (s);
}

export function storageClear(pref, key) {
    if (!isWeb)
        return;

    if (pref && key)
        localStorage.removeItem(`${pref}-${key}`);
    else
        sessionStorage.clear();
}

export function storageRemove(pref, key, isLocal = false) {
    if (!isWeb) {

    }
    else {
        const storage = isLocal ? localStorage : sessionStorage;
        storage.removeItem(`${pref}-${key}`);
    }
}

function replacer(key, value) {
    if (value === this) {
        return undefined;
    }
    return value;
}

function compress(data) {

    try {
        let a = flatted_stringify(data);
        // Use browser-compatible approach instead of Buffer
        const compressed = pako.deflate(a);
        const binaryString = Array.from(compressed, byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    } catch (error) {
        return null;
    }
}

function decompress(data) {
    try {
        // Use browser-compatible approach instead of Buffer
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return flatted_parse(pako.inflate(bytes, { to: 'string' }));
    } catch (error) {
        return null;
    }
}
