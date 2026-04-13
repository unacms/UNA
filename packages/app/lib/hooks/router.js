export { 
    useLocalSearchParams,
    useRouter,
    useNavigation,
    useGlobalSearchParams,
    Link,
    Stack,
    Redirect,
    Tabs,
    usePathname,
    useFocusEffect
} from 'expo-router';

export { useSafeAreaInsets } from 'react-native-safe-area-context';

export function goBack(navigation, router, callback) {
     if (callback){
        callback(); 
    }
    else{
        if (navigation.getState().index > 0) {
            router.back();
        } 
    }
}

export function redirectTo(router, url) {
    const normalizedUrl = url?.startsWith('/') ? url : `/${url}`;

    router.replace({
        pathname: '/tab0',
        params: { url: normalizedUrl, refresh: Date.now() }
    })
}