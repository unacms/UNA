import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'

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
  const CustomDarkTheme= {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          ...darkTheme
        },
    };

    const scheme = useColorScheme();
    return scheme === 'dark' ? CustomDarkTheme : CustomDarkTheme;
}   
