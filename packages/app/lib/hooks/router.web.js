export { 
    useRouter,
    usePathname
} from 'next/navigation';


export { default as Link } from 'next/link'

export function useGlobalSearchParams() {
    return null;
}

export function useNavigation() {
    return null;
}

export function useFocusEffect() {
    return null;
}

export function useSafeAreaInsets() {
    return { top: 0, right: 0, bottom: 0, left: 0 };
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

export function useLocalSearchParams() {
    return { url: window.location.href };
}


export function redirectTo(router, url) {
    if (!url) return;
    const normalized = url.startsWith('/') || url.startsWith('http') ? url : `/${url}`;
    window.location.assign(normalized);
}