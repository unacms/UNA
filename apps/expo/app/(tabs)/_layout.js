import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';
import { ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { appSetting } from 'app/lib/util';
import { useEffect } from 'react'
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from 'app/lib/query-client'
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
import { remoteSettings } from 'app/settings/remote';
import { getRemoteSettings } from 'app/config';
import { StatusBar } from 'react-native';
import { useLayoutSettings } from 'app/context/layout-settings';
import { Uniwind } from 'uniwind';
import { Platform } from 'react-native';

const AppLayout = React.memo(() => {

    /*if (appSetting('native', 'disable_screenshots')) {
        RNScreenshotPrevent.enabled(true);
        RNScreenshotPrevent.enableSecureView();
    }*/

    // Call all hooks at the top in a stable order
    // Call useLayoutSettings only once to avoid hook-order violations
    const { langCode, themeName } = useLayoutSettings();
    const scheme = useColorScheme();

    useEffect(() => {
        (async () => {
            remoteSettings.data = await getRemoteSettings();
        })();
    }, []);


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

    // Compute theme manually to avoid extra hook calls via useTheme()
    const actualThemeName = themeName != 'auto' ? themeName : scheme;

    useEffect(() => {
        Uniwind.setTheme(themeName != 'auto' ? themeName : 'system');
    }, [themeName]);

    const theme = useMemo(() => {
        const lightTheme = appSetting('theme', 'light');
        const darkTheme = appSetting('theme', 'dark');
        const CustomLightTheme = {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                ...lightTheme
            },
        };
        const CustomDarkTheme = {
            ...DarkTheme,
            colors: {
                ...DarkTheme.colors,
                ...darkTheme
            },
        };
        return actualThemeName === 'dark' ? CustomDarkTheme : CustomLightTheme;
    }, [actualThemeName]);

    const { colors } = theme;

    const containerStyle = useMemo(() => ({
        flex: 1,
        backgroundColor: colors.safeAreaBackground || colors.barsBackground,
    }), [colors.safeAreaBackground, colors.barsBackground]);

    return (
        <ThemeProvider value={theme} >
            <StatusBar backgroundColor={colors.barsBackground} translucent={true} />
            <JotaiProvider>
                <NetworkStatus >
                    <QueryClientProvider client={queryClient}>
                        <SafeAreaView edges={Platform.OS === 'android' ? ['top', 'bottom', 'left', 'right'] : ['left', 'right']} style={containerStyle}>
                            <Tabs />
                            <PortalHost />
                        </SafeAreaView>
                    </QueryClientProvider>
                </NetworkStatus>
            </JotaiProvider>
        </ThemeProvider>
    );
});

export default AppLayout;
