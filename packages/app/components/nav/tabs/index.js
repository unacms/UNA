import { useRouter, usePathname } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getPageData, isAndroid, isIos, isNativeTabsEnabled } from 'app/lib/util';
import { Appearance, BackHandler, Text } from 'react-native';
import { getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { useEffect, useMemo, useState } from 'react';
import { scheduleOneSignalSubscription } from 'app/lib/platform/one-signal';
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
    hasPushedScreens,
    nativeTabPageHref,
    getSelectedTab,
    getTabKeyFromPathname,
    navigateBackInTab,
    rememberSelectedTab,
    resetAllTabHistory,
} from 'app/lib/navigation/tab-history';
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache';
import { subscribeDeepLink, takeDeepLink } from 'app/lib/navigation/deep-link';
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

/** Opens a linked UNA page (`/view-post?id=1`, from `app/lib/navigation/deep-link`) in its tab. */
function processUrl(path, router, currentUser, TabList) {
    if (currentUser?.id) {
        const LinksForTabs = buildTabUrlIndex(TabList);

        const index = LinksForTabs?.find((item) => path.includes(item.url))?.index ?? -1;
        const isRoot = index > -1 && getTabRouteRootUrl(index, TabList, currentUser) === path;
        // Without a url the More tab keeps its last page (expo-screen.js), so name its root.
        const isMoreTab = index === splitTabBarItems(TabList).moreTabIndex;


        const tabKey = index > -1 ? `/tab${index}` : '/tab0';
        rememberSelectedTab(tabKey);
        if (index > -1 && isRoot && !isMoreTab) {
            // The tab's root page: show it (pops pages pushed over it).
            router.navigate({ pathname: tabKey });
        } else if (isMoreTab) {
            router.navigate({ pathname: tabKey, params: { url: path } });
        } else {
            // Any other page opens over its tab's root, so back returns there.
            router.push(nativeTabPageHref(path, tabKey));
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
    // expo-router routes every link: app routes (`/pg`, `/tab3`) open as they are,
    // UNA pages reach the `[...path]` route, which queues them for us. A page
    // linked before sign-in waits until a member is signed in.
    useEffect(() => {
        if (!currentUser?.id) return;
        const openQueuedPage = () => {
            const path = takeDeepLink();
            if (path) {
                processUrl(path, router, currentUser, TabList);
            }
        };
        openQueuedPage();
        return subscribeDeepLink(openQueuedPage);
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
            // Pages pushed onto the tab's stack: the native stack pops them.
            if (hasPushedScreens(tabKey)) {
                return false;
            }
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
