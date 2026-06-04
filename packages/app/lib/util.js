import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import * as Crypto from 'expo-crypto';
import { md5Sync } from 'app/lib/md5-string';
import pako from 'pako';
import i18n from 'i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { appSetting as setting, UNA_URL, APP_URL } from 'app/config';
import { remoteSettings } from 'app/settings/remote';
import { parse as flatted_parse, stringify as flatted_stringify } from 'flatted';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isComponent } from 'app/components/registry';
import { clsx } from 'clsx';
import * as RNLocalize from "react-native-localize";
import { ImageManipulator, SaveFormat } from 'app/lib/image-manipulator';
import * as WebBrowser from 'expo-web-browser';

const nativeCache = [];
export const isWeb = Platform.OS === 'web'

export const LAYOUT_BREAKPOINTS = {
    '2xl': 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640
};

const LAYOUT_BREAKPOINTS_DESC = Object.entries(LAYOUT_BREAKPOINTS).sort((a, b) => b[1] - a[1]);

export function getBreakpoint(width) {
    for (const [label, min] of LAYOUT_BREAKPOINTS_DESC) {
        if (width >= min) return label;
    }
    return '';
}

export function appSetting(section, name, path) {
    return setting(section, name, path, remoteSettings.data);
}

export function cn(...classes) {
    return clsx(classes);
}

export function isObjectsEqual(obj, obj2) {
    return flatted_stringify(obj) == flatted_stringify(obj2)
}

