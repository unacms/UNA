import { useMemo } from 'react';
import { 
    useRouter as _useRouter,
    usePathname as _usePathname
} from 'next/navigation';

export function useLocalSearchParams() {
    return { url: window.location.href };
}

export function useGlobalSearchParams() {
    return null;
}

export function useRouter() {
    return _useRouter();
}

export function usePathname() {
    return _usePathname();
}

export function useNavigation() {
    return null;
}

export function useSafeAreaInsets() {
    return null;
}

export function goBack(navigation, router, callback){
    if (callback){
        callback(); 
    }
    else{
        if (window.history.length <= 1) {
            window.history.back();
        } 
    }
}

export function redirectTo(router, url){
    document.location = url
}