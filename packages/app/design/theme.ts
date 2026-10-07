import { DarkTheme, DefaultTheme } from "app/design/navigation-theme";
import { useSyncExternalStore } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import { useLayoutSettings } from 'app/context/layout-settings';

export type ThemeName = 'light' | 'dark';

/** react-navigation theme with the app palette (`theme.light` / `theme.dark` settings) merged into `colors`. */
export type AppTheme = Omit<typeof DefaultTheme, 'colors'> & {
    colors: typeof DefaultTheme.colors & Record<string, string>;
};

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function getWebSystemThemeName(): ThemeName {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'light';
    }

    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function subscribeToWebSystemTheme(onStoreChange: () => void) {
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

export function useTheme(): AppTheme {

    const lightTheme = appSetting('theme', 'light');
    const CustomLightTheme: AppTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            ...lightTheme
        },
    };

    const darkTheme = appSetting('theme', 'dark');
    const CustomDarkTheme: AppTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            ...darkTheme
        },
    };

    return useThemeValue(CustomLightTheme, CustomDarkTheme);
}

/** User choice from layout settings, or the system scheme when set to `auto`. */
export function useResolvedThemeName(): ThemeName {
    const { themeName } = useLayoutSettings();
    const nativeSystemThemeName = useColorScheme();
    const webSystemThemeName = useSyncExternalStore(
        subscribeToWebSystemTheme,
        getWebSystemThemeName,
        (): ThemeName => 'light'
    );
    const systemThemeName = Platform.OS === 'web' ? webSystemThemeName : nativeSystemThemeName;

    if (themeName && themeName !== 'auto') return themeName as ThemeName;
    // Native can report 'unspecified' (no system preference); treat anything but dark as light.
    return systemThemeName === 'dark' ? 'dark' : 'light';
}

export function useThemeName(): ThemeName {
    return useResolvedThemeName();
}

/** Pick light vs dark value from the resolved theme name. */
export function useThemeValue<T>(light: T, dark?: T): T {
    return useThemeName() === 'dark' ? dark ?? light : light;
}

export const Theme = useTheme;
export const ThemeName = useThemeName;
export const ThemeValue = useThemeValue;

