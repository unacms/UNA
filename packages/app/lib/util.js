import * as Haptics from 'expo-haptics';
import { settings } from 'app/settings';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';

export function appSetting(section, name, path) {
    if (path)
        return settings[section] && settings[section][name] ? settings[section][name][path] : '';

    return settings[section] ? settings[section][name] : '';
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

