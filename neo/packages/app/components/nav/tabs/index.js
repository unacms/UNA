import { useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getPageData, parseUrl, isAndroid, isIos, isNativeTabsEnabled } from 'app/lib/util';
import { Appearance, BackHandler, Text } from 'react-native';
import { getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { useEffect, useMemo, useState } from 'react';
import { scheduleOneSignalSubscription } from 'app/lib/platform/one-signal';
import * as Linking from 'expo-linking';
import Suggestions from 'app/ui/molecules/misc/suggestions';
import AsyncWorker from 'app/ui/molecules/system/async-worker';
import Subscriber from 'app/ui/molecules/system/subscriber';
import { useFonts } from 'expo-font';
import { enableFreeze, enableScreens } from 'react-native-screens';
import fonts from 'app/customization/design/fonts/fonts';
import { staticComponents } from 'app/customization/static';
import { useLayoutSettings } from 'app/context/layout-settings';
import { registerAll } from 'app/components/registry-init';
import { useTheme } from 'app/design/theme';
import * as SplashScreen from 'expo-splash-screen';
import {
    canGoBackInTab,
    dismissNavigationOverlays,
    getSelectedTab,
    getTabKeyFromPathname,
    navigateBackInTab,
    rememberSelectedTab,
    resetAllTabHistory,
} from 'app/lib/navigation/tab-history';
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache';
import BottomSheet from 'app/ui/molecules/dialogs/bottomsheet-content';
import { buildTabUrlIndex, getTabList, getTabRouteRootUrl, getTabsSessionKey, splitTabBarItems } from './tab-menu';

function getTabNavigator() {
    return isNativeTabsEnabled()
        ? require('./expoui-tabs').default
        : require('./native-tabs').default;
}

const HOST_STYLE = { flex: 1 };
let iosNativeTabsHostStyle = null;

/**
 * iOS 26 nested UITabBarController reserves the status-bar and home-indicator
 * slots on its own view. Negative window margins cancel both so tab screens
 * are truly edge-to-edge. Not a hook — settings + window insets only.
 */
export function getNativeTabsHostStyle() {
    if (!isIos || !isNativeTabsEnabled()) {
        return HOST_STYLE;
    }
    if (!iosNativeTabsHostStyle) {
        const win = getWindowSafeAreaInsets();
        // Window chrome only. Live insets.bottom can jump to the keyboard
        // height and yank the whole shell (and modals) upward.
        iosNativeTabsHostStyle = [HOST_STYLE, {
            marginTop: -(win.top || 0),
            marginBottom: -(win.bottom || 0),
        }];
    }
    return iosNativeTabsHostStyle;
}

enableScreens(appSetting('native', 'enable_screens'));
// Frozen screens drop SwiftUI Hosts; thawing remounts glass subtabs (~0.5s slide-in).
if (isNativeTabsEnabled()) {
    enableFreeze(false);
}
registerAll();

/** Cold-start bootstrap: fail fast offline instead of 3×15s fetcher retries. */
const BOOTSTRAP_TIMEOUT_MS = 5000;
/** AbortController is unreliable on some Android RN builds — race a hard timer. */
const BOOTSTRAP_HARD_TIMEOUT_MS = 5500;

/**
 * `<scheme>://expo-development-client/?url=<metro>` — what `expo run:ios` /
 * `run:android` open to point a dev client at Metro. Not an app route: without
 * a dev launcher it reaches us as the initial URL, and its `?url=` query would
 * become the home tab's page ("/?url=http://…:8081"), which loads nothing.
 */
const DEV_CLIENT_URL = /^[a-z][\w.+-]*:\/\/expo-development-client(?:[/?]|$)/i;

function processUrl(url, router, currentUser, TabList) {
    if (DEV_CLIENT_URL.test(url)) return;
    if (currentUser?.id) {
        const LinksForTabs = buildTabUrlIndex(TabList);

        let a = parseUrl(url);
        let _path = '/' + a.path + (a.queryString ? '?' + a.queryString : '')
        if (_path === '/')
            _path = '/home';

        const index = LinksForTabs?.find((item) => _path.includes(item.url))?.index ?? -1;
        const isRoot = index > -1 && getTabRouteRootUrl(index, TabList, currentUser) === _path;
        // Without a url the More tab keeps its last page (expo-screen.js), so name its root.
        const isMoreTab = index === splitTabBarItems(TabList).moreTabIndex;


        if (index > -1) {
            rememberSelectedTab(`/tab${index}`);
            const route = {
                pathname: `/tab${index}`,
                ...(isRoot && !isMoreTab ? {} : { params: { url: _path } })
            };
            router.push(route);
        } else {
            rememberSelectedTab('/tab0');
            router.push({
                pathname: '/tab0',
                params: { url: _path }
            });
        }
    }
}


export default function Tabs() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [bootstrapError, setBootstrapError] = useState(false);
    const { themeName } = useLayoutSettings();
    const [fontsLoaded, fontError] = useFonts(fonts);
    const fontsReady = fontsLoaded || Boolean(fontError);
    const router = useRouter();
    const pathname = usePathname();
    const { colors } = useTheme();
    const isShowTabs = (currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged')
    const TabList = useMemo(
        () => getTabList(currentUser),
        [currentUser?.id]
    );

    const tabsSessionKey = getTabsSessionKey(currentUser);


    useEffect(() => {
        if (themeName !== 'auto') {
            Appearance.setColorScheme(themeName);
        }
    }, [themeName]);

    // DEEP LINKING

    useEffect(() => {
        // process links if app close
        const fetchInitialUrl = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
                processUrl(url, router, currentUser, TabList);
            }
        };

        fetchInitialUrl();

        const handleUrl = (event) => {
            const url = event.url;
            if (url) {
                setTimeout(() => {
                    processUrl(url, router, currentUser, TabList);
                }, 3000);
            }
        };

        // process links if app open
        if (currentUser?.id) {
            const urlListener = Linking.addEventListener('url', handleUrl);
            return () => {
                urlListener.remove();
            };
        }

    }, [currentUser?.id]);

    useEffect(() => {
        resetAllTabHistory();
        clearAllPageCache();
        rememberSelectedTab(getTabKeyFromPathname(pathname));
    }, [currentUser?.id, currentUser?.confirmed]);
    // DEEP LINKING

    // Android system Back → one in-tab history pop (same as header back), not RN global history.
    useEffect(() => {
        if (!isAndroid) return;

        const onHardwareBackPress = () => {
            if (dismissNavigationOverlays()) {
                return true;
            }

            const tabKey = getTabKeyFromPathname(pathname);
            if (canGoBackInTab(tabKey)) {
                navigateBackInTab(router, tabKey, currentUser);
                return true;
            }

            return false;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => subscription.remove();
    }, [pathname, router, currentUser]);

    useEffect(() => {
        if (currentUser) {
            return scheduleOneSignalSubscription(currentUser, {
                askPermission: appSetting('notifications', 'onesignal_request_on_load') ?? appSetting('native', 'onesignal_request_on_load'),
            });
        }
    }, [currentUser?.id]);



    useEffect(() => {
        if (currentUser !== null || bootstrapError) return;

        let cancelled = false;
        let hardTimer = null;

        const hardTimeout = new Promise((_, reject) => {
            hardTimer = setTimeout(
                () => reject(new Error('Bootstrap hard timeout')),
                BOOTSTRAP_HARD_TIMEOUT_MS
            );
        });

        (async () => {
            try {
                const data = await Promise.race([
                    getPageData('home', false, {
                        timeoutMs: BOOTSTRAP_TIMEOUT_MS,
                        maxAttempts: 1,
                        silent: true,
                    }),
                    hardTimeout,
                ]);
                if (cancelled) return;
                if (!data?.data) {
                    setBootstrapError(true);
                    void SplashScreen.hideAsync().catch(() => {});
                    return;
                }
                setCurrentUser(data.data.user ?? false);
            } catch {
                if (!cancelled) {
                    setBootstrapError(true);
                    void SplashScreen.hideAsync().catch(() => {});
                }
            } finally {
                if (hardTimer) clearTimeout(hardTimer);
            }
        })();

        return () => {
            cancelled = true;
            if (hardTimer) clearTimeout(hardTimer);
        };
    }, [currentUser, bootstrapError, setCurrentUser]);

    useEffect(() => {
        if (!bootstrapError) return;
        void SplashScreen.hideAsync().catch(() => {});
    }, [bootstrapError]);

    useEffect(() => {
        if (!fontsReady || currentUser === null) {
            void SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsReady, currentUser]);

    // Conditional render: all hooks must run before this point
    // Prefer offline UI even if fonts are still loading (empty font map / hang).
    if (bootstrapError) {

        const OfflineScreen = staticComponents.bootstrap_offline;
        return OfflineScreen
            ? <OfflineScreen onRetry={() => setBootstrapError(false)} />
            : <Text>OfflineScreen</Text>;
    }

    if (!fontsReady || currentUser === null) {
        return null;
    }

    if (!getSelectedTab()) {
        rememberSelectedTab(getTabKeyFromPathname(pathname));
    }
    
    const nativeTabs = isNativeTabsEnabled();
    const Navigator = getTabNavigator();

    return (
        <>
            <Suggestions />
            <Subscriber />
            <View className="flex-1">
                {nativeTabs ? null : (
                    <View className="w-full z-50"><AsyncWorker /></View>
                )}
                <Navigator
                    TabList={TabList}
                    currentUser={currentUser}
                    colors={colors}
                    isShowTabs={isShowTabs}
                    tabsSessionKey={tabsSessionKey}
                />
                {nativeTabs ? (
                    <View pointerEvents="box-none" className="absolute top-0 left-0 right-0 z-50">
                        <AsyncWorker />
                    </View>
                ) : null}
                <BottomSheet />
            </View>
        </>
    );
}
