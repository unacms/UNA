import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import { settings } from 'app/settings';
import { stringMd5 } from 'react-native-quick-md5'; 
import pako from 'pako';
import { useTranslation } from 'react-i18next';

export function appSetting(section, name, path) {
    if (path)
        return settings[section] && settings[section][name] ? settings[section][name][path] : '';

    return settings[section] ? settings[section][name] : '';
}

export const getDataFromCache = (pref, storageKeyValue) => {
    if (appSetting('cache', 'list')){
        return storageGet(pref, storageKeyValue);
    }
    return false;
}

export function storageSet(pref, key, data, isLocal = false) {
    if (Platform.OS !== 'web') {
        /*const MMKV = new MMKVLoader().initialize(); 
        await MMKV.setStringAsync(`${pref}-${key}`, JSON.stringify(data));*/
    }
    else{
        const storage = isLocal ? localStorage : sessionStorage;
        const serializedData = appSetting('cache', 'compress') ? compress(data) : JSON.stringify(data);

        storage.setItem(`${pref}-${key}`, serializedData);
    }
}

export function storageGet(pref, key, isLocal = false) {
    if (Platform.OS !== 'web'){
      /*  const MMKV = new MMKVLoader().initialize(); 
        let storedData = await MMKV.getStringAsync(`${pref}-${key}`);
        console.log(storedData);
        console.log('----------------------------');
        console.log(JSON.parse(storedData));
        if (!storedData) return null;
        return JSON.parse(storedData);*/
    }
    else{
        const storage = isLocal ? localStorage : sessionStorage;
        const storedData = storage.getItem(`${pref}-${key}`);
        if (!storedData) return null;
        return appSetting('cache', 'compress') ? decompress(storedData) : JSON.parse(storedData);
    }
}

export function storageKey(url, useUrl = true) {
    //stringMd5
    if ( Platform.OS !== 'web')
        return ;
    
    let s = url;
    if (!useUrl)
        s = url;
        //stringMd5
    return (s);
} 

export function storageClear(pref, key) {
    if ( Platform.OS !== 'web')
        return ;
    
    sessionStorage.clear();
} 


function compress(data) {
    try {
        return Buffer.from(pako.deflate(JSON.stringify(data))).toString('base64');
    } catch (error) {
        console.error('Compression error:', error);
        return null;
    }
}

