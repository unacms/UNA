import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useSyncExternalStore } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import { useLayoutSettings } from 'app/context/layout-settings';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function getWebSystemThemeName() {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'light';
    }

    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function subscribeToWebSystemTheme(onStoreChange) {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', onStoreChange);
        return () => mediaQuery.removeEventListener('change', onStoreChange);
    }

    mediaQuery.addListener(onStoreChange);
    return () => mediaQuery.removeListener(onStoreChange);
}

export function useTheme() {

    const lightTheme = appSetting('theme', 'light');
    const CustomLightTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            ...lightTheme
        },
    };

    const darkTheme = appSetting('theme', 'dark');
    const CustomDarkTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            ...darkTheme
        },
    };

    return useThemeName() === 'dark' ? CustomDarkTheme : CustomLightTheme;
}

export function useResolvedThemeName() {
    const { themeName } = useLayoutSettings();
    const nativeSystemThemeName = useColorScheme();
    const webSystemThemeName = useSyncExternalStore(
        subscribeToWebSystemTheme,
        getWebSystemThemeName,
        () => 'light'
    );
    const systemThemeName = Platform.OS === 'web' ? webSystemThemeName : nativeSystemThemeName;

    return (themeName && themeName !== 'auto') ? themeName : (systemThemeName || 'light');
}

export function useThemeName() {
    return useResolvedThemeName();
}

export const Theme = useTheme;
export const ThemeName = useThemeName;

