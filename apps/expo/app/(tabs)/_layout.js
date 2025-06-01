import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';
import { Theme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { useEffect } from 'react'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'

import RNScreenshotPrevent, { addListener } from 'react-native-screenshot-prevent';
import * as RNLocalize from "react-native-localize";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appSetting } from 'app/lib/util'
import { resources } from 'app/translation';
import { remoteSettings } from 'app/settings-remote';
import { getRemoteSettings } from 'app/config';
import { StatusBar } from 'react-native';
//import * as NavigationBar from "expo-navigation-bar";
import { Platform } from 'react-native'
import { LogLevel, OneSignal } from 'react-native-onesignal';



const AppLayout = React.memo(() => {

    if (appSetting('native', 'disable_screenshots')) {
        RNScreenshotPrevent.enabled(true);
        RNScreenshotPrevent.enableSecureView();
    }

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


    const languageDetector = {
        type: 'languageDetector',
        async: true,
        detect: async (callback) => {
            const locale = await RNLocalize.getLocales();
            callback(locale[0].languageCode);
        },
        init: () => { },
        cacheUserLanguage: () => { },
    };

    i18n
        .use(initReactI18next)
        .use(languageDetector)
        .init({
            compatibilityJSON: 'v3',
            resources: resources,
            lng: 'en', // default language
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false
            }
        });

    const { colors } = Theme();

    const containerStyle = useMemo(() => ({
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        backgroundColor: colors.safeAreaBackground || colors.barsBackground,
    }), [colors.safeAreaBackground, colors.barsBackground]);

    const scheme = useColorScheme();
    const queryClient = new QueryClient()

    /*if (Platform.OS != 'ios'){
        NavigationBar.setBackgroundColorAsync(colors.barsBackground);
    }*/
    return (
        <ThemeProvider value={Theme(scheme)} >
            <StatusBar backgroundColor={colors.barsBackground}

                translucent={true} />
                <QueryClientProvider client={queryClient}>
                    <SafeAreaView edges={['left', 'right']} style={containerStyle}>
                        <Tabs />
                    </SafeAreaView>
                </QueryClientProvider>
        </ThemeProvider>
    );
});

export default AppLayout;
