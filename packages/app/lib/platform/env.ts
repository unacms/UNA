import Constants from 'expo-constants';
export function env(key: string) {
    return Constants.expoConfig!.extra![key];
}