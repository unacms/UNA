
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';

import { Provider } from 'app/provider'
import { Stack } from 'expo-router'
import { Theme } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { CurrentUserProvider } from 'app/context/user';
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
import en from 'app/locales/en/translation.json';
import ru from 'app/locales/ru/translation.json';
import { remoteSettings } from 'app/settings-remote';
import { getRemoteSettings } from 'app/config';
import { StatusBar } from 'react-native';

const AppLayout = React.memo(() => {

    if (appSetting('layout', 'disable_screenshots')) {
        RNScreenshotPrevent.enableSecureView();
        RNScreenshotPrevent.enabled(true);
    }

    useEffect(() => {
        (async () => {
            remoteSettings.data = await getRemoteSettings();
        })();
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
            resources: {
                en: {
                    translation: en
                },
                ru: {
                    translation: ru
                }
            },
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
        backgroundColor: colors.barsBackground,
    }), [colors.barsBackground]);

    const scheme = useColorScheme();
    const queryClient = new QueryClient()

    return (
        <ThemeProvider value={Theme(scheme)} >
            <StatusBar translucent={false} />
            <Provider>
                <QueryClientProvider client={queryClient}>
                    <SafeAreaView edges={['left', 'right', 'bottom']} style={containerStyle}>
                        <CurrentUserProvider>
                            <Tabs />
                        </CurrentUserProvider>
                    </SafeAreaView>
                </QueryClientProvider>
            </Provider>
        </ThemeProvider>
    );
});

export default AppLayout;
