import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function fetcher (mixed) {
    return await fetcherRaw(process.env.NEXT_PUBLIC_UNA_URL, mixed).then(r => {
        return r.json();
    });
}

export async function fetcherRaw (host, mixed) {
    console.log(host + mixed)
    let path, token, data, origin, headers;

    // gen incoming variables
    if (Array.isArray(mixed)){
        [path, token, data, origin, headers] = mixed;
    }
    else {
        path = mixed;
    }
    if (undefined === headers)
        headers = {};

    // TODO: replace http://localhost:3000 with actual value
    // in case of login we need to set cookies on UNA domain (for CSR) and NEO domain (for SSR), so need to make 2 calls to different domains
    if ('web' === Platform.OS && process.env.NEXT_PUBLIC_UNA_URL === host && data && path.includes('system/login_form/') && !process.env.UNA_API_KEY) {
        const dataResubmit = await fetcherRaw ('http://localhost:3000/api', mixed).then(r => {        
            return r.text();
        });
    }

    // add token and origin headers when necessary
    if (token)
        headers['Authorization'] = 'Bearer ' + token;
    if (origin)
        headers['Origin'] = origin;
    else if ('web' !== Platform.OS)
        headers['Origin'] = 'neo://app';
    
    // perform fetch
    return fetch(host + path, {
        method: data ? 'POST' : 'GET',
        body: data ? data : null,
        headers: headers,
        credentials: 'include' // Set to true on UNA side - Access-Control-Allow-Credentials
    })
    .catch((error) => {
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

export function stripTags(s) {
    return s.replace(/(<([^>]+)>)/ig, '');
}