export async function subscribeOneSignal(currentUser, askPermission = false) {
    if (isWeb) return;
    const { LogLevel, OneSignal } = await import('react-native-onesignal');
    OneSignal.Debug.setLogLevel(LogLevel.None);
    OneSignal.initialize(appSetting('config', 'api_keys', 'onesignal'));

    if (Platform.OS === "android") {
        // TODO: better solution would be to ask user if they want to receive notifications
        // and only then request permissions, instead of delay.
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    let permissionStatus = await OneSignal.Notifications.getPermissionAsync();
    //console.log("OneSignal permission status before request:", permissionStatus);

    if (!permissionStatus && askPermission) {
        await OneSignal.Notifications.requestPermission(true);
        permissionStatus = await OneSignal.Notifications.getPermissionAsync();
        //console.log("OneSignal permission status after request:", permissionStatus);
    }

    if (permissionStatus) {
        /*console.log("OneSignal data:", {
            id: await OneSignal.User.getOnesignalId(),
            token: await OneSignal.User.pushSubscription.getTokenAsync(),
            optedIn: await OneSignal.User.pushSubscription.getOptedInAsync(),
            permission: permissionStatus
        });*/

        await OneSignal.login(String(currentUser.id));
        await OneSignal.User.addTag("user_hash", String(currentUser.hash));
    }

    // Method for listening for notification clicks
    /*OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('OneSignal: notification clicked:', event);
    });*/
}

export function normalizeClasses(a) {
    if (!a) return a
    // Notes:
    // - `group` is a special Tailwind marker (not a style utility).
    // - `web:group` won't create a `.group` ancestor on web unless we rewrite it.
    // - On native, we strip web-only and pseudo-class variants to reduce parsing work.
    if (isWeb) {
        return a.replace(/\bweb:group\b/g, 'group');
    }

    return a
        .replace(/\bweb:group\b/g, '')
        .replace(/\b\S*(hover|focus|active|group|duration|group-hover):\S*\b/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

export function decodeText(str) {
    return decode(str);
}

export const htmlDecode = decodeText; // Alias for backward compatibility
export function cloneObject(obj) {
    return flatted_parse(flatted_stringify(obj))
}

export function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}

export async function getClipboard() {
    if (isWeb) {
        return await navigator.clipboard.readText();

    }
    else {
        return await Clipboard.getString();
    }
}

export function addParameterToUrl(url, paramName, paramValue) {

    if (url.includes('?')) {
        return url + '&' + paramName + '=' + paramValue;
    } else {
        return url + '?' + paramName + '=' + paramValue;
    }
}

export function getDomainFromUrl(url) {
    let protocol;
    let domain;

    // Check if the URL contains a protocol
    if (url.indexOf("://") > -1) {
        protocol = url.split("://")[0] + "://";
        domain = url.split("://")[1].split('/')[0];
    } else {
        // Default to http if no protocol is found
        protocol = "http://";
        domain = url.split('/')[0];
    }
    if (domain)
        return protocol + domain;

}

export async function setClipboard(str) {
    if (!isWeb) {
        Clipboard.setString(str);
    }
    else {
        await navigator.clipboard.writeText(str);
    }
}

export function absoluteApiUrl(url_name) {
    return appSetting("config", "una_url") + appSetting("urls", url_name);
}

export function clearNotif() {

    const clearNotifications = async () => {
        fetcher('/api.php?r=bx_notifications/mark_as_read/')
    }

    clearNotifications();

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
/*
export const formatDate = (date, t) => {
    const day = String(date.getDate());
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = t(monthNames[date.getMonth()]);
    let year = date.getFullYear();
    if (year == new Date().getFullYear())
        year = '';
    return `${day} ${month} ${year}`;
}*/
const _fmtCache = new Map();

function getDateOrderByLocale(tag) {
    const lang = tag.toLowerCase();
    if (lang.startsWith("en-us")) return "M D, Y";
    if (lang.startsWith("zh") || lang.startsWith("ja") || lang.startsWith("ko")) return "Y M D";
    return "D M Y";
}

export function isUrl(str) {
    if (typeof str !== 'string' || !str.trim()) return false;

    const value = str.trim();

    // 1. Сначала пробуем как есть
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        // 2. Если нет протокола — пробуем добавить https://
        try {
            const url = new URL('https://' + value);
            return url.hostname.includes('.');
        } catch (e2) {
            return false;
        }
    }
}

export const formatDate = (
    input,
    t,
    {
        inFuture = false,
        inPast = false,
        locale,                     // 'en-US' (не используется для универсальности)
        month = 'short',            // 'numeric' | '2-digit' | 'short' | 'long' | ...
        showTime = false,
        showDate = true,
        hour12,                     // true/false | undefined (оставит поведение локали)
        timeZone,                   // fex 'UTC' (не используется для универсальности)
        yearPolicy = 'auto',        // 'auto' | 'always' | 'never'
    } = {}
) => {
    const date = input instanceof Date ? input : new Date(input);
    const localeTag = locale || RNLocalize.getLocales()?.[0]?.languageTag || "en-US";
    if (Number.isNaN(date.getTime())) return '';
    const nowYear = new Date().getFullYear();

    let rel = '';
    if (inFuture && showDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        rel = dDay.getTime() === today.getTime() ? t('Today ') : dDay.getTime() === tomorrow.getTime() ? t('Tomorrow ') : '';
    }

    if (inPast) {
        const now = new Date();
        const diffMs = date - now;
        const sec = Math.round(diffMs / 1000);
        const absSec = Math.abs(sec);
        if (absSec < 60)
            return t('Now');

        // Универсальное форматирование относительного времени (одинаковое везде)
        const min = Math.round(sec / 60);
        if (Math.abs(min) < 60) {
            return `${Math.abs(min)}m`;
        }
        const hrs = Math.round(sec / 3600);
        if (Math.abs(hrs) < 24) {
            return `${Math.abs(hrs)}h`;
        }
        const days = Math.round(sec / (3600*24));
        if (Math.abs(days) < 31) {
            return `${Math.abs(days)}d`;
        }
        const weeks = Math.round(sec / (3600*24*7));
        if (Math.abs(weeks) < 24) {
            return `${Math.abs(weeks)}w`;
        }
    }

    return formatDateUniversal(date, {
        showDate,
        showTime,
        month,
        yearPolicy,
        nowYear,
        hour12,
        rel,
        localeTag
    });
};

// Универсальная функция форматирования даты (одинаковый результат везде)
function formatDateUniversal(date, {
    showDate,
    showTime,
    month,
    yearPolicy,
    nowYear,
    hour12,
    rel,
    localeTag, // добавили
}) {
    const parts = [];

    // --- DATE ---
    if (showDate && !rel) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLongNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayStr = String(date.getDate()); // можно padStart(2,'0') если хочешь 2-digit
        const monthIndex = date.getMonth();

        let monthStr;
        if (month === 'short') monthStr = monthNames[monthIndex];
        else if (month === 'long') monthStr = monthLongNames[monthIndex];
        else if (month === 'numeric') monthStr = String(monthIndex + 1);
        else if (month === '2-digit') monthStr = String(monthIndex + 1).padStart(2, '0');
        else monthStr = monthNames[monthIndex];

        const needYear = (yearPolicy === 'always') || (yearPolicy === 'auto' && date.getFullYear() !== nowYear);
        const yearStr = String(date.getFullYear());

        const tokens = { D: dayStr, M: monthStr, Y: needYear ? yearStr : "" };

        // порядок + пунктуация
        const pattern = getDateOrderByLocale(localeTag); // "M D, Y" etc
        const dateText = pattern
            .replace(/\bD\b/g, tokens.D)
            .replace(/\bM\b/g, tokens.M)
            .replace(/\bY\b/g, tokens.Y)
            // подчистим лишнюю пунктуацию/пробелы, если год скрыт
            .replace(/\s+,/g, ",")
            .replace(/,\s*$/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (dateText) parts.push(dateText);
    }

    // --- TIME ---
    if (showTime) {
        let hours = date.getHours();
        const minutes = date.getMinutes();

        if (hour12) {
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`);
        } else {
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }
    }

    return (rel || "") + parts.join(" ");
}
/*
export const formatTime = (ts) => {
    const date = new Date(ts * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Return an empty string if the time is exactly midnight
    if (hours === 0 && minutes === 0) {
        return '';
    }

    // Format hours and minutes with leading zeros if needed
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}*/

export const formatDateInterval = (dateStart, dateEnd, t) => {
    const start = new Date(dateStart * 1000);
    const end = new Date(dateEnd * 1000);

    const isSingleDate = (start).toLocaleDateString() === (end).toLocaleDateString();
    const isSingleTime = (start).toLocaleTimeString() === (end).toLocaleTimeString();

    if (isSingleDate)
        if (isSingleTime)
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' });
        else
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: false, month: 'numeric' });
    else
        return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: true, month: 'numeric' });


}
/*
export const formatDateInterval = (dateStart, dateEnd, t) => {
    const start = new Date(dateStart * 1000);
    const end   = new Date(dateEnd * 1000);

    const isSingleDate = (new Date(start)).toLocaleDateString() === (new Date(end)).toLocaleDateString();
    const isSingleTime = (new Date(start)).toLocaleTimeString() === (new Date(end)).toLocaleTimeString();

    let sRv = formatDate(new Date(dateStart * 1000), t, {inFuture:true});

    if (isSingleDate) {
        sRv += isSingleTime ? formatTime(dateStart) : `${formatTime(dateStart)} - ${formatTime(dateEnd)}`;
    } else {
        sRv += ' ' + formatTime(dateStart) + ' - ' + formatDate(new Date(dateEnd * 1000), t, {inFuture:true}) + ' ' + formatTime(dateEnd);
    }

    return sRv;
}*/

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
        console.log('!!!-Compression error:', data, error);
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
        console.log('!!!-Decompression error:', error, error);
        return null;
    }
}

export function md5(str) {
    return md5Sync(String(str ?? ''));
}
export async function md52(str) {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        str
    );
}

export function getPageWidth(uri, config) {
    //let settings = appSetting('l-ayouts', uri)
    const settings = getPageSettings(config, uri);
    if (settings?.max_width)
        return settings.max_width;

    return appSetting('layout', 'max_width');
}

/** UNA `page_layouts` entry from settings (shell + content classNames), or null if unknown. */
export function getUnaPageLayoutClasses(layoutKey) {
    if (!layoutKey) {
        return null;
    }
    const pageLayouts = appSetting('layout', 'page_layouts') || {};
    return pageLayouts[layoutKey] ?? null;
}

export function getAlert(type, data) {
    /*
    сonnections:action
    */
    return { type: type, data: data };
}

export function getRandomColor(str) {
    if (!str)
        str = 'a';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    var arr = appSetting('theme', 'profile_colors')
    return arr[Math.abs(hash % 10)];
}

export function getBlocksFromData(data) {
    let blocks = {};
    if (!data || !data.elements || typeof data.elements !== 'object') {
        return blocks;
    }
    Object.keys(data.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            blocks['block' + data.elements[key][key2].id] = { name: data.elements[key][key2].source, showPad: true }
            if (data.elements[key][key2] && Array.isArray(data.elements[key][key2].content) && data.elements[key][key2].content[0] && data.elements[key][key2].content[0].type != 'browse') {
                blocks['block' + data.elements[key][key2].id].perLine = 1
            }
        })
    })
    return blocks;
}

export function getLayoutName(data, uri) {
    if (data?.page_status) {
        return { layoutName: 'default', layoutBlocks: '', isCustomLayout: false, columnLayout: '' };
    }

    const pageSettings = getPageSettings(data?.config, uri) || {};
    const customLayout = pageSettings.layout || '';
    const customBlocks = pageSettings.blocks || '';
    const isCustom = Boolean(customLayout);

    const checks = [
        {
            cond: uri === 'login',
            name: 'login',
            blocks: customBlocks,
            custom: true,
            columnLayout: getUnaPageLayoutClasses(customLayout) ? customLayout : '',
        },
        {
            cond: isCustom,
            name: customLayout,
            blocks: customBlocks,
            custom: true,
        },
        {
            cond: Boolean(data?.cover_block?.profile),
            name: 'profile',
        },
        {
            cond: uri === 'home',
            name: 'home',
            custom: true,
        },
        {
            cond: uri === 'create-account',
            name: 'create-account',
            custom: true,
        },
        {
            cond: data?.menu?.items?.length > 0 && !uri.includes('create-'),
            name: 'navigator',
        },
        {
            cond: data?.layout && isComponent('layout', data.layout),
            name: data.layout,
            blocks: customBlocks,
        },
    ];

    for (const { cond, name, blocks = customBlocks, custom = isCustom, columnLayout = '' } of checks) {
        if (cond) {
            return { layoutName: name, layoutBlocks: blocks, isCustomLayout: custom, columnLayout };
        }
    }

    return { layoutName: 'default', layoutBlocks: customBlocks, isCustomLayout: isCustom, columnLayout: '' };
}

export function getHeaderSettings(uri, isDesktop, layout, config) {
    let settings = getPageSettings(config, uri);
    if (!settings?.headerSettings) {
        if (layout == 'navigator') {
            settings = { headerSettings: { offset: isDesktop ? true : false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (layout == 'messenger') {
            settings = { headerSettings: { offset: false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (layout == 'profile') {
            settings = { headerSettings: { offset: false, header: false, footer: true } }
        }
    }

    const bBackButton = typeof settings?.headerSettings?.backButton !== 'undefined' ? settings.headerSettings.backButton : true;

    let bHeader = typeof settings?.headerSettings?.header !== 'undefined' ? settings.headerSettings.header : true;

    let bFooter = typeof settings?.headerSettings?.footer !== 'undefined' ? settings.headerSettings.footer : true;
    if (isDesktop) {
        bHeader = true;
    }

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' ? settings.headerSettings.menu : true;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' ? settings.headerSettings.title : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' ? settings.headerSettings.offset : false;

    let sCover = typeof settings?.headerSettings?.cover !== 'undefined' ? settings.headerSettings.cover : 'full';

    let sColumns = typeof settings?.headerSettings?.columns !== 'undefined' ? settings.headerSettings.columns : '';

    let bHideLeftmenu = typeof settings?.headerSettings?.hideLeftmenu !== 'undefined' ? settings.headerSettings.hideLeftmenu : false;

    // Apply offset on all viewports, not just larger ones PLAESE DONT CHANGE IT
    if (isDesktop)
        bOffset = true;

    return {
        backButton: bBackButton,
        header: bHeader,
        menu: bMenu,
        title: bTitle,
        offset: bOffset,
        footer: bFooter,
        cover: sCover,
        columns: sColumns,
        hideLeftmenu: bHideLeftmenu,
    }
}

export function getUnitModeBySource(endpoint) {

    const source = endpoint?.request_url
    if (!source)
        return 'default';

    let unit_by_source = appSetting('browse', 'unit_by_source');

    for (let key in unit_by_source) {
        if (source.includes(key))
            return unit_by_source[key];
    }

    if (endpoint?.params?.type == 'context') {
        return 'context';
    }

    if (endpoint?.params?.type == 'author') {
        return 'author';
    }

    return 'default';
}


/*export function truncateHTML(html, maxLength) {
    if (!html) return '';

    // Limit the length
    let truncated = html.substring(0, maxLength);

    // Remove trailing half-opened tags
    truncated = truncated.replace(/<[^>]*$/, '');

    // Stack to track opened tags
    const tags = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    let match;

    // Iterate over all tags to see which ones are opened or closed
    while ((match = tagRegex.exec(truncated))) {
        const tagName = match[1];
        const isClosingTag = match[0][1] === '/';

        if (!isClosingTag && !/br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr/.test(tagName)) {
            tags.push(tagName);
        } else {
            let i = tags.lastIndexOf(tagName);
            if (i !== -1) {
                tags.splice(i, 1); // Remove the tag from the stack
            }
        }
    }

    // Close all unclosed tags in the reverse order they were opened
    while (tags.length) {
        truncated += `</${tags.pop()}>`;
    }

    return truncated;
}*/

export function truncateHTML(html, maxLength, maxLines = null) {
    if (!html) return '';

    let textLength = 0;
    let lineCount = 0;
    let truncated = '';

    // Регулярное выражение для поиска тегов и текстовых фрагментов
    const tagOrTextRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi;
    let match;

    // Стек для отслеживания открытых тегов
    const tags = [];

    // Идем по HTML и обрезаем текстовый контент до maxLength или maxLines
    while ((match = tagOrTextRegex.exec(html))) {
        const part = match[0];

        if (part[0] === '<') {
            // Если это тег, проверяем открывающий или закрывающий
            const tagName = match[1].toLowerCase();
            const isClosingTag = part[1] === '/';

            if (!isClosingTag) {
                // Check if this tag starts a new line
                if (/br|p|div|li|h[1-6]|section|article|header|footer/.test(tagName)) {
                    lineCount++;
                    if (maxLines !== null && lineCount > maxLines) break;
                }

                if (!/br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr/.test(tagName)) {
                    tags.push(tagName);
                }
            } else if (isClosingTag) {
                const lastIndex = tags.lastIndexOf(tagName);
                if (lastIndex !== -1) {
                    tags.splice(lastIndex, 1);
                }
            }

            // Добавляем тег к результату, но не увеличиваем счетчик текста
            truncated += part;
        } else {
            // Это текстовая часть
            // Проверяем наличие явных переносов строк в тексте
            const textLines = part.split(/\r\n|\r|\n/);
            let textPartTruncated = '';

            for (let i = 0; i < textLines.length; i++) {
                if (i > 0 || (lineCount === 0 && textLines[i].trim().length > 0)) {
                    lineCount++;
                    if (maxLines !== null && lineCount > maxLines) break;
                }

                if (i > 0) textPartTruncated += '\n';

                const remainingChars = maxLength - textLength;
                const line = textLines[i];

                if (line.length > remainingChars) {
                    textPartTruncated += line.substring(0, remainingChars);
                    textLength += remainingChars;
                    break;
                } else {
                    textPartTruncated += line;
                    textLength += line.length;
                }
            }

            truncated += textPartTruncated;

            if (maxLines !== null && lineCount > maxLines) break;
            if (textLength >= maxLength) break;
        }
    }

    // Закрываем все незакрытые теги
    while (tags.length) {
        truncated += `</${tags.pop()}>`;
    }

    return truncated;
}

export function firstLetterCap(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function reverseHtml(str) {
    var ph = String.fromCharCode(206);
    var result = str.split('').reverse().join('');
    while (result.indexOf('<') > -1) {
        result = result.replace('<', ph);
    }
    while (result.indexOf('>') > -1) {
        result = result.replace('>', '<');
    }
    while (result.indexOf(ph) > -1) {
        result = result.replace(ph, '>');
    }
    return result;
}

export function parseUrl(url) {
    let withoutProtocol = url;
    let parts = withoutProtocol.split('/');

    if (url.includes('//')) {
        withoutProtocol = url.split('//')[1];
        parts = withoutProtocol.split('/');
        parts.shift(); // remove the domain
    }

    const pathParts = parts.join('/').split('?');
    return {
        path: pathParts[0],
        queryString: pathParts[1],
    };
}

export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }

    if (typeof obj1 != "object" || obj1 === null ||
        typeof obj2 != "object" || obj2 === null) {
        return false;
    }

    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    if (keys1.length != keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export function parseQueryString(queryString) {

    const pairs = queryString?.split('&');
    const obj = {};

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        obj[key] = value;
    });

    return obj;
}

function getPlural(key, count) {

    let lastDigit = count % 10;
    let lastTwoDigits = count % 100;

    if (count == 0)
        return key + '_0';

    if (count == 1) {
        return key + '_1';
    }
    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        return key + '_2';
    }
    return key + '_plural';
}

export function tp(key, count, isHideData = false) {
    let ct = count;
    if (isHideData)
        ct = '';
    return i18n.t(getPlural(key, count), { count: ct });
}

export function linkify2(text, excluded = []) {
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
    let matches = Array.from(text.matchAll(urlRegex)).reverse();
    for (let match of matches) {
        if ([APP_URL, UNA_URL].every(domain => !match[0].includes(domain))) {
            const url = match[0];
            if (!excluded.some(ex => url.includes(ex))) {
                return url;
            }
        }
    }
    return null;
}

export function linkify3(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function clearLinks(text) {
    if (!text)
        return text;
    const regex = new RegExp(escapeRegExp(UNA_URL), 'g');
    return text.replace(regex, '/');
}

export function linkify(text, attrs = '', htmlSpecialChars = false) {
    return clearLinks(text.replace(/<span contenteditable="false">(.*?)<\/span>/g, '$1'));
    // todo improve
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;

    const anchorRegex = /<a [^>]*>[^<]*<\/a>/g;

    const anchors = [...text.matchAll(anchorRegex)];

    if (htmlSpecialChars)
        text = text.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

    let matches = Array.from(text.matchAll(urlRegex)).reverse();

    matches.forEach(match => {
        let url = match[0];
        let attrsLocal = attrs;

        let withinAnchor = anchors.some(anchor => match.index > anchor.index && match.index < anchor.index + anchor[0].length);
        if (withinAnchor) return;

        if (!/^https?:\/\//.test(url)) {
            url = 'http://' + url;
        }

        text = text.slice(0, match.index) + '<a ' + attrsLocal + ' href="' + url + '">' + match[0] + '</a>' + text.slice(match.index + match[0].length);
    });

    // email pattern
    const mailPattern = /([A-z0-9._-]+@[A-z0-9_-]+\.[A-z0-9_.-]+)/g;
    matches = Array.from(text.matchAll(mailPattern)).reverse();
    matches.forEach(match => {
        let withinAnchor = anchors.some(anchor => match.index > anchor.index && match.index < anchor.index + anchor[0].length);
        if (withinAnchor) return;
        text = text.slice(0, match.index) + '<a href="mailto:' + match[0] + '">' + match[0] + '</a>' + text.slice(match.index + match[0].length);
    });

    return text;
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export { FeedbackHaptics } from 'app/lib/feedback-haptics';

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function isEmoji(s) {
    const emojiRegex = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
    return !!s.match(emojiRegex);
}

export function stripTags(s) {
    if (s)
        return String(s).replace(/(<([^>]+)>)/ig, '').replace(/\s+/g, ' ');

    return s;
}

/*export function stripTagsWithLinks(s) {
    if (s)
        return String(s).replace(/<(?!\/?(a|p|br)(?=>|\s.*>))\/?.*?>/ig, '').replace(/\s+/g, ' ');

    return s;
}*/
export function stripTagsWithLinks(s, allowed = ['a', 'p', 'br']) {
    if (s) {
        const allowedTags = allowed.join('|');
        const regex = new RegExp(`<(?!(\\/?)(${allowedTags})(?=>|\\s.*>))\\/?.*?>`, 'ig');
        return String(s).replace(regex, '').replace(/\s+/g, ' ');
    }
    return s;
}

function urltoFile(url, defaultFilename = 'file', defaultMimeType = 'application/octet-stream') {
    return fetch(url)
        .then(function (response) {
            return response.blob().then(function (blob) {
                const mimeType = blob.type || defaultMimeType;
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = defaultFilename;

                if (contentDisposition && contentDisposition.includes('filename')) {
                    const matches = contentDisposition.match(/filename="?(.+?)"?$/);
                    if (matches && matches[1]) {
                        filename = matches[1];
                    }
                } else {
                    const urlParts = url.split('/');
                    const rawFilename = urlParts[urlParts.length - 1];

                    if (rawFilename.includes('.') && rawFilename.split('.').length > 1) {
                        filename = rawFilename;
                    } else {
                        if (mimeType != 'image/svg+xml') {
                            const ext = mimeType.split('/')[1] || 'bin';
                            filename = `${rawFilename || defaultFilename}.${ext}`;
                        }
                        else {
                            filename = `${rawFilename || defaultFilename}.svg`;
                        }
                    }
                }
                return new File([blob], filename, { type: mimeType });
            });
        })
        .catch(function (error) {
            console.error('Error converting URL to File:', error);
            throw error;
        });
}


export const uploadImageFile = async (file, fetchUrl, calback, extraVar) => {
    const formData = new FormData();

    formData.append("file", file);
    const result = await fetcher([fetchUrl, null, formData]);
    if (result?.data?.link) {
        calback(result?.data?.link, extraVar);
    }
    else {
        calback(result, extraVar)
    }
}

export const getUploadSizeMb = async ({ file, uri, fileSizeBytes }) => {
    if (typeof fileSizeBytes === 'number' && fileSizeBytes > 0) {
        return fileSizeBytes / (1024 * 1024);
    }

    if (file && typeof file.size === 'number') {
        return file.size / (1024 * 1024);
    }

    if (uri && Platform.OS === 'web') {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return (blob?.size || 0) / (1024 * 1024);
        } catch {
            return 0;
        }
    }

    return 0;
}

export const prepareImageForUpload = async ({
    uri,
    width,
    height,
    fileSizeBytes,
    maxWidth,
    maxHeight,
    cropToSquare = false,
    squareSize,
    webpOverMb = 4,
}) => {
    const originalSizeMb = await getUploadSizeMb({ uri, fileSizeBytes });
    const shouldConvertToWebp = originalSizeMb > webpOverMb;
    const context = ImageManipulator.manipulate(uri);
    let hasActions = false;

    if (
        typeof width === 'number' &&
        typeof height === 'number' &&
        typeof maxWidth === 'number' &&
        typeof maxHeight === 'number' &&
        (width > maxWidth || height > maxHeight)
    ) {
        let resizeWidth = maxWidth;
        let resizeHeight = maxHeight;

        if (width > height) {
            resizeHeight = Math.round((height * resizeWidth) / width);
        } else {
            resizeWidth = Math.round((width * resizeHeight) / height);
        }

        context.resize({ width: resizeWidth, height: resizeHeight });
        hasActions = true;
    }

    if (cropToSquare && typeof width === 'number' && typeof height === 'number') {
        let squareSide = width;
        if (width !== height) {
            squareSide = width > height ? height : width;
            context.crop({
                width: squareSide,
                height: squareSide,
                originX: 0,
                originY: 0,
            });
            hasActions = true;
        }

        if (typeof squareSize === 'number' && squareSide > squareSize) {
            context.resize({ width: squareSize, height: squareSize });
            hasActions = true;
        }
    }

    if (!hasActions && !shouldConvertToWebp) {
        return uri;
    }

    const renderedImage = await context.renderAsync();
    const processedImage = await renderedImage.saveAsync({
        ...(shouldConvertToWebp ? { format: SaveFormat.WEBP } : {}),
    });

    return processedImage.uri;
}

export const uploadImage = async (uri, fetchUrl, calback, extraVar) => {
    const formData = new FormData();
    if (isWeb) {
        let fileType = '';
        let fileExt = '';
        if (uri.startsWith('data:')) {
            // Для data URI
            fileType = uri.split(';')[0].split(':')[1]; // MIME-тип
            fileExt = fileType.split('/')[1]; // Расширение
            if (fileExt == 'svg+xml') {
                fileExt = 'svg';
            }

        } else {
            const fileName = uri.split('/').pop(); // Имя файла
            fileExt = fileName.split('.').pop(); // Расширение
            fileType = `image/${fileExt}`; // MIME-тип
        }
        urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
            .then(async function (file) {
                const sizeMb = await getUploadSizeMb({ file, uri });
                console.log('upload file size:', (sizeMb * 1024 * 1024).toFixed(0), 'bytes', sizeMb.toFixed(2), 'MB');

                formData.append("file", file);
                const result = await fetcher([fetchUrl, null, formData]);
                if (result?.data?.link) {
                    calback({ result: result?.data?.link, extraVar: extraVar });
                }
                else {
                    calback({ result: result, extraVar: extraVar })
                }

            });
    }
    else {
        const formData = new FormData();
        const fileName = uri.split('/').pop();
        const fileType = uri.match(/\.([a-z0-9]+)$/i)[1];
        formData.append("file", {
            uri,
            name: fileName,
            type: `image/${fileType}`,
        });


        const result = await fetcher([fetchUrl, null, formData]);
        if (result?.data?.link) {
            calback({ result: result?.data?.link, extraVar: extraVar });
        }
        else {
            calback({ result: result, extraVar: extraVar })
        }
    }
};

export function visibilityById(visibility, t) {

    const visibilityOptions = {
        2: { icon: 'Lock', text: t('Me only') },
        3: { icon: 'Globe', text: t('Public') },
        5: { icon: 'UsersRound', text: t('Friends') },
        'c': { icon: 'EyeClosed', text: t('Closed') },
        's': { icon: 'Shield', text: t('Secret') },
        6: { icon: 'UserCheck', text: t('Specific Friends...') },
        7: { icon: 'Workflow', text: t('Relationships') },
        8: { icon: 'Workflow', text: t('Specific Relationships...') },
        9: { icon: 'Award', text: t('Specific Memberships...') },
    };

    return visibilityOptions[visibility] || null;
}

export function strToObj(s) {
    try {
        const jsonReadyString = s
            .replace(/\s*([{}[\],:])\s*/g, '$1') // Убираем пробелы вокруг {}, [], :, ,
            .replace(/([{,])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Оборачиваем ключи в двойные кавычки
            .replace(/'/g, '"') // Заменяем одинарные кавычки на двойные
            .replace(/,\s*}/g, '}') // Убираем конечные запятые перед }
            .replace(/,\s*]/g, ']') // Убираем конечные запятые перед ]
            .trim(); // Убираем пробелы в начале и конце строки
        const a = JSON.parse(jsonReadyString);
        return a
    } catch (error) {
        return null
    }
}

export function getPageSettings(config, uri) {
    return appSetting('layout', 'user_remote_config') && config ? strToObj(config) : appSetting('layouts', uri);
}

export function getMenuSettings(object, config, menu) {
    if (!appSetting('layout', 'user_remote_config'))
        return appSetting('menu_items', object);

    let a = {}
    if (appSetting('layout', 'user_remote_config') && config)
        a = strToObj(config);

    if (a && !a.name && menu?.title)
        a.name = menu.title;

    return a
}

export function genRnd(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

export function getIconByNameFromIconset(iconset, name) {
    let icon = iconset[name];
    if (!icon) {
        Object.keys(iconset).find((item) => {
            if (name.includes(item)) {
                icon = iconset[item];
                return true;
            }
        });
    }
    return icon;
}

export function getURI(url) {
    if (!url || !url.length || typeof (url) !== 'string')
        return false;

    let questionMarkIndex = url.indexOf("?");

    if (questionMarkIndex !== -1) {
        url = url.substring(0, questionMarkIndex);
    }

    let u = url.replace('page', '').split('/');
    u = u.filter(Boolean);
    return u[0]
}

const getNameFromSetting = (setting) => {
    if (typeof setting === 'string') {
        return setting;
    } else if (setting && typeof setting === 'object' && setting.name) {
        return setting.name;
    }
    return null;
};

export async function getDataForMenu(menu, callback) {
    const data = await fetcher(
        '/api.php?r=system/get_menu/TemplServices&params[]={"object":"' + menu?.object + '","params":' + JSON.stringify(menu?.params) + '}'
    )
    callback?.(data.data)
    return data.data
}

export function findIconFromRemote(s) {
    if (!s || /^[A-Z][^\s]*$/.test(s))
        return s;
    const data = appSetting('menu_items', 'iconset');
    for (let word of s.replace(/\bcol-\S*\b/g, '').trim().split(/\s+/)) {

        if (data[word]) {
            return data[word];
        }
    }

    return s;
}

export function menuItemsByNameNew(name, menu, currentUser, url = '') {
    return menuItemsByName(name, menu?.items, currentUser, url, menu?.config)
}

export function menuItemsByName(name, items, currentUser, url = '', config = null) {
    if (!items)
        return [];

    const menuSettings = getMenuSettings(name, config);//appSetting('menu_items', name)
    let menuSettingNames = []

    if (menuSettings) {
        if (menuSettings.items) {
            if (typeof menuSettings.items[0] === 'string') {
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettings.items.includes(item.name)) || (!!item.link && menuSettings.items.includes(getURI(item.link)))));
            }
            else {
                menuSettingNames = menuSettings.items.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));

                menuSettingNames = [];
                items = items.map(item1 => {
                    const item2 = menuSettings.items.find(item2 => item2.name === item1.name);
                    return item2 ? { ...item1, ...item2 } : item1;
                });
            }
        }
        else {
            if (menuSettings.items) {
                menuSettingNames = menuSettings.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));
            }
        }
        if (menuSettingNames) {
            items.forEach(item => {
                if (menuSettingNames.includes(item.name)) {
                    let matchedSettings = menuSettings.filter(item2 => item.name === item2.name);

                    if (matchedSettings.length > 0) {

                        item.settings = matchedSettings[0].settings;
                    }
                }
            });
        }

        return menuItemsFilter(items, currentUser);
    }
    if (!items)
        items = [{ link: url, title: '' }];


    return menuItemsFilter(items, currentUser);
}

export function menuItemsFilter(items, currentUser) {
    if (!items)
        return items;
    if (!currentUser) {
        items = items.filter(item => item.nonlogged !== false && item.nonoperator !== false);
    }
    else {
        items = items.filter(item => item.logged !== false);
        if (!currentUser.operator) {
            items = items.filter(item => item.nonoperator !== false);
        }

        items = items.filter(item => {
            return !item.membership_level || (item.membership_level & Math.pow(2, currentUser.membership)) == Math.pow(2, currentUser.membership)
        });
    }

    items = items.map(item => {
        if (item.link === '{studio}') {
            return { ...item, link: UNA_URL + '/studio/launcher.php' };
        }
        if (item.link === '{profile}') {
            return { ...item, link: currentUser?.url };
        }
        if (item?.link && item?.link?.includes("{profile_url_postfix}")) { // SHOULD BE IMPROVED by url_postfix

            return { ...item, link: item.link.replace("{profile_url_postfix}", currentUser?.url.replace('/view-persons-profile/', '')) };
        }
        return item;
    });
    return items;
}

export function filterContent(dataOrig, needed) {
    let data = cloneObject(dataOrig);
    for (let cell in data.elements) {
        data.elements[cell] = data.elements[cell].filter(obj => needed.includes(obj.source));
    }
    return data;
}

export const updateRouteDataForConnection = (endpoint, actions, object, currentRoute, layoutData, routes, index, setRoutes) => {
    if (currentRoute.endpoint?.request_url.includes(endpoint) && layoutData && layoutData.data && (layoutData?.type === 'сonnections:action' && actions.includes(layoutData?.data?.action?.a) && layoutData?.data?.action?.o === object)) {
        let clonedData = currentRoute.data;
        let cid = Array.isArray(layoutData?.data?.action?.cid) ? layoutData?.data?.action?.cid[0] : layoutData?.data?.action?.cid
        const data = clonedData.filter(item => item.id !== cid);
        const newRoutes = [...routes];
        newRoutes[index].data = data;
        setRoutes(newRoutes);
    }
};

export async function getPageData(url, codeOnly = false) {
    const pagePath = parseUrl(url);
    let sAdd = "";

    if (pagePath.queryString) {
        const params = Object.fromEntries(
            pagePath.queryString.split('&').map(param => param.split('='))
        );

        // this shit to fix double leveled params in feed form like 
        //?r=system/get_page_content_by_request/TemplServicePages&params[]=fanfeed-view/corey-dozier&params[]=&params[]=%7B%22params%22:%7B%22context_id%22:-17%7D%7D&lang=en
        //?r=system/get_page_content_by_request/TemplServicePages&params[]=page/timeline-view&params[]=&params[]=%7B%22profile_id%22:%221496%22,%22params[]%22:%22%7B\%22params\%22:%7B\%22context_id\%22:-17%7D%7D%22%7D&lang=en
        // on pages /crowd/football

        if (params['params[]']) {
            let a = JSON.parse(params['params[]']);
            if (a.params) {
                params = { ...params, ...a.params };
            }
            delete params['params[]'];
            sAdd = `&params[]=&params[]=${JSON.stringify({ params: params })}`;
        }
        else {
            sAdd = `&params[]=&params[]=${JSON.stringify(params)}`;
        }
    }

    const path = pagePath.path.startsWith('/') ? pagePath.path.slice(1) : pagePath.path;

    return await fetcher(
        `/api.php?r=system/get_page_${codeOnly ? 'content_' : ''}by_request/TemplServicePages&params[]=${path}${sAdd}`
    );
}

export function BlockDataByName(data, name) {

    if (!name) return null;

    return Object.values(data?.elements ?? {})
        .flatMap(level1 =>
            Object.values(level1).filter(item => item?.source === name.toString())
        )
        .find(Boolean) || null;
}

export function BlockDataByType(data, type) {
    if (!type) return null;

    return Object.values(data?.elements ?? {})
        .flatMap(level => Array.isArray(level) ? level : Object.values(level ?? {}))
        .find(block =>
            Array.isArray(block?.content) &&
            block.content.some(el => el?.type === type)
        ) || null;
}

export function getYouTubeVideoId(url) {
    const regex =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:(?:watch\?v=|v\/|embed\/|shorts\/|live\/)|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export function removeEmptyTags(html) {
    return html.replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, '');
}

export function isShowCover(cover, currentUser, url) {
    if (cover === null || cover === undefined || url == 'home')
        cover = 1;
    if (cover === 1) // for all
        return true;
    if (cover === 2 && !currentUser) // for visitors
        return true;
    if (cover === 3 && currentUser) // for logged
        return true;

    return false;
}


export const openExternalLink = async (finalHref) => {
    await WebBrowser.openBrowserAsync(finalHref);
};

export function sanitazeUrl(url) {
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
    const domain = getDomainFromUrl(finalHref);
    const rootUrl = appSetting('config', 'native_app_images_url');
    if (domain && domain === rootUrl) {
        finalHref = finalHref.replace(domain, '');
    }
    if (domain && domain !== rootUrl)
        return finalHref;

    return finalHref.startsWith('/') ? finalHref : `/${finalHref}`;
}

export function isExternalUrl(url) {
    const rootUrl = appSetting('config', 'native_app_images_url');
    const domain = getDomainFromUrl(url);
    return domain && domain !== rootUrl;
}

export const roundedClassToRadius = (roundedClass = '') => {
    const c = roundedClass.trim();
    if (c === 'rounded-full') return 9999;
    if (c === 'rounded-md') return 6;
    if (c === 'rounded-lg') return 8;
    if (c === 'rounded-xl') return 12;
    
    return 0;
  };