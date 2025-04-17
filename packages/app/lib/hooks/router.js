import { 
    useLocalSearchParams as _useLocalSearchParams, 
    useRouter as _useRouter, 
    useNavigation as _useNavigation, 
    useGlobalSearchParams as _useGlobalSearchParams, 
    Link as _Link,
    Stack as _Stack,
    Redirect as _Redirect,
    Tabs as _Tabs
} from 'expo-router';
import { useSafeAreaInsets as _useSafeAreaInsets } from 'react-native-safe-area-context';

export const Stack = _Stack
export const Link = _Link
export const Redirect = _Redirect
export const Tabs = _Tabs

export function useLocalSearchParams() {
    return _useLocalSearchParams();
}

export function useSafeAreaInsets() {
    return _useSafeAreaInsets();
}

export function useRouter() {
    return _useRouter();
}

export function useNavigation() {
    return _useNavigation();
}

export function useGlobalSearchParams() {
    return _useGlobalSearchParams();
}

export function usePathname() {
    return null;
}

export function goBack(navigation, router, callback){
    if (navigation.getState().index == 0){
        callback && callback(); 
    }
    else{
        router.back()
    }
}

export function redirectTo(router, url){
    router.replace(url)
}