function decompress(data) {
    try {
        return JSON.parse(pako.inflate(Uint8Array.from(Buffer.from(data, 'base64')), { to: 'string' }));
    } catch (error) {
        console.error('Decompression error:', error);
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

export function getRandomColor(str) {
    if (!str)
        str ='a';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    var arr = ['rose', 'red', 'amber', 'lime', 'emerald', 'cyan', 'blue', 'violet', 'fuchsia', 'stone'];
    return arr[Math.abs(hash % 10)];
}

export function getHeaderSettings(uri, width) {
    let settings = appSetting('layouts', uri)

    const bBackButton = typeof settings?.headerSettings?.backButton !== 'undefined' ? settings.headerSettings.backButton : true;

    let bHeader = typeof settings?.headerSettings?.header !== 'undefined' ? settings.headerSettings.header: true;

    let bFooter = typeof settings?.headerSettings?.footer !== 'undefined' ? settings.headerSettings.header: true;
    if (width > 1024)
        bHeader = true;

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' ? settings.headerSettings.menu : false;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' ? settings.headerSettings.title : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' ? settings.headerSettings.offset : true;

    let sCover = typeof settings?.headerSettings?.cover !== 'undefined' ? settings.headerSettings.cover : 'full';

    if (width >= 1024)
        bOffset = true;

    return {
        backButton: bBackButton,
        header: bHeader,
        menu: bMenu,
        title: bTitle,
        offset: bOffset,
        footer: bFooter,
        cover: sCover
    }
}

export function getUnitModeBySource(source){
    if (!source)
        return 'default';

    if (source.includes('system/browse_friends'))
        return 'person_friends';

    if (source.includes('system/browse_recommendations_friends'))
        return 'person_friends_recommendations';
        
    if (source.includes('system/browse_friend_requested'))
        return 'person_friend_requested';
    
    if (source.includes('system/browse_friend_requests'))
        return 'browse_friend_requests';

    if (source.includes('system/browse_recommendations_subscriptions'))
        return 'person_following_recommendations';

    if (source.includes('system/browse_subscribed_me'))
        return 'person_followers';

    if (source.includes('browse_subscriptions'))
        return 'person_following';
    
    if (source.includes('r=bx_events'))
        return 'event';    
    
    if (source.includes('r=bx_groups'))
        return 'group';       
        
    return 'default';
}


export function truncateHTML(text, length) {
    if (!text)
        return '';
    var truncated = text.substring(0, length);
    // Remove line breaks and surrounding whitespace
    truncated = truncated.replace(/(\r\n|\n|\r)/gm,"").trim();
    // If the text ends with an incomplete start tag, trim it off
    truncated = truncated.replace(/<(\w*)(?:(?:\s\w+(?:={0,1}(["']{0,1})\w*\2{0,1})))*$/g, '');
    // If the text ends with a truncated end tag, fix it.
    var truncatedEndTagExpr = /<\/((?:\w*))$/g;
    var truncatedEndTagMatch = truncatedEndTagExpr.exec(truncated);
    if (truncatedEndTagMatch != null) {
        var truncatedEndTag = truncatedEndTagMatch[1];
        // Check to see if there's an identifiable tag in the end tag
        if (truncatedEndTag.length > 0) {
            // If so, find the start tag, and close it
            var startTagExpr = new RegExp(
                "<(" + truncatedEndTag + "\\w?)(?:(?:\\s\\w+(?:=([\"\'])\\w*\\2)))*>");
            var testString = truncated;
            var startTagMatch = startTagExpr.exec(testString);

            var startTag = null;
            while (startTagMatch != null) {
                startTag = startTagMatch[1];
                testString = testString.replace(startTagExpr, '');
                startTagMatch = startTagExpr.exec(testString);
            }
            if (startTag != null) {
                truncated = truncated.replace(truncatedEndTagExpr, '</' + startTag + '>');
            }
        } else {
            // Otherwise, cull off the broken end tag
            truncated = truncated.replace(truncatedEndTagExpr, '');
        }
    }
    // Now the tricky part. Reverse the text, and look for opening tags. For each opening tag,
    //  check to see that he closing tag before it is for that tag. If not, append a closing tag.
    var testString = reverseHtml(truncated);
    var reverseTagOpenExpr = /<(?:(["'])\w*\1=\w+ )*(\w*)>/;
    var tagMatch = reverseTagOpenExpr.exec(testString);
    while (tagMatch != null) {
        var tag = tagMatch[0];
        var tagName = tagMatch[2];
        var startPos = tagMatch.index;
        var endPos = startPos + tag.length;
        var fragment = testString.substring(0, endPos);
        // Test to see if an end tag is found in the fragment. If not, append one to the end
        //  of the truncated HTML, thus closing the last unclosed tag
        if (!new RegExp("<" + tagName + "\/>").test(fragment)) {
            truncated += '</' + reverseHtml(tagName) + '>';
        }
        // Get rid of the already tested fragment
        testString = testString.replace(fragment, '');
        // Get another tag to test
        tagMatch = reverseTagOpenExpr.exec(testString);
    }
    return truncated;
}

function reverseHtml(str) {
    var ph = String.fromCharCode(206);
    var result = str.split('').reverse().join('');
    while (result.indexOf('<') > -1) {
        result = result.replace('<',ph);
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

    if (url.includes('//')){
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

export function getImageSizes(){
    const perLineSettings = appSetting('browse', 'per_line');
    let str ="";
    for (let i = perLineSettings.length - 1; i >= 0; i--) {

        if (i == perLineSettings.length - 1)
            str += " (max-width:" + perLineSettings[i].width + "px) 100vw, ";
        else{

            str += "(max-width:" + perLineSettings[i].width + "px) "+Math.round(100/perLineSettings[i+1].count)+"vw, ";
        }
    }
    str += '' + (1280/perLineSettings[0].count) + 'px';
    return str
}

function getPlural(key, count) {
    
    let lastDigit = count % 10;
    let lastTwoDigits = count % 100;

    if (count == 0)
        return key + '_0'; 

    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return key+ '_1'; 
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
        ct ='';
    return _t(getPlural(key, count), {count: ct});
}

export function linkify2(text) {
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
    let matches = Array.from(text.matchAll(urlRegex)).reverse();
    return matches[0] ? matches[0][0] : null;
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function clearLinks(text) {
    if (!text)
        return text;
    const rootUrl = appSetting('urls', 'root');
    const regex = new RegExp(escapeRegExp(rootUrl), 'g');
    return text.replace(regex, '/');
}

export function linkify(text, attrs = '', htmlSpecialChars = false) {
    return clearLinks(text);
    // todo improve
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
  
  const anchorRegex = /<a [^>]*>[^<]*<\/a>/g;
  
  const anchors = [...text.matchAll(anchorRegex)];
  
  if (htmlSpecialChars)
    text = text.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m]));

  let matches = Array.from(text.matchAll(urlRegex)).reverse();

  matches.forEach(match => {
    let url = match[0];
    let attrsLocal = attrs;

    let withinAnchor = anchors.some(anchor => match.index > anchor.index && match.index < anchor.index + anchor[0].length);
    if(withinAnchor) return;
    
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
    if(withinAnchor) return;
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
    if (bWeb) return ;
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
        return s.replace(/(<([^>]+)>)/ig, '');
    
    return s;
}

export function stripTagsWithLinks(s) {
    var allowed = ['a', 'p'];
    if (s)
        return s.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, function (_, tag) {
            return allowed.includes(tag.toLowerCase()) ? _ : '';
        });
        
    return s;
}

function urltoFile(url, filename, mimeType){
    return (fetch(url)
        .then(function(res){return res.arrayBuffer();})
        .then(function(buf){return new File([buf], filename,{type:mimeType});})
    );
}

export const uploadImageFile = async (file, fetchUrl, calback, extraVar) => {
    const isWeb = Platform.OS == 'web'
    const formData = new FormData();

    formData.append("file", file);
    const result = await fetcher([fetchUrl, null, formData]);
    if (result?.data?.link){
        calback(result?.data?.link, extraVar);
    }
    else{
        calback(result, extraVar)
    }
}

export const uploadImage = async (uri, fetchUrl, calback, extraVar) => {
    const isWeb = Platform.OS == 'web'
    const formData = new FormData();
    if (isWeb){
        const fileExt = uri.split(';').shift().split('/').pop();
        const fileType = uri.split(';').shift().split(':').pop();
        urltoFile(uri, genRnd(8) + '.' + fileExt, fileType)
        .then(async function(file){
            formData.append("file", file);
            const result = await fetcher([fetchUrl, null, formData]);
            if (result?.data?.link){
                calback(result?.data?.link, extraVar);
            }
            else{
                calback(result, extraVar)
            }
                
        });
    }
    else{
        const formData = new FormData();
        const fileName = uri.split('/').pop();
        const fileType = uri.match(/\.([a-z]+)$/i)[1];

        formData.append("file",  {
            uri,
            name: fileName,
            type: `image/${fileType}`,
        });

        const result = await fetcher([fetchUrl, null, formData]);
        if (result?.data?.link){
            calback(result?.data?.link, extraVar);
        }
        else{
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

export function getURI(url) {
    if(!url || !url.length || typeof(url) !== 'string')
        return false;

    let questionMarkIndex = url.indexOf("?");

    if (questionMarkIndex !== -1) {
      url = url.substring(0, questionMarkIndex);
    }

    let u = url.replace('page','').split('/');
    u = u.filter(Boolean);
    return u[0]
}

export function menuItemsByName(name, items, url = '') {
    if (!items)
        return [];
    const menuSettings = appSetting('menu_items', name)
    if (menuSettings){
        if (menuSettings.items){
            return items.filter((item) => (!!item.name && menuSettings.items.includes(item.name)) || (!!item.link && menuSettings.items.includes(getURI(item.link))));
        }
        else
            return items.filter((item) => (!!item.name && menuSettings.includes(item.name)) || (!!item.link && menuSettings.includes(getURI(item.link))));
    }
    if (!items)
        items =[{link: url, title: ''}];
    return items;
}

export function filterContent(dataOrig, needed) {
    let data = JSON.parse(JSON.stringify(dataOrig));
    for (let cell in data.elements) {
        data.elements[cell] = data.elements[cell].filter(obj => needed.includes(obj.source));
    }
    return data;
}

