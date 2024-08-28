import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import { stringMd5 } from 'react-native-quick-md5';
import pako from 'pako';
import { useTranslation } from 'react-i18next';
//import AsyncStorage from '@react-native-async-storage/async-storage';
//import Clipboard from '@react-native-community/clipboard';
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { appSetting as setting, UNA_URL, APP_URL } from 'app/config';
import { remoteSettings } from 'app/settings-remote';
import { parse as flatted_parse, stringify as flatted_stringify } from 'flatted';

const nativeCache = [];

export function appSetting(section, name, path) {
    return setting(section, name, path, remoteSettings.data);
}

export function compare_objects(obj, obj2) {
    return flatted_stringify(obj) == flatted_stringify(obj2)
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
    if (Platform.OS !== 'web') {
        return await Clipboard.getString();
    }
    else {
        return await navigator.clipboard.readText();
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
    if (Platform.OS !== 'web') {
        Clipboard.setString(str);
    }
    else {
        await navigator.clipboard.writeText(str);
    }
}

export function absoluteApiUrl(url_name) {
    return appSetting("config", "una_url") + appSetting("urls", url_name);
}

export function clearNotif(currentUser, setCurrentUser) {


    if (currentUser?.notifications > 0) {

        setCurrentUser(prevUser => ({
            ...prevUser,
            notifications: 0,
        }));

        const clearNotifications = async () => {
            console.log("ClearNotif", currentUser);
            await fetcher('/api.php?r=bx_notifications/mark_as_read/')
        }

        clearNotifications();



    }
}

export const getDataFromCache = (pref, storageKeyValue) => {
    if (appSetting('cache', 'list') && Platform.OS == 'web') {
        return storageGet(pref, storageKeyValue);
    }
    return false;
}

export function storageSet(pref, key, data, isLocal = false) {

    if (Platform.OS !== 'web') {
        if (!isLocal && pref == 'layout:shmo') {
            nativeCache[pref + '-' + key] = JSON.stringify(data);
            //  await AsyncStorage.setItem(`${pref}-${key}`, serializedData);
        }
    }
    else {
        const serializedData = appSetting('cache', 'compress') ? compress(data) : JSON.stringify(data);
        const storage = isLocal ? localStorage : sessionStorage;
        storage.setItem(`${pref}-${key}`, serializedData);
    }
}

export function storageGet(pref, key, isLocal = false) {
    if (Platform.OS !== 'web') {
        if (!isLocal && pref == 'layout:shmo') {
            if (nativeCache[pref + '-' + key])
                return nativeCache[pref + '-' + key]
        }
        // return await AsyncStorage.getItem(`${pref}-${key}`);
    }
    else {
        const storage = isLocal ? localStorage : sessionStorage;
        const storedData = storage.getItem(`${pref}-${key}`);
        if (!storedData) return null;
        return appSetting('cache', 'compress') ? decompress(storedData) : JSON.parse(storedData);
    }
}

export function storageKey(url, useUrl = true) {
    //stringMd5
    if (Platform.OS !== 'web')
        return;

    let s = url;
    if (!useUrl)
        s = url;
    //stringMd5
    return (s);
}

export function storageClear(pref, key) {
    if (Platform.OS !== 'web')
        return;

    sessionStorage.clear();
}

export function storageRemove(pref, key, isLocal = false) {
    if (Platform.OS !== 'web') {

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
    return stringMd5(str);
}

export function getPageWidth(uri) {
    let settings = appSetting('layouts', uri)
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
    var arr = appSetting('layout', 'profile_colors')
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

export function getHeaderSettings(uri, width, layout) {
    let settings = appSetting('layouts', uri);
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
    if (width > 1024) {
        bHeader = true;
    }

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' ? settings.headerSettings.menu : true;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' ? settings.headerSettings.title : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' ? settings.headerSettings.offset : true;

    let sCover = typeof settings?.headerSettings?.cover !== 'undefined' ? settings.headerSettings.cover : 'full';

    let sColumns = typeof settings?.headerSettings?.columns !== 'undefined' ? settings.headerSettings.columns : '';

    let bHideLeftmenu = typeof settings?.headerSettings?.hideLeftmenu !== 'undefined' ? settings.headerSettings.hideLeftmenu : false;
    let bShowAltTopMenu = typeof settings?.headerSettings?.showAltTopMenu !== 'undefined' ? settings.headerSettings.showAltTopMenu : false;

    if (width >= 1024)
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

export function getUnitModeBySource(source) {
    if (!source)
        return 'default';

    let unit_by_source = appSetting('menu_meta', 'unit_by_source');

    for (let key in unit_by_source) {
        if (source.includes(key))
            return unit_by_source[key];
    }

    return 'default';
}


export function truncateHTML(html, maxLength) {
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
    str += '' + (1280 / perLineSettings[0].count) + 'px';
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

export function linkify2(text) {
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
    let matches = Array.from(text.matchAll(urlRegex)).reverse();
    for (let match of matches) {
        if ([APP_URL, UNA_URL].every(domain => !match[0].includes(domain))) {
            return match[0];
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
    return clearLinks(text);
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
    const bWeb = Platform.OS === 'web';
    if (bWeb) return;
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
    const emojiRegex = /\p{Emoji}|\p{Extended_Pictographic}/u;

    return !!s.match(emojiRegex);
}

export function stripTags(s) {
    if (s)
        return String(s).replace(/(<([^>]+)>)/ig, '').replace(/\s+/g, ' ');

    return s;
}

export function stripTagsWithLinks(s) {
    if (s)
        return String(s).replace(/<(?!\/?(a|p|br)(?=>|\s.*>))\/?.*?>/ig, '').replace(/\s+/g, ' ');

    return s;
}

function urltoFile(url, filename, mimeType) {
    return (fetch(url)
        .then(function (res) { return res.arrayBuffer(); })
        .then(function (buf) { return new File([buf], filename, { type: mimeType }); })
    );
}

export const uploadImageFile = async (file, fetchUrl, calback, extraVar) => {
    const isWeb = Platform.OS == 'web'
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
    const isWeb = Platform.OS == 'web'
    const formData = new FormData();
    if (isWeb) {
        const fileExt = uri.split(';').shift().split('/').pop();
        const fileType = uri.split(';').shift().split(':').pop();
        urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
            .then(async function (file) {
                formData.append("file", file);
                const result = await fetcher([fetchUrl, null, formData]);
                if (result?.data?.link) {
                    calback(result?.data?.link, extraVar);
                }
                else {
                    calback(result, extraVar)
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
            calback(result?.data?.link, extraVar);
        }
        else {
            calback(result, extraVar)
        }
    }
};

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
    // if (layoutName != 'profile' && layoutName != 'navigator')
    //   return currentUser ? appSetting('layout', 'format') :  appSetting('layout', 'format_guest');
    let a = storageGet('layout:format', '', true);
    if (!a)
        return appSetting('layout', 'format');

    return a;
}

export function menuItemsByName(name, items, currentUser, url = '') {
    if (!items)
        return [];
    const menuSettings = appSetting('menu_items', name)
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

        return items;
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