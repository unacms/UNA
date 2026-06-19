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
    if (callback) {
        callback();
        return;
    }

    const canPopStack =
        navigation?.getState?.()?.index > 0 ||
        navigation?.canGoBack?.();

    if (canPopStack) {
        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        } else {
            router.back();
        }
    }
}

export function redirectTo(router, url, tabname = '/tab0') {
    const normalizedUrl = url?.startsWith('/') ? url : `/${url}`;

    router.replace({
        pathname: tabname,
        params: { url: normalizedUrl, refresh: Date.now() }
    })
}