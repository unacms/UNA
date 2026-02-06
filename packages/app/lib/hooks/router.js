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
    if (navigation.getState().index === 0) {
        callback?.();
    } else {
        router.back();
    }
}

export function redirectTo(router, url) {
    //router.replace(url);
    router.replace({
        pathname: '/tab0',
        params: { url: url }
    })
}