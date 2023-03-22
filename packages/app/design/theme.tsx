import {
    DarkTheme,
    DefaultTheme,

} from "@react-navigation/native";

export const CustomLightTheme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#2563EB',
          barsBackground : '#FFFFFF',
          barsColor : '#4B5563',
        },
    };
   

export const CustomDarkTheme= {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#3B82F6',
          background : '#000000',
          barsBackground : '#111827',
          barsColor : '#D1D5DB',
        },
    };
