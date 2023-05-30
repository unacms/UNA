import Constants from 'expo-constants';

export function env(key) {
    return Constants.manifest.extra[key];
}