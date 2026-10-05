import { settings } from 'app/customization/settings';
export const MULTITENANT = appSetting('config', 'multitenant');
export const MULTITENANT_IMAGES_PROXY = appSetting('config', 'multitenant_images_proxy');
export const APP_URL = appSetting('config', 'app_url') ;
// Strip trailing slashes — UNA nginx 308s `//path` and relative Location breaks img/fetch.
export const UNA_URL = String(appSetting('config', 'una_url') || '').replace(/\/+$/, '');
export const UNA_API_KEY = appSetting('config', 'una_api_key');
export const PREVIEW_DOMAIN = String(appSetting('config', 'preview_domain') || '');
export const PREVIEW_API_KEY = appSetting('config', 'preview_api_key');
export const APP_ORIGIN = appSetting('config', 'app_origin');

/**
 * Join UNA origin + path without creating a double slash.
 * Pass `base` for multi-tenant overrides (defaults to configured UNA_URL).
 */
export function joinUnaUrl(path = '', base = UNA_URL) {
    const resolvedBase = String(base || '').replace(/\/+$/, '');
    const suffix = String(path || '');
    if (!resolvedBase) return suffix;
    if (!suffix) return resolvedBase;
    if (/^https?:\/\//i.test(suffix)) return suffix;
    return `${resolvedBase}/${suffix.replace(/^\/+/, '')}`;
}


export function appSetting(section, name, path) {
    appSetting.cacheSettings = appSetting.cacheSettings || {};

    const cacheKey = path ? `${section}_${name}_${path}` : `${section}_${name}`;
    if (appSetting.cacheSettings.hasOwnProperty(cacheKey)) {
        return appSetting.cacheSettings[cacheKey];
    }
    const sectionData = settings?.[section];
    const result = path ? sectionData?.[name]?.[path] : sectionData?.[name];
    appSetting.cacheSettings[cacheKey] = result ?? '';
    return appSetting.cacheSettings[cacheKey];
}

export function getBaseUrl() {
    // Client-side
    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${window.location.host}`;
    }

    // Server-side / SSR (shared bundle has no next/headers — prefer configured app URL)
    const appUrl = typeof APP_URL === 'string' ? APP_URL.replace(/\/$/, '') : '';
    if (appUrl) {
        return appUrl;
    }

    // No request context in the shared bundle (next/headers is app-only).
    return 'http://localhost:3000';
}

