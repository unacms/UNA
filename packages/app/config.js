import { settings } from 'app/customization/settings';
export const MULTITENANT = appSetting('config', 'multitenant');
export const MULTITENANT_IMAGES_PROXY = appSetting('config', 'multitenant_images_proxy');
export const APP_URL = appSetting('config', 'app_url') ;
export const UNA_URL = appSetting('config', 'una_url');
export const UNA_API_KEY = appSetting('config', 'una_api_key');
export const APP_ORIGIN = appSetting('config', 'app_origin');


export function appSetting(section, name, path, extraSettings = null) {
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

    try {
        const h = headers();
        const host = h.get("host") || "localhost:3000";
        const proto = h.get("x-forwarded-proto") || "http";
        return `${proto}://${host}`;
    } catch {
        return "http://localhost:3000"; // fallback for SSR
    }
}

export async function getRemoteSettings(isServer = false) {
    const url = '/api.php?cnf=1';

    // Fast-fail if base URL is missing
    if (!UNA_URL) {
        return isServer ? { hash: '', data: {} } : {};
    }

    const buildOptions = () => {
        if (isServer) {
            return {
                cache: 'no-store',
                headers: {
                    authorization: 'Bearer ' + UNA_API_KEY,
                }
            };
        }
        return {
            cache: 'no-store',
            headers: {
                Origin: APP_ORIGIN
            },
        };
    };

    const fetchOnce = async (timeoutMs) => {
        const request = fetch(UNA_URL + url, buildOptions()).then(async (r) => {
            if (!r.ok)
                throw new Error('HTTP ' + r.status);
            try {
                return await r.json();
            } catch (e) {
                return {};
            }
        });

        let to;
        const timeout = new Promise((_, reject) => {
            to = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        });

        try {
            return await Promise.race([request, timeout]);
        } finally {
            clearTimeout(to);
        }
    };

    const maxAttempts = 3;
    const baseDelayMs = 300;
    const timeoutPerAttemptMs = 3500;

    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const cnf = await fetchOnce(timeoutPerAttemptMs);
            const raw = cnf && typeof cnf.data !== 'undefined' && cnf.data !== '' ? cnf.data : {};
            let cnfData = {};
            try {
                cnfData = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
            } catch (e) {
                cnfData = {};
            }

            if (isServer)
                return { hash: cnf?.hash || '', data: cnfData };

            return cnfData;
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * attempt;
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    // On consistent failure, return safe empty payload matching the expected shape
    if (isServer)
        return { hash: '', data: {} };

    return {};
};
