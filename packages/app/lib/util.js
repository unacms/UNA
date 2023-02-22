import * as Haptics from 'expo-haptics';

export function fetcher (mixed) {
    let url, token, data;
    
    if (Array.isArray(mixed)){
        [url, token, data] = mixed;
    }
    else{
        url = mixed;
    }
    return fetch(process.env.NEXT_PUBLIC_UNA_URL + url, {
        method: data ? 'post' : 'get',
        body: data ? data : null,
        headers:{
            Authorization: 'Bearer ' + token
        }
    }).then(r => r.json()).catch((error) => {
        console.log("Api call error: " + error.message);
    });
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