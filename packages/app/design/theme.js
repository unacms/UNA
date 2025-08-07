import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import { useLayoutSettings } from 'app/context/layout-settings';

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

export function ThemeName() {
    const { themeName } = useLayoutSettings();
    const def = useColorScheme();
    console.log("themeName", themeName != 'auto' ? themeName : def)
    return themeName != 'auto' ? themeName : def;
}

