import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs, { getNativeTabsHostStyle } from 'app/components/nav/tabs';
import React, { useMemo } from 'react';
import { ThemeProvider } from "expo-router/react-navigation";
import { isAndroid, isNativeTabsEnabled } from 'app/lib/util';
import { useEffect } from 'react'
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from 'app/lib/platform/query-client'
import { Provider as JotaiProvider } from 'jotai'
import { NetworkStatus } from 'app/ui/molecules/system/net-info';

//import RNScreenshotPrevent, { addListener } from 'react-native-screenshot-prevent';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/customization/translation';
import '../../global.combined.css';

// Initialize i18n synchronously before first render so useTranslation stays stable
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources: resources,
        lng: 'en', // initial language, updated in useEffect
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });
}
import { StatusBar } from 'react-native';
import { useLayoutSettings } from 'app/context/layout-settings';
import { Uniwind } from 'uniwind';
import { View } from 'react-native';
import { useTheme } from 'app/design/theme';

const AppLayout = React.memo(() => {

    /*if (appSetting('native', 'disable_screenshots')) {
        RNScreenshotPrevent.enabled(true);
        RNScreenshotPrevent.enableSecureView();
    }*/

    const { langCode, themeName } = useLayoutSettings();


    useEffect(() => {
        /* console.log('OneSignal: Start initialization');
         OneSignal.Debug.setLogLevel(LogLevel.Verbose);
 
         // OneSignal Initialization
         OneSignal.initialize(appSetting('config', 'api_keys', 'onesignal'));
 
         // requestPermission will show the native iOS or Android notification permission prompt.
         // We recommend removing the following code and instead using an In-App Message to prompt for notification permission
         OneSignal.Notifications.requestPermission(true);
 */
        // Method for listening for notification clicks
        /*OneSignal.Notifications.addEventListener('click', (event) => {
            //console.log('OneSignal: notification clicked:', event);
        });*/
    }, []);

    useEffect(() => {
        // i18n is already initialized synchronously — just update language
        if (i18n.isInitialized && langCode) {
            i18n.changeLanguage(langCode);
        }
    }, [langCode]);

    useEffect(() => {
        Uniwind.setTheme(themeName !== 'auto' ? themeName : 'system');
    }, [themeName]);

    const theme = useTheme();
    const { colors } = theme;

    const nativeTabs = isNativeTabsEnabled();
    const hostStyle = nativeTabs ? getNativeTabsHostStyle() : { flex: 1 };
    const containerStyle = useMemo(() => [
        hostStyle,
        {
            backgroundColor: nativeTabs
                ? (colors.background || 'transparent')
                : (colors.safeAreaBackground || colors.barsBackground),
        },
    ], [hostStyle, nativeTabs, colors.background, colors.safeAreaBackground, colors.barsBackground]);

    // NativeTabs must be edge-to-edge. A SafeAreaView (even left/right only)
    // shrinks the host; iOS then adds the home-indicator gap again and the
    // floating bar sits higher than in other apps.
    const safeEdges = isAndroid
        ? ['top', 'bottom', 'left', 'right']
        : ['left', 'right'];
    const Shell = nativeTabs ? View : SafeAreaView;
    const shellProps = nativeTabs ? { style: containerStyle } : { edges: safeEdges, style: containerStyle };

    return (
        <ThemeProvider value={theme} >
            <StatusBar
                backgroundColor={nativeTabs ? 'transparent' : colors.barsBackground}
                translucent={true}
            />
            <JotaiProvider>
                <NetworkStatus >
                    <QueryClientProvider client={queryClient}>
                        <Shell {...shellProps}>
                            <Tabs />
                            <PortalHost />
                        </Shell>
                    </QueryClientProvider>
                </NetworkStatus>
            </JotaiProvider>
        </ThemeProvider>
    );
});

export default AppLayout;
