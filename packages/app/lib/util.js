import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
//import { stringMd5 } from 'react-native-quick-md5';
import * as Crypto from 'expo-crypto';
import pako from 'pako';
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { appSetting as setting, UNA_URL, APP_URL } from 'app/config';
import { remoteSettings } from 'app/settings-remote';
import { parse as flatted_parse, stringify as flatted_stringify } from 'flatted';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import * as RNLocalize from "react-native-localize";

const nativeCache = [];
const isWeb = Platform.OS === 'web'

export const LAYOUT_BREAKPOINTS = {
    xl: 1280,
    lg: 1024, 
    md: 768,  
    sm: 640   
  };

export function appSetting(section, name, path) {
    return setting(section, name, path, remoteSettings.data);
}


export function isObjectsEqual(obj, obj2) {
    return flatted_stringify(obj) == flatted_stringify(obj2)
}

export async function subscribeOneSignal(currentUser, askPermission = false) {
    if (!isWeb){
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        OneSignal.initialize(appSetting('config', 'api_keys', 'onesignal'));

        let permissionStatus = await OneSignal.Notifications.getPermissionAsync();
        
        if (!permissionStatus && askPermission) {
            await OneSignal.Notifications.requestPermission(true);
            permissionStatus = await OneSignal.Notifications.getPermissionAsync(); 
        }

        if (permissionStatus) {
            await OneSignal.login(String(currentUser.id));
            await OneSignal.User.addTag("user_hash", String(currentUser.hash));
        }
    }
}

export function detectLang() {
    const selectedLang = storageGet('layout:lang', '', true) || 'system'
    let currentSystemLang = 'en';
    const locales = RNLocalize.getLocales();
    let langs = appSetting('dashboard', 'langs');
    if (locales && locales.length > 0) {
        if (langs.includes(locales[0].languageCode)) {
            currentSystemLang = locales[0].languageCode;
        }
    }

    return [selectedLang && selectedLang != 'system' ? selectedLang : currentSystemLang, selectedLang];
}

export function normalizeClasses(a) {
    if (!a) return a
    return isWeb ? a : a.replace(/\b\S*(hover|focus|active|group|duration|group-hover):\S*\b/g, "") .replace(/\s{2,}/g, " ").trim();
}

export function decodeText(str) {
    return decode(str);
}
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
    else{
        AsyncStorage.setItem(key, data);
    }
}

