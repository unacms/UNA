import * as Haptics from 'expo-haptics';
import { settings } from 'app/settings';
import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';

export function appSetting(section, name, path) {
    if (path)
        return settings[section] ? settings[section][name][path] : '';
    return settings[section] ? settings[section][name] : '';
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

    }
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function stripTags(s) {
    if (s)
        return s.replace(/(<([^>]+)>)/ig, '');
        
    return s;
}

function urltoFile(url, filename, mimeType){
    return (fetch(url)
        .then(function(res){return res.arrayBuffer();})
        .then(function(buf){return new File([buf], filename,{type:mimeType});})
    );
}

export const uploadImage = async (uri, fetchUrl, calback) => {
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
                calback(result?.data?.link);
            }
            else{
                calback()
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
        console.log(result?.data?.link)
        if (result?.data?.link){
            calback(result?.data?.link);
        }
        else{
            calback()
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
