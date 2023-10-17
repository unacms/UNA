import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import { storageGet } from 'app/lib/util'
import { Platform } from 'react-native'

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

    let scheme = useColorScheme();
    if(Platform.OS == 'web'){
      let theme = storageGet('layout:theme', '', true);
      if (theme != '')
        scheme = theme;
    }

    return scheme === 'dark' ? CustomDarkTheme : CustomLightTheme;
}   