export async function asyncStorageGet(key) {
    if (isWeb) {
        return storageGet(key, '', true);
    }
    else{
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
        if (typeof localStorage !== 'undefined'){
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
        if (typeof localStorage !== 'undefined'){
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

export const formatDate = (date, t)  => {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = t(monthNames[date.getMonth()]);
    let year = date.getFullYear();
    if (year == new Date().getFullYear()) 
        year ='';
    return `${day} ${month} ${year}`;
}

export const formatDate2 = (date, t)  => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isToday = now.getFullYear() === date.getFullYear() &&
                    now.getMonth() === date.getMonth() &&
                    now.getDate() === date.getDate();
    if (isToday)
        return "Today "

    const isTomorrow = tomorrow.getFullYear() === date.getFullYear() &&
    tomorrow.getMonth() === date.getMonth() &&
    tomorrow.getDate() === date.getDate();

    if (isTomorrow)
        return "Tomorrow ";

    return formatDate(date, t)
}

export const formatTime = (ts)  => {
    const date = new Date(ts * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Return an empty string if the time is exactly midnight
    if (hours === 0 && minutes === 0) {
        return '';
    }

    // Format hours and minutes with leading zeros if needed
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const formatDateInterval = (dateStart, dateEnd, t) => {
    const isSingleDate = (new Date(dateStart * 1000)).toLocaleDateString() === (new Date(dateEnd * 1000)).toLocaleDateString();
    const isSingleTime = (new Date(dateStart * 1000)).toLocaleTimeString() === (new Date(dateEnd * 1000)).toLocaleTimeString();

    let sRv = formatDate2(new Date(dateStart * 1000), t);

    if (isSingleDate) {
        sRv += isSingleTime ? formatTime(dateStart) : `${formatTime(dateStart)} - ${formatTime(dateEnd)}`;
    } else {
        sRv += ' ' + formatTime(dateStart) + ' - ' + formatDate2(new Date(dateEnd * 1000), t) +' '+ formatTime(dateEnd);
    }

    return sRv;
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
        return Buffer.from(pako.deflate(a)).toString('base64');
    } catch (error) {
        console.log('!!!-Compression error:', data, error);
        return null;
    }
}

function decompress(data) {
    try {
        return flatted_parse(pako.inflate(Uint8Array.from(Buffer.from(data, 'base64')), { to: 'string' }));
    } catch (error) {
        console.log('!!!-Decompression error:', error, error);
        return null;
    }
}

export function md5(str) {
    //stringMd5(str); from react-native-quick-md5
    return Crypto.randomUUID();
}
export async function md52(str) {
    return  await Crypto.digestStringAsync(
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

export function getAlert(type, data) {
    /*
    сonnections:action
    feed:new_content
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
    Object.keys(data?.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            blocks['block' + data.elements[key][key2].id] = { name: data.elements[key][key2].source, showPad: true }
            if (data.elements[key][key2] && Array.isArray(data.elements[key][key2].content) && data.elements[key][key2].content[0] && data.elements[key][key2].content[0].type != 'browse') {
                blocks['block' + data.elements[key][key2].id].perLine = 1
            }
        })
    })
    return blocks;
}

export function getHeaderSettings(uri, width, layout, config) {
    let settings = getPageSettings(config, uri);
    
    if (!settings?.headerSettings) {
        if (layout == 'navigator') {
            settings = { headerSettings: { offset: false, header: false, backButton: false, menu: true, footer: false } }
        }
        if (layout == 'messenger') {
            settings = { headerSettings: { offset: false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (layout == 'profile') {
            settings = { headerSettings: { offset: false, header: false, footer: false } }
        }
    }

    const bBackButton = typeof settings?.headerSettings?.backButton !== 'undefined' ? settings.headerSettings.backButton : true;

    let bHeader = typeof settings?.headerSettings?.header !== 'undefined' ? settings.headerSettings.header : true;

    let bFooter = typeof settings?.headerSettings?.footer !== 'undefined' ? settings.headerSettings.footer : true;
    if (width > LAYOUT_BREAKPOINTS.lg) {
        bHeader = true;
    }

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' ? settings.headerSettings.menu : true;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' ? settings.headerSettings.title : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' ? settings.headerSettings.offset : false;

    let sCover = typeof settings?.headerSettings?.cover !== 'undefined' ? settings.headerSettings.cover : 'full';

    let sColumns = typeof settings?.headerSettings?.columns !== 'undefined' ? settings.headerSettings.columns : '';

    let bHideLeftmenu = typeof settings?.headerSettings?.hideLeftmenu !== 'undefined' ? settings.headerSettings.hideLeftmenu : false;
    let bShowAltTopMenu = typeof settings?.headerSettings?.showAltTopMenu !== 'undefined' ? settings.headerSettings.showAltTopMenu : false;

    // Apply offset on all viewports, not just larger ones PLAESE DONT CHANGE IT
    if (width >= LAYOUT_BREAKPOINTS.lg) 
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
        showAltTopMenu: bShowAltTopMenu
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

    if (endpoint?.params?.type == 'context'){
        return 'context';
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

export function truncateHTML(html, maxLength) {
    if (!html) return '';

    let textLength = 0;
    let truncated = '';
    
    // Регулярное выражение для поиска тегов и текстовых фрагментов
    const tagOrTextRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi;
    let match;

    // Стек для отслеживания открытых тегов
    const tags = [];

    // Идем по HTML и обрезаем текстовый контент до maxLength
    while ((match = tagOrTextRegex.exec(html))) {
        const part = match[0];
        
        if (part[0] === '<') {
            // Если это тег, проверяем открывающий или закрывающий
            const tagName = match[1];
            const isClosingTag = part[1] === '/';

            if (!isClosingTag && !/br|hr|img|input|link|meta|area|base|col|command|embed|keygen|param|source|track|wbr/.test(tagName)) {
                tags.push(tagName);
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
            const remainingLength = maxLength - textLength;

            if (part.length > remainingLength) {
                // Обрезаем текст, если он превышает оставшуюся длину
                truncated += part.substring(0, remainingLength);
                textLength += remainingLength;
                break;
            } else {
                // Добавляем весь текст, так как он не превышает maxLength
                truncated += part;
                textLength += part.length;
            }
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

export function getImageSizes() {
    const perLineSettings = appSetting('browse', 'per_line');
    let str = "";
    for (let i = perLineSettings.length - 1; i >= 0; i--) {

        if (i == perLineSettings.length - 1)
            str += " (max-width:" + perLineSettings[i].width + "px) 100vw, ";
        else {

            str += "(max-width:" + perLineSettings[i].width + "px) " + Math.round(100 / perLineSettings[i + 1].count) + "vw, ";
        }
    }
    str += '' + (LAYOUT_BREAKPOINTS.xl / perLineSettings[0].count) + 'px';
    return str
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
    const { t: _t } = useTranslation();
    let ct = count;
    if (isHideData)
        ct = '';
    return _t(getPlural(key, count), { count: ct });
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

export function FeedbackHaptics(type) {
    if (isWeb) return;
    //https://docs.expo.dev/versions/latest/sdk/haptics/
    switch (type) {
        case 'Success':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            )
            break;
        case 'Error':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            )
            break;
        case 'Warning':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
            )
            break;
        case 'Select':
            Haptics.selectionAsync();
            break;
        case 'Light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            break;
        case 'Medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            break;
        case 'Heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            break;

    }
}

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
                        const ext = mimeType.split('/')[1] || 'bin';
                        filename = `${rawFilename || defaultFilename}.${ext}`;
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

export const uploadImage = async (uri, fetchUrl, calback, extraVar) => {
    const formData = new FormData();
    if (isWeb) {
        let fileType = '';
        let fileExt = '';
        if (uri.startsWith('data:')) {
            // Для data URI
            fileType = uri.split(';')[0].split(':')[1]; // MIME-тип
            fileExt = fileType.split('/')[1]; // Расширение
            
        } else {
            // Для локального пути или URL
            
            const fileName = uri.split('/').pop(); // Имя файла
            fileExt = fileName.split('.').pop(); // Расширение
            fileType = `image/${fileExt}`; // MIME-тип
        }
        urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
            .then(async function (file) {
                formData.append("file", file);
                const result = await fetcher([fetchUrl, null, formData]);
                if (result?.data?.link) {
                    console.log('555', result)
                    calback({result:result?.data?.link, extraVar:extraVar});
                }
                else {
                    calback({result:result, extraVar:extraVar})
                }

            });
    }
    else {
        const formData = new FormData();
        console.log("555")
        const fileName = uri.split('/').pop();
        const fileType = uri.match(/\.([a-z0-9]+)$/i)[1];
        formData.append("file", {
            uri,
            name: fileName,
            type: `image/${fileType}`,
        });

        
        const result = await fetcher([fetchUrl, null, formData]);
        console.log("result", result)
        if (result?.data?.link) {
            calback({result:result?.data?.link, extraVar:extraVar});
        }
        else {
            calback({result:result, extraVar:extraVar})
        }
    }
};

export function visibilityById(visibility, t) {
    
    const visibilityOptions = {
        2: { icon: 'Lock', text: t('Me only') },
        3: { icon: 'Globe', text: t('Public') },
        5: { icon: 'Users', text: t('Friends') },
        'c': { icon: 'EyeClosed', text: t('Closed') },
        's': { icon: 'Shield', text: t('Secret') },
        6: { icon: 'UserCheck', text: t('Specific Friends...') },
        7: { icon: 'Workflow', text: t('Relationships') },
        8: { icon: 'Workflow', text: t('Specific Relationships...') },
        9: { icon: 'Award', text: t('Specific Memberships...') },
    };
    
    return  visibilityOptions[visibility] || null;
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

export function getLayout(currentUser, layoutName = '') {
    let a = storageGet('layout:format', '', true);
    if (!a)
        return appSetting('layout', 'default_layout');

    return a;
}

export async function getDataForMenu(menu, callback) {
    const data = await fetcher(
        '/api.php?r=system/get_menu/TemplServices&params[]={"object":"' + menu?.object + '","params":' + JSON.stringify(menu?.params) + '}'
    )
    callback(data.data)
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
        if (item?.link && item?.link?.includes("{profile_url_postfix}") ) { // SHOULD BE IMPROVED by url_postfix
           
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

export function handleFeedLayoutData(layoutData, data) {

    if (layoutData && layoutData?.type == 'feed:new_content') {
        if (layoutData.data?.id) {
            let insertIndex = data.findIndex(item => item.type !== 'block');
            if (insertIndex === -1) {
                data.splice(data.length, 0, layoutData.data);
            }
            else {
                data.splice(insertIndex, 0, layoutData.data);
            }
        }
        if (Array.isArray(layoutData.data)) {
            let insertIndex = data.findIndex(item => item.type !== 'block');
            if (insertIndex === -1) {
                data.splice(data.length, 0, ...layoutData.data);
            }
            else {
                data.splice(insertIndex, 0, ...layoutData.data);
            }
        }
    }
    if (layoutData && layoutData?.type == 'feed:remove_content') {
        data = data.filter(item => item.id !== layoutData.data);
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

export async function getPageData(url) {
    const pagePath = parseUrl(url);
    let sAdd = "";

    if (pagePath.queryString) {
        const params = Object.fromEntries(
            pagePath.queryString.split('&').map(param => param.split('='))
        );
        sAdd = `&params[]=&params[]=${JSON.stringify(params)}`;
    }

    return await fetcher(`/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${pagePath.path}${sAdd}`);
}

export function BlockDataByName(data, name) {

    let b = null;
    if (name){
        const blockName = name;
        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content){
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if(data.elements[key][key2].source == blockName.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });
    }
    return b;
}

export function getYouTubeVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

export function removeEmptyTags(html) {
    return html.replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, '');
}

export function isShowCover(cover, currentUser) {
    if (cover === null || cover === undefined)
        cover = 1;
    if (cover === 1) // for all
        return true;
    if (cover === 2 && !currentUser) // for visitors
        return true;
    if (cover === 3 && currentUser) // for logged
        return true;

    return false;
}