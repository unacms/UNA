export { 
    useRouter,
    usePathname
} from 'next/navigation';


export { default as Link } from 'next/link'
import type { NavigationLike, RouterLike, SafeAreaInsets } from './router.types';


export function useGlobalSearchParams(): null {
    return null;
}

export function useCurrentTabPath(): string {
    return '/tab0';
}

export function useNavigation(): null {
    return null;
}

export function useFocusEffect(_effect?: () => void | (() => void)): null {
    return null;
}

export function useIsFocused(): boolean {
    return true;
}

export function useSafeAreaInsets(): SafeAreaInsets {
    return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function useStableSafeAreaInsets(): SafeAreaInsets {
    return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function getWindowSafeAreaInsets(): SafeAreaInsets {
    return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function goBack(_navigation: NavigationLike, _router: RouterLike, callback?: () => void): void {
    if (callback){
        callback(); 
    }
    else{
        if (window.history.length >= 1) {
            window.history.back();
        } 
    }
}

export function useLocalSearchParams(): { url: string } {
    if (typeof window === 'undefined') return { url: '' };
    return { url: window.location.href };
}


/** Web: full navigation (reloads page JSON and the session from the server). */
export function redirectTo(_router: RouterLike, url: string, _tabname?: string): void {
    if (!url) return;
    const normalized = url.startsWith('/') || url.startsWith('http') ? url : `/${url}`;
    window.location.assign(normalized);
}
