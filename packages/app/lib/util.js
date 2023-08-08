import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import { settings } from 'app/settings';
import { stringMd5 } from 'react-native-quick-md5'; 
import pako from 'pako';

export function appSetting(section, name, path) {
    if (path)
        return settings[section] && settings[section][name] ? settings[section][name][path] : '';

    return settings[section] ? settings[section][name] : '';
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

export function getHeaderSettings(uri, width) {
    let settings = appSetting('layouts', uri)

    const bBackButton = typeof settings?.headerSettings?.backButton !== 'undefined' 
    ? settings.headerSettings.backButton 
    : true;

    let bHeader = typeof settings?.headerSettings?.header !== 'undefined' 
    ? settings.headerSettings.header 
    : true;
    if (width > 1024)
        bHeader = true;

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' 
    ? settings.headerSettings.menu 
    : false;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' 
    ? settings.headerSettings.title 
    : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' 
    ? settings.headerSettings.offset 
    : true;
    
    if (width > 1024)
        bOffset = true;

    return {
        backButton: bBackButton,
        header: bHeader,
        menu: bMenu,
        title: bTitle,
        offset: bOffset
    }
}

export function storageKey(url, useUrl = true) {
    //stringMd5
    if ( Platform.OS !== 'web')
        return ;
    
    let s = window.location.href + '-' + url;
    if (!useUrl)
        s = url;
        //stringMd5
    return (s);
} 

export function storageSet(pref, key, data) {
    if ( Platform.OS !== 'web')
    return ;

    sessionStorage.setItem(pref + '-' + key, appSetting('cache', 'compress') ? Buffer.from(pako.deflate(JSON.stringify(data))).toString('base64') : JSON.stringify(data));    
}

export function storageGet(pref, key) {
    if ( Platform.OS !== 'web')
        return ;

    const s = sessionStorage.getItem(pref + '-' + key);
    if (!s) return;
    return appSetting('cache', 'compress') ? JSON.parse(pako.inflate(Uint8Array.from(Buffer.from(s, 'base64')), { to: 'string' })) : JSON.parse(s);

} 

export function storageClear(pref, key) {
    sessionStorage.clear();
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
    for (let i = perLineSettings.length-1; i >= 0; i--) {

        if (i == perLineSettings.length-1)
            str += " (max-width:" + perLineSettings[i].width + "px) 100vw, ";
        else{

            str += "(max-width:" + perLineSettings[i].width + "px) "+Math.round(100/perLineSettings[i+1].count)+"vw, ";
        }
    }
    str += '' + (1280/perLineSettings[0].count) + 'px';
    return str
}

export function linkify2(text) {
    const urlRegex = /\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]*)*))/g;
    let matches = Array.from(text.matchAll(urlRegex)).reverse();
    return matches[0] ? matches[0][0] : null;
}

export function linkify(text, attrs = '', htmlSpecialChars = false) {
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

