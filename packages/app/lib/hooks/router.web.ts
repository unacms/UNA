export { 
    useRouter,
    usePathname
} from 'next/navigation';


export { default as Link } from 'next/link'
import { useSyncExternalStore } from 'react';
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

function subscribeLocation(onChange: () => void): () => void {
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
        window.removeEventListener('hashchange', onChange);
        window.removeEventListener('popstate', onChange);
    };
}

const getHref = (): string => window.location.href;
const getServerHref = (): string => '';

/**
 * The current URL, as an external store: a plain `window.location.href` read
 * goes stale. The React Compiler keeps the first value a component read, and
 * Next renders the new page before it pushes the new URL; the store is checked
 * again after commit. Hash changes on the same page (and back / forward
 * between hashes) re-render it too.
 */
export function useLocalSearchParams(): { url: string } {
    const url = useSyncExternalStore(subscribeLocation, getHref, getServerHref);
    return { url };
}


/** Web: full navigation (reloads page JSON and the session from the server). */
export function redirectTo(_router: RouterLike, url: string, _tabname?: string): void {
    if (!url) return;
    const normalized = url.startsWith('/') || url.startsWith('http') ? url : `/${url}`;
    window.location.assign(normalized);
}
