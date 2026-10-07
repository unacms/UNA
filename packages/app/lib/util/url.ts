import * as WebBrowser from 'expo-web-browser';
import { isWeb } from './layout';
import { appSetting } from './settings';

export function addParameterToUrl(url: string, paramName: string, paramValue: string | number): string {

    if (url.includes('?')) {
        return url + '&' + paramName + '=' + paramValue;
    } else {
        return url + '?' + paramName + '=' + paramValue;
    }
}

export function getDomainFromUrl(url: string): string | undefined {
    let protocol: string;
    let domain: string | undefined;

    // Check if the URL contains a protocol
    if (url.indexOf("://") > -1) {
        protocol = url.split("://")[0] + "://";
        domain = url.split("://")[1]!.split("/")[0];
    } else {
        // Default to http if no protocol is found
        protocol = "http://";
        domain = url.split('/')[0];
    }
    if (domain)
        return protocol + domain;

}

function normalizeHostname(hostname: string | undefined): string {
    if (!hostname) return '';
    return hostname.toLowerCase().replace(/^www\./, '');
}

function looksLikeAbsoluteUrl(url: string): boolean {
    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return true;

    const hostPart = url.split('/')[0]!.split('?')[0]!.split('#')[0];
    if (!hostPart) return false;
    if (/^localhost(?::\d+)?$/i.test(hostPart)) return true;
    if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(hostPart)) return true;

    return hostPart.includes('.');
}

export function getHostnameFromUrl(url: unknown): string {
    if (!url || typeof url !== 'string') return '';

    if (url.startsWith('/') && !url.startsWith('//')) return '';
    if (!looksLikeAbsoluteUrl(url)) return '';

    try {
        const withProtocol = /^https?:\/\//i.test(url)
            ? url
            : url.startsWith('//')
                ? `https:${url}`
                : `https://${url}`;
        return normalizeHostname(new URL(withProtocol).hostname);
    } catch {
        const domain = getDomainFromUrl(url);
        if (!domain) return '';
        const host = domain.replace(/^https?:\/\//, '').split('/')[0];
        return normalizeHostname(host);
    }
}

export function absoluteApiUrl(url_name: string): string {
    return appSetting("config", "una_url") + appSetting("urls", url_name);
}

export function isUrl(str: unknown): boolean {
    if (typeof str !== 'string' || !str.trim()) return false;

    const value = str.trim();

    // 1. Try as-is first
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        // 2. If no protocol — try adding https://
        try {
            const url = new URL('https://' + value);
            return url.hostname.includes('.');
        } catch (e2) {
            return false;
        }
    }
}

export function parseUrl(url: string): { path: string; queryString: string | undefined } {
    let withoutProtocol = url;
    let parts = withoutProtocol.split('/');

    if (url.includes('//')) {
        withoutProtocol = url.split('//')[1]!;
        parts = withoutProtocol.split('/');
        parts.shift(); // remove the domain
    }

    const pathParts = parts.join('/').split('?');
    return {
        path: pathParts[0]!,
        queryString: pathParts[1],
    };
}

export function parseQueryString(queryString: string | undefined): Record<string, string | undefined> {

    const pairs = queryString?.split('&');
    const obj: Record<string, string | undefined> = {};

    // Empty query string: return {} (the old `pairs.forEach` threw here).
    pairs?.forEach(pair => {
        const [key, value] = pair.split('=');
        obj[key!] = value;
    });

    return obj;
}

export function getURI(url: unknown): string | false | undefined {
    if (typeof url !== 'string' || !url.length)
        return false;
    let path: string = url;

    let questionMarkIndex = path.indexOf("?");

    if (questionMarkIndex !== -1) {
        path = path.substring(0, questionMarkIndex);
    }

    let u = path.replace('page', '').split('/');
    u = u.filter(Boolean);
    return u[0]
}

export function getYouTubeVideoId(url: string): string | null {
    const regex =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:(?:watch\?v=|v\/|embed\/|shorts\/|live\/)|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match?.[1] ?? null;
}

export const openExternalLink = async (finalHref: string): Promise<void> => {
    await WebBrowser.openBrowserAsync(finalHref);
};

/** Normalize an in-app href: strips own host, rejects `javascript:`, keeps external URLs. `''` when unusable. */
export function sanitazeUrl(url: unknown): string {
    if (typeof url !== 'string') {
        return '';
    }

    const sanitizedHref = url.trim();
    if (!sanitizedHref) {
        return '';
    }

    if (sanitizedHref === '/home' && isWeb) {
        return '/';
    }

    if (/^\/?javascript:/i.test(sanitizedHref)) {
        return '';
    }

    let finalHref = sanitizedHref;

    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(finalHref)) {
        if (!finalHref.includes('://')) {
            return finalHref;
        }

    }
    const host = getHostnameFromUrl(finalHref);
    const rootHost = getHostnameFromUrl(appSetting('config', 'native_app_images_url'));

    if (host && host === rootHost) {
        try {
            const withProtocol = /^https?:\/\//i.test(finalHref) ? finalHref : `https://${finalHref}`;
            const parsed = new URL(withProtocol);
            finalHref = parsed.pathname + parsed.search + parsed.hash;
        } catch {
            finalHref = finalHref.replace(/^https?:\/\/[^/]+/, '');
        }
    } else if (host && host !== rootHost) {
        return finalHref;
    }

    return finalHref.startsWith('/') ? finalHref : `/${finalHref}`;
}

export function isExternalUrl(url: unknown): boolean {
    const host = getHostnameFromUrl(url);
    if (!host) return false;

    const rootHost = getHostnameFromUrl(appSetting('config', 'native_app_images_url'));
    return host !== rootHost;
}
