import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { appSetting, storageGet, storageSet } from 'app/lib/util'
import { Platform } from 'react-native'
import { create } from 'zustand';
import { useCallback, useMemo } from 'react';


export function Theme() {

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

    return ThemeName() === 'dark' ? CustomDarkTheme : CustomLightTheme;
}


export function getInitialTheme() {
    if (Platform.OS === 'web') {
        const saved = storageGet('layout:theme', null, true);
        const defaultTheme = appSetting('native', 'default_theme');

        if (saved && saved !== 'auto') {
            return saved; // 'light' or 'dark'
        }
        // Treat 'auto' as system default
        return defaultTheme === 'auto' ? null : defaultTheme;
    }
    return null;
}


export const useThemeStore = create((set) => ({
    userTheme: getInitialTheme(),
    setUserTheme: (theme) => {
        set({ userTheme: theme });
        if (Platform.OS === 'web') {
            storageSet('layout:theme', theme, true);
        }
    },
}));

export function useThemeName() {
    const userTheme = useThemeStore((state) => state.userTheme);
    const setUserTheme = useThemeStore((state) => state.setUserTheme);
    const systemScheme = useColorScheme();

    const themeName = useMemo(() => {
        if (userTheme) {
            return userTheme;
        }
        return systemScheme === 'dark' ? 'dark' : 'light';
    }, [userTheme, systemScheme]);

    return { themeName, setThemeName: setUserTheme };
}


export function ThemeName() {
    const { themeName } = useThemeName();
    return themeName;
}

