import {
    DarkTheme,
    DefaultTheme,

} from "@react-navigation/native";

export const CustomLightTheme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#3B82F6',
          barsBackground : '#FFFFFF',
          barsColor : '#1F2937',
        },
    };
   

export const CustomDarkTheme= {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#3B82F6',
          barsBackground : '#111928',
          barsColor : '#F3F4F6',
        },
    };
