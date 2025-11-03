import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';
import { Theme, ThemeName } from 'app/design/theme'
import { ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { appSetting } from 'app/lib/util';
import { useEffect } from 'react'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'

//import RNScreenshotPrevent, { addListener } from 'react-native-screenshot-prevent';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from 'app/translation';

// Инициализируем i18n синхронно до первого рендера, чтобы useTranslation всегда работал стабильно
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources: resources,
        lng: 'en', // начальный язык, будет обновлен в useEffect
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });
}
import { remoteSettings } from 'app/settings-remote';
import { getRemoteSettings } from 'app/config';
import { StatusBar } from 'react-native';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { useLayoutSettings } from 'app/context/layout-settings';


const AppLayout = React.memo(() => {

    /*if (appSetting('native', 'disable_screenshots')) {
        RNScreenshotPrevent.enabled(true);
        RNScreenshotPrevent.enableSecureView();
    }*/

    // Вызываем все хуки в начале компонента в стабильном порядке
    // Вызываем useLayoutSettings только один раз, чтобы избежать нарушения порядка хуков
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
        // i18n уже инициализирован синхронно, просто обновляем язык
        if (i18n.isInitialized && langCode) {
            i18n.changeLanguage(langCode);
        }
    }, [langCode]);
    
    // Вычисляем тему вручную, чтобы избежать повторных вызовов хуков через Theme()
    const actualThemeName = useMemo(() => {
        return themeName != 'auto' ? themeName : scheme;
    }, [themeName, scheme]);
    
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
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        backgroundColor: colors.safeAreaBackground || colors.barsBackground,
    }), [colors.safeAreaBackground, colors.barsBackground]);

    const queryClient = useMemo(() => new QueryClient(), []);

    return (
        <ThemeProvider value={theme} >
            <StatusBar backgroundColor={colors.barsBackground} translucent={true} />
                <QueryClientProvider client={queryClient}>
                    <SafeAreaView edges={['left', 'right']} style={containerStyle}>
                        <Tabs />
                    </SafeAreaView>
                </QueryClientProvider>
        </ThemeProvider>
    );
});

export default AppLayout;
